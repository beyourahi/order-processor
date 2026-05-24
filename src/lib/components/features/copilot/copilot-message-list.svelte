<script lang="ts">
    import type { CopilotMessage as CopilotMessageType } from "$lib/ai/types";
    import CopilotMessage from "./copilot-message.svelte";
    import CopilotTypingIndicator from "./copilot-typing-indicator.svelte";

    let {
        messages,
        isStreaming
    }: {
        messages: CopilotMessageType[];
        isStreaming: boolean;
    } = $props();

    let scrollContainer = $state<HTMLDivElement | null>(null);
    let userScrolledUp = $state(false);

    const last = $derived(messages.at(-1));
    const lastContent = $derived(last?.content ?? "");

    const showTypingIndicator = $derived(isStreaming && !!last && last.role === "user");

    const isPinnedToBottom = (): boolean => {
        if (!scrollContainer) return true;
        const slack = 24;
        return scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight <= slack;
    };

    const handleScroll = () => {
        if (!scrollContainer) return;
        userScrolledUp = !isPinnedToBottom();
    };

    $effect(() => {
        void messages.length;
        void lastContent;
        void showTypingIndicator;
        if (!scrollContainer) return;
        if (userScrolledUp) return;
        requestAnimationFrame(() => {
            if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
        });
    });
</script>

<div
    bind:this={scrollContainer}
    onscroll={handleScroll}
    class="chat-scrollbar flex-1 overflow-y-auto px-4 py-4"
    aria-live="polite"
    aria-relevant="additions"
>
    <svelte:boundary>
        {#each messages as message (message.id)}
            <CopilotMessage {message} />
        {/each}
        {#snippet failed(_error, reset)}
            <div class="chat-message-enter flex flex-col items-center gap-2 py-6 text-center" role="alert">
                <p class="text-sm font-medium text-red-300">The Copilot hit a display error.</p>
                <p class="text-chat-text-muted max-w-xs text-xs text-pretty">
                    Something went wrong showing this conversation. Retry to reload it.
                </p>
                <button
                    type="button"
                    onclick={reset}
                    class="border-chat-border bg-chat-surface text-chat-text-primary hover:bg-chat-surface-hover mt-1 rounded-lg border border-solid px-3 py-1.5 text-xs font-medium transition-colors"
                >
                    Retry
                </button>
            </div>
        {/snippet}
    </svelte:boundary>
    {#if showTypingIndicator}
        <CopilotTypingIndicator />
    {/if}
</div>
