/**
 * Workers AI bridge.
 * - runChatFrames: chat + tool-calling (and native multimodal vision via
 *   `image_url` content parts), streamed via OpenAI-compatible SSE chunks
 *   (data: lines with choices[].delta).
 */
import type { Frame, ParsedToolCall, ToolCatalogEntry } from "./types";
import { openGatewayChat, type GatewayEnv } from "./gateway";

export type RunChatEnv = GatewayEnv;

export interface RunChatParams {
    systemContext: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
    userMessage: string;
    conversationId: string;
    tools: ToolCatalogEntry[];
    images?: string[];
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

type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

/** Plain string when no images; otherwise a multimodal content-part array (text + image_url). */
const buildUserContent = (text: string, images?: string[]): string | ContentPart[] => {
    if (!images || images.length === 0) return text;
    return [{ type: "text", text }, ...images.map((url): ContentPart => ({ type: "image_url", image_url: { url } }))];
};

/**
 * Streams one chat turn. Yields text deltas live; tool_calls are accumulated
 * across the SSE stream (OpenAI tool-call deltas split args.string by index)
 * and emitted ONCE after the stream closes with parsed JSON args.
 * Generator returns the accumulated RawChatResult for the caller to persist.
 */
export const runChatFrames = async function* (
    env: RunChatEnv,
    params: RunChatParams
): AsyncGenerator<Frame, RawChatResult> {
    const messages = [
        { role: "system", content: params.systemContext },
        ...params.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: buildUserContent(params.userMessage, params.images) }
    ];

    // `thinking: false` suppresses chain-of-thought emission — chain models in
    // the gateway chain otherwise leak reasoning into chat text (CLAUDE.md
    // warning #19). Low temperature keeps tool-arg JSON deterministic.
    const input: Record<string, unknown> = {
        messages,
        max_tokens: params.maxTokens ?? 2048,
        temperature: 0.2,
        chat_template_kwargs: { thinking: false },
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
        const gatewayResult = await openGatewayChat(env, input, {
            conversationId: params.conversationId
        });
        stream = gatewayResult.stream;
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
