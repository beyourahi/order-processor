<script lang="ts">
    /**
     * Chat-shell header bar (child of copilot-sidebar): status pill + history /
     * new-conversation / close controls. Purely presentational — every action is
     * a callback the sidebar owns; this component holds no store state. The
     * new-conversation button only renders once a chat exists (`hasMessages`), and
     * close only when `onClose` is supplied (mobile sheet, not the docked rail).
     */
    import { Clock, Plus, X } from "@lucide/svelte";

    let {
        onClose,
        onNewConversation,
        onToggleHistory,
        hasMessages,
        historyOpen,
        historyCount,
        status = "online"
    }: {
        onClose?: (() => void) | undefined;
        onNewConversation: () => void;
        onToggleHistory: () => void;
        hasMessages: boolean;
        historyOpen: boolean;
        historyCount: number;
        status?: "online" | "connecting" | "error";
    } = $props();

    const statusConfig = $derived(
        {
            online: { dot: "bg-emerald-400", label: "online" },
            connecting: { dot: "bg-amber-400 animate-pulse", label: "connecting" },
            error: { dot: "bg-red-400", label: "offline" }
        }[status]
    );
</script>

<div class="border-chat-border flex items-center justify-between border-b border-solid px-4 py-3 md:px-5 md:py-4">
    <div class="flex items-center gap-2.5">
        <div class="size-1.5 rounded-full {statusConfig.dot}"></div>
        <span class="text-chat-text-muted font-mono text-micro tracking-[0.22em] whitespace-nowrap uppercase">
            {statusConfig.label}
        </span>
    </div>
    <div class="flex items-center gap-1">
        <button
            type="button"
            onclick={onToggleHistory}
            aria-expanded={historyOpen}
            aria-label="Chat history"
            class="hover:bg-chat-surface-hover relative touch-manipulation rounded-xl p-2.5 transition-colors md:p-2"
        >
            <Clock class="text-chat-icon-muted h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
            {#if historyCount > 0}
                <span
                    class="bg-chat-accent text-chat-bg text-micro absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 font-mono font-semibold tabular-nums"
                >
                    {historyCount}
                </span>
            {/if}
        </button>
        {#if hasMessages}
            <button
                type="button"
                onclick={onNewConversation}
                aria-label="New conversation"
                class="hover:bg-chat-surface-hover touch-manipulation rounded-xl p-2.5 transition-colors md:p-2"
            >
                <Plus class="text-chat-icon-muted h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
            </button>
        {/if}
        {#if onClose}
            <button
                type="button"
                onclick={onClose}
                aria-label="Close chat"
                class="hover:bg-chat-surface-hover touch-manipulation rounded-xl p-2.5 transition-colors md:p-2"
            >
                <X class="text-chat-icon-muted h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
            </button>
        {/if}
    </div>
</div>
