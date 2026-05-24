<script lang="ts">
    import { copilot } from "$lib/stores/copilot.svelte";
    import { Pencil, Trash2 } from "@lucide/svelte";
    import { cn } from "$lib/utils";

    const onSwitch = (id: string) => {
        copilot.switchConversation(id);
    };

    const onRename = (id: string, currentTitle: string) => {
        const next = prompt("Rename chat", currentTitle);
        if (next && next.trim() && next.trim() !== currentTitle) {
            copilot.renameConversation(id, next.trim());
        }
    };

    const onDelete = (id: string) => {
        if (confirm("Delete this chat?")) {
            copilot.deleteConversation(id);
        }
    };
</script>

<div class="space-y-2">
    {#if copilot.conversations.length === 0}
        <p class="text-chat-text-muted py-3 text-center text-xs text-balance">No chats yet.</p>
    {:else}
        <ul class="chat-scrollbar max-h-60 space-y-1 overflow-y-auto pr-1">
            {#each copilot.conversations as conv (conv.id)}
                {@const active = conv.id === copilot.activeConversationId}
                <li
                    class={cn(
                        "flex items-center gap-1 rounded-lg border border-solid px-2 py-1.5 transition-colors",
                        active
                            ? "border-chat-border bg-chat-surface-hover"
                            : "border-chat-border-subtle bg-chat-surface hover:bg-chat-surface-hover"
                    )}
                >
                    <button
                        type="button"
                        onclick={() => onSwitch(conv.id)}
                        class="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                        aria-current={active ? "true" : undefined}
                    >
                        {#if active}
                            <span class="bg-chat-text-primary size-1.5 shrink-0 rounded-full" aria-hidden="true"></span>
                        {/if}
                        <span
                            class={cn(
                                "truncate text-xs",
                                active ? "text-chat-text-primary font-medium" : "text-chat-text-secondary"
                            )}
                        >
                            {conv.title}
                        </span>
                    </button>
                    <button
                        type="button"
                        class="text-chat-text-muted hover:text-chat-text-primary hover:bg-chat-surface-hover rounded-md p-1 transition-colors"
                        onclick={() => onRename(conv.id, conv.title)}
                        aria-label="Rename chat {conv.title}"
                        title="Rename"
                    >
                        <Pencil class="size-3" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        class="text-chat-text-muted hover:bg-red-400/10 rounded-md p-1 transition-colors hover:text-red-300"
                        onclick={() => onDelete(conv.id)}
                        aria-label="Delete chat {conv.title}"
                        title="Delete"
                    >
                        <Trash2 class="size-3" aria-hidden="true" />
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>
