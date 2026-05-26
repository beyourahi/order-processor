/**
 * One Copilot turn: append user msg → POST to /api/copilot/chat → consume SSE
 * frames → execute any tool calls in the browser.
 *
 * Server is stateless: every request ships full message history + the
 * `projectBatchState` CURRENT STATE block. Errors NEVER surface as raw text in
 * the assistant bubble — friendlyHttpError() maps them onto the error banner.
 */
import { copilot } from "$lib/stores/copilot.svelte";
import { copilotBridge } from "$lib/stores/copilot-bridge.svelte";
import { brandSettings } from "$lib/stores";
import { projectBatchState } from "./context";
import { streamFrames } from "./streaming";
import { executeToolCall, type ConfirmationRequest, type ExecutorContext } from "./executor";
import type { ChatRequestBody, ParsedToolCall } from "./types";

// Defense-in-depth: ensures error banners are always user-readable; never
// expose raw status codes or server payloads (see CLAUDE.md warning #19).
const friendlyHttpError = (status: number): string => {
    switch (status) {
        case 401:
            return "Your session has expired. Please refresh the page and sign in again.";
        case 429:
            return "The Copilot is handling a lot of requests right now. Wait a few seconds and try again.";
        case 503:
            return "The Copilot is temporarily unavailable. Please try again in a moment.";
        default:
            return "Something went wrong reaching the Copilot. Please try again.";
    }
};

// Bridges executor → confirm dialog: enqueue the request, await the dialog's
// resolve(approved) call, then auto-dequeue.
const requestConfirmation = (req: ConfirmationRequest): Promise<boolean> =>
    new Promise((resolve) => {
        copilot.enqueueConfirmation({
            toolCallId: req.toolCallId,
            toolName: req.toolName,
            humanLabel: req.humanLabel,
            diff: req.diff,
            anomalies: req.anomalies,
            inverseSummary: req.inverseSummary,
            resolve: (approved: boolean) => {
                copilot.dequeueConfirmation(req.toolCallId);
                resolve(approved);
            }
        });
    });

export const sendMessage = async (text: string, image?: string): Promise<void> => {
    const trimmed = text.trim();
    if ((trimmed.length === 0 && !image) || copilot.inputBusy) return;

    const userMessageId = crypto.randomUUID();
    copilot.appendUserMessage(userMessageId, trimmed || "(image attached)", image);

    // Snapshot history BEFORE startAssistantMessage so the in-progress placeholder isn't included.
    const history = copilot.messages
        .filter((m) => m.role === "user" || m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

    const contextText = projectBatchState(
        copilotBridge.editor,
        brandSettings.value,
        copilotBridge.ingestion?.getRawCsv() ?? null,
        copilot.undoStack.some((entry) => !entry.undone)
    );

    const assistantId = crypto.randomUUID();
    copilot.setError(null);
    copilot.setStreaming(true);
    copilot.startAssistantMessage(assistantId);

    const collectedToolCalls: ParsedToolCall[] = [];

    try {
        const body: ChatRequestBody = { messages: history, contextText };
        if (image) body.image = image;

        const response = await fetch("/api/copilot/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok || !response.body) {
            copilot.setError(friendlyHttpError(response.status));
            copilot.finalizeAssistantMessage(assistantId);
            copilot.setStreaming(false);
            return;
        }

        for await (const frame of streamFrames(response.body)) {
            if (frame.t === "text") {
                copilot.appendAssistantDelta(assistantId, frame.delta);
            } else if (frame.t === "tool_call") {
                const call: ParsedToolCall = { id: frame.id, name: frame.name, args: frame.args };
                collectedToolCalls.push(call);
                copilot.attachToolCall(assistantId, call);
            } else if (frame.t === "error") {
                copilot.setError("The Copilot ran into a problem completing that. Please try again.");
            }
        }
    } catch {
        copilot.setError("The connection was interrupted before the Copilot finished. Please try again.");
    }

    copilot.finalizeAssistantMessage(assistantId);
    copilot.setStreaming(false);

    if (collectedToolCalls.length === 0) return;

    copilot.setToolsRunning(true);
    const ctx: ExecutorContext = { messageId: assistantId, requestConfirmation };
    for (const call of collectedToolCalls) {
        await executeToolCall(call, ctx);
    }
    copilot.setToolsRunning(false);
};

export const createNewConversation = (): void => {
    copilot.createNewConversation();
};

/** Resolves a queued confirmation dialog (called by the confirm dialog UI). */
export const respondToConfirmation = (toolCallId: string, approved: boolean): void => {
    const pending = copilot.pendingConfirmations.find((c) => c.toolCallId === toolCallId);
    pending?.resolve(approved);
};

/** Reverts an applied AI action by its undo id (called by tool-card Undo). */
export const undoAction = (undoId: string): void => {
    const entry = copilot.undoStack.find((e) => e.id === undoId);
    if (!entry || entry.undone) return;
    entry.revert();
    copilot.markUndone(entry.id);
};
