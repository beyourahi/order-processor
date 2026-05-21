/**
 * Streaming chat endpoint for the AI Copilot.
 *
 * Stateless by design: the client ships the full in-memory conversation and a
 * rendered CURRENT STATE block on every request. The endpoint assembles the
 * system prompt, invokes Workers AI, and streams a `Frame` SSE response. Tool
 * calls are validated here (with one corrective retry) but EXECUTED in the
 * browser against the output-editor grid.
 */
import { error } from "@sveltejs/kit";
import { z } from "zod";
import type { RequestHandler } from "./$types";
import { runChatFrames, describeImage, type AiBinding } from "$lib/ai/client";
import { sseStream } from "$lib/ai/streaming";
import { buildSystemContext, FEW_SHOTS } from "$lib/ai/prompts";
import { TOOLS_CATALOG } from "$lib/ai/tools-catalog";
import { argSchemas, isKnownToolName } from "$lib/ai/schemas";
import type { ParsedToolCall } from "$lib/ai/types";

const bodySchema = z.object({
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

/** Sent when the model wrote a tool call as chat text instead of calling it. */
const LEAK_RETRY_MESSAGE =
    "Your previous response wrote the action as a chat message instead of calling a tool, so nothing happened. Re-issue it now as a real tool call through the tool interface. If you genuinely cannot, reply with one short plain-language sentence — never JSON or code.";

/**
 * Detects a tool call the model leaked into its chat text — it emitted the
 * arguments as a JSON object in the reply instead of through the tool channel.
 * Such a "reply" both leaks raw JSON to the user and silently runs nothing.
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

    // Vision turns: transcribe the image, then fold the transcript into the
    // user message so the text-only chat model can act on it.
    if (parsed.image) {
        const transcript = await describeImage(aiBinding, parsed.image);
        if (transcript.length > 0) {
            userMessage = `${userMessage}\n\n[Attached image — transcribed contents:]\n${transcript}`;
        } else {
            userMessage = `${userMessage}\n\n[An image was attached but could not be read.]`;
        }
    }

    const systemContext = buildSystemContext(parsed.contextText, TOOLS_CATALOG);
    const withFewShots = history.length === 0 ? [...FEW_SHOTS, ...history] : history;
    const turnId = crypto.randomUUID();

    return sseStream(async (push) => {
        let errored: string | null = null;

        // The turn is buffered, not streamed live: the model's text is inspected
        // before any of it reaches the user, so a tool call the model leaked as
        // chat text is caught and never shown.
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
                runChatFrames(aiBinding, {
                    systemContext,
                    history: withFewShots,
                    userMessage,
                    tools: TOOLS_CATALOG
                })
            );

            let validated = validateToolCalls(first.toolCalls);
            let replyText = first.text;
            const invalid = validated.filter((v) => !v.valid);
            const leakedAsText = first.toolCalls.length === 0 && looksLikeLeakedToolCall(first.text);

            // One corrective retry when the model emits a malformed tool call, or
            // writes a tool call as chat text instead of calling it.
            if ((invalid.length > 0 || leakedAsText) && !errored) {
                const retry = await consume(
                    runChatFrames(aiBinding, {
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
                        tools: TOOLS_CATALOG
                    })
                );
                validated = validateToolCalls(retry.toolCalls);
                const retryLeaked = retry.toolCalls.length === 0 && looksLikeLeakedToolCall(retry.text);
                replyText = retryLeaked ? "" : retry.text;
            }

            const validCalls = validated.filter((entry) => entry.valid);

            // A leaked tool call must never surface as text. If the retry could
            // not recover it into a real call, tell the user plainly.
            let outText = looksLikeLeakedToolCall(replyText) ? "" : replyText;
            if (leakedAsText && validCalls.length === 0 && outText.trim().length === 0) {
                outText = "I couldn't apply that change — could you rephrase your request?";
            }
            if (outText.trim().length > 0) {
                push({ t: "text", delta: outText });
            }
            for (const entry of validCalls) {
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

        push({ t: "end", turnId });
    });
};
