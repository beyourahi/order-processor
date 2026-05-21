/**
 * Client orchestration for one Copilot turn: append the user message, stream the
 * model response from `/api/copilot/chat`, then run any tool calls the model
 * emitted against the editor. The server is stateless — the full message history
 * and a rendered CURRENT STATE block are shipped with every request.
 */
import { copilot } from "$lib/stores/copilot.svelte";
import { copilotBridge } from "$lib/stores/copilot-bridge.svelte";
import { brandSettings } from "$lib/stores";
import { projectBatchState } from "./context";
import { streamFrames } from "./streaming";
import { executeToolCall, type ConfirmationRequest, type ExecutorContext } from "./executor";
import type { ChatRequestBody, ParsedToolCall } from "./types";

/** Bridges the executor's confirmation request to the store's dialog queue. */
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

    // History is built before the assistant placeholder so it is excluded.
    const history = copilot.messages
        .filter((m) => m.role === "user" || m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

    const contextText = projectBatchState(
        copilotBridge.editor,
        brandSettings.value,
        copilotBridge.ingestion?.getRawCsv() ?? null
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
            let message = `Request failed (${response.status})`;
            try {
                const payload = (await response.json()) as { message?: string };
                if (payload?.message) message = payload.message;
            } catch {
                /* non-JSON error body */
            }
            copilot.appendAssistantDelta(assistantId, message);
            copilot.setError(message);
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
                copilot.setError(frame.message);
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Stream failed";
        copilot.setError(message);
        copilot.appendAssistantDelta(assistantId, `\n\n[error: ${message}]`);
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
