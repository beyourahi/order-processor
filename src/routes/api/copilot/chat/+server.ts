/**
 * Copilot SSE chat endpoint.
 *
 * CONTRACT
 * - Stateless: client ships full conversation + pre-rendered CURRENT STATE every turn.
 * - Server only DECIDES tool calls; executor.ts in the browser RUNS them.
 * - Validates tool args against argSchemas; one corrective retry per turn.
 * - Frames out: text → tool_call(s) → end | error (see Frame in $lib/ai/types).
 */
import { error } from "@sveltejs/kit";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import type { RequestHandler } from "./$types";
import { runChatFrames, describeImage, type AiBinding, type RunChatEnv } from "$lib/ai/client";
import { sseStream } from "$lib/ai/streaming";
import { buildSystemContext, FEW_SHOTS, titleFromMessage } from "$lib/ai/prompts";
import { TOOLS_CATALOG } from "$lib/ai/tools-catalog";
import { argSchemas, isKnownToolName } from "$lib/ai/schemas";
import { retrieveAppKnowledge, formatKnowledge, type RagEnv } from "$lib/ai/rag";
import { createConversation, getConversation, touchUpdatedAt } from "$lib/server/repositories/ai-conversations";
import { appendMessage } from "$lib/server/repositories/ai-messages";
import type { ParsedToolCall } from "$lib/ai/types";

const bodySchema = z.object({
    conversationId: z.string().nullable().optional(),
    messages: z
        .array(
            z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string().max(12000)
            })
        )
        .min(1)
        .max(80),
    contextText: z.string().max(60000),
    image: z.string().max(8_000_000).optional()
});

interface ValidatedCall {
    call: ParsedToolCall;
    valid: boolean;
    error?: string;
}

const validateToolCalls = (calls: ParsedToolCall[]): ValidatedCall[] =>
    calls.map((call) => {
        if (!isKnownToolName(call.name)) {
            return { call, valid: false, error: `Unknown tool "${call.name}"` };
        }
        const result = argSchemas[call.name].safeParse(call.args ?? {});
        if (!result.success) {
            return {
                call,
                valid: false,
                error: result.error.issues[0]?.message ?? "Invalid arguments"
            };
        }
        return { call: { ...call, args: result.data }, valid: true };
    });

const correctiveMessage = (invalid: ValidatedCall[]): string =>
    [
        "Your previous tool call(s) failed schema validation:",
        ...invalid.map((v) => `- "${v.call.name}": ${v.error}`),
        "",
        "Re-issue the corrected tool call(s) now. Argument names and types must exactly match each tool's schema. If you cannot produce a valid call, reply with a short plain-text explanation instead."
    ].join("\n");

/** Retry prompt for when the model writes a tool call as chat text instead of calling it. */
const LEAK_RETRY_MESSAGE =
    "Your previous response wrote the action as a chat message instead of calling a tool, so nothing happened. Re-issue it now as a real tool call through the tool interface. If you genuinely cannot, reply with one short plain-language sentence — never JSON or code.";

/**
 * Heuristic: did the model emit tool args as a JSON literal in chat text?
 * `@cf/openai/gpt-oss-120b` does this intermittently — surfacing it as text
 * would leak raw JSON AND silently no-op the user's request.
 */
const looksLikeLeakedToolCall = (text: string): boolean => {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return false;
    try {
        const parsed: unknown = JSON.parse(text.slice(start, end + 1));
        return typeof parsed === "object" && parsed !== null;
    } catch {
        return false;
    }
};

/**
 * Conversations are in-memory client-side with no server id; derive a stable id
 * from the first user message so gateway session affinity holds across a
 * conversation's turns without leaking content.
 */
const stableConversationId = async (seed: string): Promise<string> => {
    const data = new TextEncoder().encode(seed);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest).slice(0, 16))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
};

