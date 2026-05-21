/**
 * Copilot client state — a closure-based runes store (the project's store
 * pattern, see `brand-settings.svelte.ts`). Conversations and messages are
 * held in memory only; they clear on reload, matching the editor batch which
 * is itself ephemeral.
 *
 * The AI undo stack is separate from the output editor's native Cmd+Z undo:
 * each applied mutation captures a full editor snapshot, and reverting restores
 * it. Tool-card Undo buttons and the `undoLastChange` tool both pop this stack.
 */
import { titleFromMessage } from "$lib/ai/prompts";
import type {
    AiUndoEntry,
    Conversation,
    CopilotMessage,
    CopilotToolCall,
    ParsedToolCall,
    PendingConfirmation
} from "$lib/ai/types";

const MAX_UNDO = 25;

const newConversation = (): Conversation => ({
    id: crypto.randomUUID(),
    title: "New chat",
    createdAt: new Date().toISOString(),
    messages: []
});

const createCopilotStore = () => {
    let conversations = $state<Conversation[]>([newConversation()]);
    let activeConversationId = $state<string>(conversations[0]?.id ?? "");
    let streaming = $state(false);
    let toolsRunning = $state(false);
    let error = $state<string | null>(null);
    let pendingConfirmations = $state<PendingConfirmation[]>([]);
    let undoStack = $state<AiUndoEntry[]>([]);
    let railOpen = $state(false);
    let mobileOpen = $state(false);
    let inputFocusNonce = $state(0);

    /** The active conversation, recreated defensively if it ever goes missing. */
    const active = (): Conversation => {
        const found = conversations.find((c) => c.id === activeConversationId);
        if (found) return found;
        const conv = newConversation();
        conversations = [conv];
        activeConversationId = conv.id;
        return conv;
    };

    const findMessage = (id: string): CopilotMessage | undefined => active().messages.find((m) => m.id === id);

    return {
        get conversations() {
            return conversations;
        },
        get activeConversationId() {
            return activeConversationId;
        },
        get messages() {
            return active().messages;
        },
        get streaming() {
            return streaming;
        },
        /** True while the model streams OR tool calls execute — gates the input. */
        get inputBusy() {
            return streaming || toolsRunning;
        },
        get error() {
            return error;
        },
        get pendingConfirmations() {
            return pendingConfirmations;
        },
        get undoStack() {
            return undoStack;
        },
        get canUndo() {
            return undoStack.some((e) => !e.undone);
        },
        get railOpen() {
            return railOpen;
        },
        get mobileOpen() {
            return mobileOpen;
        },
        get inputFocusNonce() {
            return inputFocusNonce;
        },

        setStreaming(v: boolean) {
            streaming = v;
        },
        setToolsRunning(v: boolean) {
            toolsRunning = v;
        },
        setError(msg: string | null) {
            error = msg;
        },
        toggleRail() {
            railOpen = !railOpen;
        },
        closeRail() {
            railOpen = false;
        },
        setMobileOpen(v: boolean) {
            mobileOpen = v;
        },
        requestInputFocus() {
            inputFocusNonce++;
        },

        appendUserMessage(id: string, content: string, image?: string) {
            const conv = active();
            const msg: CopilotMessage = {
                id,
                role: "user",
                content,
                toolCalls: [],
                createdAt: new Date().toISOString(),
                streaming: false
            };
            if (image) msg.image = image;
            conv.messages.push(msg);
            if (conv.messages.filter((m) => m.role === "user").length === 1) {
                conv.title = titleFromMessage(content);
            }
        },

        startAssistantMessage(id: string) {
            active().messages.push({
                id,
                role: "assistant",
                content: "",
                toolCalls: [],
                createdAt: new Date().toISOString(),
                streaming: true
            });
        },

        appendAssistantDelta(id: string, delta: string) {
            const m = findMessage(id);
            if (m) m.content += delta;
        },

        finalizeAssistantMessage(id: string) {
            const m = findMessage(id);
            if (m) m.streaming = false;
        },

        attachToolCall(messageId: string, call: ParsedToolCall) {
            const m = findMessage(messageId);
            if (!m) return;
            m.toolCalls.push({
                id: call.id,
                name: call.name,
                args: call.args,
                status: "pending",
                summary: null,
                error: null,
                anomalies: [],
                undoId: null,
                undone: false
            });
        },

        updateToolCall(messageId: string, toolCallId: string, patch: Partial<CopilotToolCall>) {
            const tc = findMessage(messageId)?.toolCalls.find((t) => t.id === toolCallId);
            if (tc) Object.assign(tc, patch);
        },

        enqueueConfirmation(req: PendingConfirmation) {
            pendingConfirmations = [...pendingConfirmations, req];
        },
        dequeueConfirmation(toolCallId: string) {
            pendingConfirmations = pendingConfirmations.filter((c) => c.toolCallId !== toolCallId);
        },

        pushUndo(entry: AiUndoEntry) {
            undoStack = [...undoStack, entry].slice(-MAX_UNDO);
        },
        /** Most recent not-yet-reverted entry, or null. */
        peekUndo(): AiUndoEntry | null {
            for (let i = undoStack.length - 1; i >= 0; i--) {
                const e = undoStack[i];
                if (e && !e.undone) return e;
            }
            return null;
        },
        markUndone(undoId: string) {
            const entry = undoStack.find((e) => e.id === undoId);
            if (entry) entry.undone = true;
            for (const conv of conversations) {
                for (const m of conv.messages) {
                    for (const tc of m.toolCalls) {
                        if (tc.undoId === undoId) tc.undone = true;
                    }
                }
            }
        },

        createNewConversation() {
            const conv = newConversation();
            conversations = [conv, ...conversations];
            activeConversationId = conv.id;
            error = null;
            railOpen = false;
            inputFocusNonce++;
        },
        switchConversation(id: string) {
            if (conversations.some((c) => c.id === id)) {
                activeConversationId = id;
                railOpen = false;
            }
        },
        renameConversation(id: string, title: string) {
            const c = conversations.find((x) => x.id === id);
            if (c && title.trim()) c.title = title.trim();
        },
        deleteConversation(id: string) {
            conversations = conversations.filter((c) => c.id !== id);
            if (conversations.length === 0) conversations = [newConversation()];
            if (!conversations.some((c) => c.id === activeConversationId)) {
                activeConversationId = conversations[0]?.id ?? "";
            }
        }
    };
};

export const copilot = createCopilotStore();
