<script lang="ts">
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
        onClose?: () => void;
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
    <div class="flex items-center gap-3">
        <div class="h-2 w-2 rounded-full {statusConfig.dot}"></div>
        <span class="text-chat-text-muted text-xs whitespace-nowrap">{statusConfig.label}</span>
    </div>
    <div class="flex items-center gap-1">
        <button
            type="button"
            onclick={onToggleHistory}
            aria-expanded={historyOpen}
            aria-label="Chat history"
            class="hover:bg-chat-surface-hover relative rounded-xl p-2.5 transition-colors md:p-2"
        >
            <Clock class="text-chat-icon-muted h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
            {#if historyCount > 0}
                <span
                    class="bg-chat-accent text-chat-bg absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-bold tabular-nums"
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
                class="hover:bg-chat-surface-hover rounded-xl p-2.5 transition-colors md:p-2"
            >
                <Plus class="text-chat-icon-muted h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
            </button>
        {/if}
        {#if onClose}
            <button
                type="button"
                onclick={onClose}
                aria-label="Close chat"
                class="hover:bg-chat-surface-hover rounded-xl p-2.5 transition-colors md:p-2"
            >
                <X class="text-chat-icon-muted h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
            </button>
        {/if}
    </div>
</div>