export const POST: RequestHandler = async ({ locals, platform, request }) => {
    if (!locals.user) {
        error(401, { message: "Not authenticated" });
    }
    const aiBinding = platform?.env?.AI as AiBinding | undefined;
    if (!aiBinding) {
        error(503, { message: "AI is not available in this environment." });
    }

    let parsed: z.infer<typeof bodySchema>;
    try {
        parsed = bodySchema.parse(await request.json());
    } catch (err) {
        error(400, { message: err instanceof Error ? err.message : "Invalid request body" });
    }

    const lastMessage = parsed.messages[parsed.messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
        error(400, { message: "The conversation must end with a user message." });
    }

    let userMessage = lastMessage.content;
    const history = parsed.messages.slice(0, -1);

    // Two-stage vision: llama-3.2-vision transcribes the image, the transcript
    // is folded into the user message for the text-only chat model.
    if (parsed.image) {
        const transcript = await describeImage(aiBinding, parsed.image);
        if (transcript.length > 0) {
            userMessage = `${userMessage}\n\n[Attached image — transcribed contents:]\n${transcript}`;
        } else {
            userMessage = `${userMessage}\n\n[An image was attached but could not be read.]`;
        }
    }

    if (platform?.env?.VECTORIZE) {
        try {
            const knowledge = formatKnowledge(
                await retrieveAppKnowledge(platform.env as unknown as RagEnv, lastMessage.content)
            );
            if (knowledge.length > 0) {
                userMessage = `${userMessage}\n\nAPP KNOWLEDGE:\n${knowledge}`;
            }
        } catch {
            // Knowledge retrieval is best-effort; ignore failures.
        }
    }

    const gatewayEnv = platform?.env as unknown as RunChatEnv;
    const systemContext = buildSystemContext(parsed.contextText, TOOLS_CATALOG);
    const withFewShots = history.length === 0 ? [...FEW_SHOTS, ...history] : history;
    const turnId = crypto.randomUUID();
    const firstUserMessage = parsed.messages.find((m) => m.role === "user")?.content ?? userMessage;
    const conversationId = await stableConversationId(firstUserMessage);

    // D1 persistence runs alongside the stateless model flow above — the model
    // still receives the client-shipped history; D1 only records the turn so
    // conversations survive reloads. Persistence failures never abort the turn.
    const db = platform?.env?.DB ? drizzle(platform.env.DB) : null;
    let persistedConversationId: string | null = null;
    if (db) {
        try {
            const requestedId = parsed.conversationId ?? null;
            let conversation = requestedId ? await getConversation(db, locals.user.id, requestedId) : null;
            if (!conversation) {
                conversation = await createConversation(db, locals.user.id, titleFromMessage(lastMessage.content));
            }
            persistedConversationId = conversation.id;
            await appendMessage(db, persistedConversationId, { role: "user", content: lastMessage.content });
        } catch {
            persistedConversationId = null;
        }
    }

    return sseStream(async (push) => {
        let errored: string | null = null;
        let assistantText = "";
        const persistedToolCalls: ParsedToolCall[] = [];

        // Buffer the entire turn before flushing: we must inspect the text for
        // leaked tool-call JSON BEFORE pushing it to the client (see prompts.ts
        // and warning #19 in CLAUDE.md).
        const consume = async (gen: ReturnType<typeof runChatFrames>) => {
            let step = await gen.next();
            while (!step.done) {
                const frame = step.value;
                if (frame.t === "error") {
                    errored = frame.message;
                    push(frame);
                }
                step = await gen.next();
            }
            return step.value;
        };

        try {
            const first = await consume(
                runChatFrames(gatewayEnv, {
                    systemContext,
                    history: withFewShots,
                    userMessage,
                    conversationId,
                    tools: TOOLS_CATALOG
                })
            );

            let validated = validateToolCalls(first.toolCalls);
            let replyText = first.text;
            const invalid = validated.filter((v) => !v.valid);
            const leakedAsText = first.toolCalls.length === 0 && looksLikeLeakedToolCall(first.text);

            // Exactly one corrective retry: malformed args OR tool call written
            // as chat text. No retry on retry — failures fall through to a
            // friendly fallback reply.
            if ((invalid.length > 0 || leakedAsText) && !errored) {
                const retry = await consume(
                    runChatFrames(gatewayEnv, {
                        systemContext,
                        history: [
                            ...withFewShots,
                            { role: "user" as const, content: userMessage },
                            {
                                role: "assistant" as const,
                                content: "[The assistant did not produce a valid tool call.]"
                            }
                        ],
                        userMessage:
                            leakedAsText && invalid.length === 0 ? LEAK_RETRY_MESSAGE : correctiveMessage(invalid),
                        conversationId,
                        tools: TOOLS_CATALOG
                    })
                );
                validated = validateToolCalls(retry.toolCalls);
                const retryLeaked = retry.toolCalls.length === 0 && looksLikeLeakedToolCall(retry.text);
                replyText = retryLeaked ? "" : retry.text;
            }

            const validCalls = validated.filter((entry) => entry.valid);

            // Final safety net: never emit text that still looks like leaked
            // JSON. If retry also failed and no calls were extracted, fall back
            // to a friendly message rather than empty output.
            let outText = looksLikeLeakedToolCall(replyText) ? "" : replyText;
            if (leakedAsText && validCalls.length === 0 && outText.trim().length === 0) {
                outText = "I couldn't apply that change — could you rephrase your request?";
            }
            if (outText.trim().length > 0) {
                assistantText = outText;
                push({ t: "text", delta: outText });
            }
            for (const entry of validCalls) {
                persistedToolCalls.push({ id: entry.call.id, name: entry.call.name, args: entry.call.args });
                push({
                    t: "tool_call",
                    id: entry.call.id,
                    name: entry.call.name,
                    args: entry.call.args
                });
            }
        } catch (err) {
            push({ t: "error", message: err instanceof Error ? err.message : "Stream failed" });
        }

        if (db && persistedConversationId) {
            try {
                await appendMessage(db, persistedConversationId, {
                    role: "assistant",
                    content: assistantText,
                    toolCalls: persistedToolCalls.length > 0 ? persistedToolCalls : null
                });
                await touchUpdatedAt(db, persistedConversationId);
            } catch {
                // Persistence is best-effort; the live turn already streamed.
            }
        }

        push({ t: "end", turnId, conversationId: persistedConversationId ?? undefined });
    });
};
