/**
 * Server-side Workers AI client. `runChatFrames` invokes the chat model in
 * streaming mode and yields a `Frame` stream; `describeImage` runs a vision
 * model for image-attachment turns (the chat model is text-only).
 *
 * Model: @cf/openai/gpt-oss-120b — an OpenAI-chat-completions-compatible model
 * on Workers AI (SSE chunks with `choices[].delta`, OpenAI-style tool calls).
 */
import type { Frame, ParsedToolCall, ToolCatalogEntry } from "./types";

/** Chat / tool-calling model. */
export const MODEL_ID = "@cf/openai/gpt-oss-120b" as const;
/** Vision model used only for image-attachment turns. */
export const VISION_MODEL_ID = "@cf/meta/llama-3.2-11b-vision-instruct" as const;

/** Minimal structural type for the Workers AI binding — the generated `Ai`
 *  type does not include every model, so the endpoint casts to this. */
export interface AiBinding {
    run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

export interface RunChatParams {
    systemContext: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
    userMessage: string;
    tools: ToolCatalogEntry[];
    maxTokens?: number;
}

interface StreamToolCallDelta {
    index?: number;
    id?: string | null;
    function?: { name?: string | null; arguments?: string | null };
}

interface StreamChunk {
    choices?: Array<{
        delta?: { content?: string | null; tool_calls?: StreamToolCallDelta[] };
    }>;
}

const buildToolsPayload = (tools: ToolCatalogEntry[]) =>
    tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters }
    }));

/**
 * Streams a single model turn. Yields `text` and `tool_call` frames as they
 * arrive and returns the accumulated `RawChatResult` for the caller to persist.
 */
export const runChatFrames = async function* (
    ai: AiBinding,
    params: RunChatParams
): AsyncGenerator<Frame, RawChatResult> {
    const messages = [
        { role: "system", content: params.systemContext },
        ...params.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: params.userMessage }
    ];

    const input: Record<string, unknown> = {
        messages,
        max_completion_tokens: params.maxTokens ?? 2048,
        temperature: 0.2,
        reasoning_effort: "medium",
        stream: true,
        stream_options: { include_usage: true }
    };
    if (params.tools.length > 0) {
        input.tools = buildToolsPayload(params.tools);
    }

    const result: RawChatResult = { text: "", toolCalls: [] };
    const toolAccum = new Map<number, { id: string; name: string; argsText: string }>();

    let stream: ReadableStream<Uint8Array>;
    try {
        stream = (await ai.run(MODEL_ID, input)) as ReadableStream<Uint8Array>;
    } catch (err) {
        yield { t: "error", message: err instanceof Error ? err.message : "Model invocation failed" };
        return result;
    }

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let newlineIdx = buffer.indexOf("\n");
            while (newlineIdx !== -1) {
                const line = buffer.slice(0, newlineIdx).trim();
                buffer = buffer.slice(newlineIdx + 1);
                newlineIdx = buffer.indexOf("\n");
                if (!line.startsWith("data:")) continue;
                const payload = line.slice(5).trim();
                if (payload.length === 0 || payload === "[DONE]") continue;
                let chunk: StreamChunk;
                try {
                    chunk = JSON.parse(payload) as StreamChunk;
                } catch {
                    continue;
                }
                const delta = chunk.choices?.[0]?.delta;
                if (!delta) continue;
                if (typeof delta.content === "string" && delta.content.length > 0) {
                    result.text += delta.content;
                    yield { t: "text", delta: delta.content };
                }
                if (Array.isArray(delta.tool_calls)) {
                    for (const tc of delta.tool_calls) {
                        const idx = typeof tc.index === "number" ? tc.index : 0;
                        let entry = toolAccum.get(idx);
                        if (!entry) {
                            entry = {
                                id: tc.id && tc.id.length > 0 ? tc.id : crypto.randomUUID(),
                                name: "",
                                argsText: ""
                            };
                            toolAccum.set(idx, entry);
                        } else if (tc.id && tc.id.length > 0) {
                            entry.id = tc.id;
                        }
                        const fn = tc.function;
                        if (fn) {
                            if (typeof fn.name === "string" && fn.name.length > 0) entry.name = fn.name;
                            if (typeof fn.arguments === "string") entry.argsText += fn.arguments;
                        }
                    }
                }
            }
        }
    } catch (err) {
        yield { t: "error", message: err instanceof Error ? err.message : "Stream read failed" };
        return result;
    } finally {
        reader.releaseLock();
    }

    for (const entry of toolAccum.values()) {
        if (entry.name.length === 0) continue;
        let args: unknown = {};
        if (entry.argsText.trim().length > 0) {
            try {
                args = JSON.parse(entry.argsText);
            } catch {
                args = {};
            }
        }
        const call: ParsedToolCall = { id: entry.id, name: entry.name, args };
        result.toolCalls.push(call);
        yield { t: "tool_call", id: call.id, name: call.name, args: call.args };
    }

    return result;
};

export interface RawChatResult {
    text: string;
    toolCalls: ParsedToolCall[];
}

const dataUrlToBytes = (dataUrl: string): number[] => {
    const comma = dataUrl.indexOf(",");
    const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    const binary = atob(base64);
    const bytes = new Array<number>(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
};

/**
 * Best-effort image-to-text for vision turns. Returns a plain-text description
 * of the orders/amounts visible in the image, or "" if extraction fails.
 */
export const describeImage = async (ai: AiBinding, imageDataUrl: string): Promise<string> => {
    try {
        const raw = (await ai.run(VISION_MODEL_ID, {
            image: dataUrlToBytes(imageDataUrl),
            prompt: "This is a screenshot from an e-commerce order workflow. Transcribe every order you can see — recipient name, phone, delivery address, and the order total/amount — as a plain text list. Be exact with numbers. If a field is not visible, omit it.",
            max_tokens: 1024
        })) as { response?: string; description?: string };
        return (raw.response ?? raw.description ?? "").trim();
    } catch {
        return "";
    }
};
