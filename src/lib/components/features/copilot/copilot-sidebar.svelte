<script lang="ts">
    import { copilot } from "$lib/stores/copilot.svelte";
    import { sendMessage, createNewConversation } from "$lib/ai/chat-client";
    import { cn } from "$lib/utils";
    import CopilotHeader from "./copilot-header.svelte";
    import CopilotWelcome from "./copilot-welcome.svelte";
    import CopilotMessageList from "./copilot-message-list.svelte";
    import CopilotComposer from "./copilot-composer.svelte";
    import CopilotConversationsPanel from "./copilot-conversations-panel.svelte";

    let { bare = false, onClose }: { bare?: boolean; onClose?: () => void } = $props();

    let composerValue = $state("");
    let composerImage = $state<string | null>(null);

    const status = $derived<"online" | "connecting" | "error">(
        copilot.error ? "error" : copilot.inputBusy ? "connecting" : "online"
    );

    const handleSuggestion = (text: string) => {
        composerValue = text;
        copilot.requestInputFocus();
    };

    const handleSend = (text: string, image: string | null) => {
        void sendMessage(text, image ?? undefined);
    };

    const handleNewConversation = () => {
        createNewConversation();
        composerValue = "";
        composerImage = null;
    };

    const handleToggleHistory = () => {
        copilot.toggleRail();
    };
</script>

<section
    class={cn(
        "bg-chat-bg flex h-full min-h-[30rem] flex-col overflow-hidden",
        !bare && "border-chat-border rounded-2xl border border-solid shadow-[var(--chat-shadow)]"
    )}
    aria-label="AI Copilot"
>
    <CopilotHeader
        {onClose}
        onNewConversation={handleNewConversation}
        onToggleHistory={handleToggleHistory}
        hasMessages={copilot.messages.length > 0}
        historyOpen={copilot.railOpen}
        historyCount={copilot.conversations.length}
        {status}
    />

    {#if copilot.railOpen}
        <div class="border-chat-border-subtle border-b border-solid px-3 py-3 md:px-4">
            <CopilotConversationsPanel />
        </div>
    {/if}

    {#if copilot.messages.length === 0}
        <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <CopilotWelcome onSuggestionClick={handleSuggestion} />
        </div>
    {:else}
        <CopilotMessageList messages={copilot.messages} isStreaming={copilot.inputBusy} />
    {/if}

    {#if copilot.error}
        <div class="px-4 py-2 text-center text-xs text-pretty text-red-400/80" role="alert">{copilot.error}</div>
    {/if}

    <CopilotComposer
        bind:value={composerValue}
        bind:image={composerImage}
        disabled={copilot.inputBusy}
        focusNonce={copilot.inputFocusNonce}
        onSend={handleSend}
    />
</section>
