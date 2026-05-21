<script lang="ts">
    import { tick } from "svelte";
    import { copilot } from "$lib/stores/copilot.svelte";
    import { sendMessage, createNewConversation } from "$lib/ai/chat-client";
    import { ArrowUp, History, ImagePlus, ListChecks, MessageSquarePlus, ShieldCheck, Wand2, X } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import CopilotMessage from "./copilot-message.svelte";
    import CopilotConversationsPanel from "./copilot-conversations-panel.svelte";
    import CopilotLauncherIcon from "./copilot-launcher-icon.svelte";

    let { bare = false }: { bare?: boolean } = $props();

    let input = $state("");
    let pendingImage = $state<string | null>(null);
    let scrollContainer = $state<HTMLDivElement | null>(null);
    let textarea = $state<HTMLTextAreaElement | null>(null);
    let fileInput = $state<HTMLInputElement | null>(null);

    const examples = [
        { icon: Wand2, text: "Fix all the validation warnings" },
        { icon: ShieldCheck, text: "Flag any risky orders before I download" },
        { icon: ListChecks, text: "Set the whole batch to lot 5" }
    ];
    const dots = [0, 1, 2];

    const lastContent = $derived(copilot.messages.at(-1)?.content ?? "");

    const autoGrow = () => {
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    };

    const scrollToBottom = () => {
        if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    };

    const onSubmit = async (overrideMessage?: string) => {
        const trimmed = (overrideMessage ?? input).trim();
        const image = pendingImage;
        if ((trimmed.length === 0 && !image) || copilot.inputBusy) return;
        input = "";
        pendingImage = null;
        if (textarea) textarea.style.height = "auto";
        await sendMessage(trimmed, image ?? undefined);
        await tick();
        scrollToBottom();
    };

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void onSubmit();
        }
    };

    const onPickImage = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            copilot.setError("Please choose an image file.");
            return;
        }
        if (file.size > 4 * 1024 * 1024) {
            copilot.setError("That image is too large — keep it under 4 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") pendingImage = reader.result;
        };
        reader.readAsDataURL(file);
    };

    const onNewChat = () => {
        createNewConversation();
        copilot.closeRail();
    };

    // Auto-scroll as messages stream in.
    $effect(() => {
        void copilot.messages.length;
        void lastContent;
        tick().then(scrollToBottom);
    });

    // Focus the input when the store requests it (new chat).
    $effect(() => {
        if (copilot.inputFocusNonce === 0) return;
        tick().then(() => textarea?.focus());
    });
</script>

<section
    class={cn(
        "bg-background flex h-full min-h-[30rem] flex-col overflow-hidden",
        !bare && "border-border-strong/60 rounded-xl border shadow-2xl"
    )}
    aria-label="AI Copilot"
>
    <!-- Header -->
    <div class="border-border-strong/40 border-b p-2">
        <div class={cn("flex items-center gap-2", bare && "mr-12")}>
            <button
                type="button"
                onclick={onNewChat}
                class="bg-card border-border-strong/50 text-muted-foreground pointer-fine:hover:text-foreground pointer-fine:hover:bg-muted flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors"
            >
                <MessageSquarePlus class="size-3.5 shrink-0" aria-hidden="true" />
                <span>New chat</span>
            </button>
            <button
                type="button"
                onclick={copilot.toggleRail}
                aria-expanded={copilot.railOpen}
                class={cn(
                    "bg-card border-border-strong/50 flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors",
                    copilot.railOpen
                        ? "bg-primary/10 text-foreground font-medium"
                        : "text-muted-foreground pointer-fine:hover:text-foreground pointer-fine:hover:bg-muted"
                )}
            >
                <History class="size-3.5 shrink-0" aria-hidden="true" />
                <span>History</span>
                <span
                    class="bg-background text-muted-foreground rounded-full px-1.5 py-px text-[10px] font-medium tabular-nums"
                >
                    {copilot.conversations.length}
                </span>
            </button>
        </div>
        {#if copilot.railOpen}
            <div class="ai-enter mt-2">
                <CopilotConversationsPanel />
            </div>
        {/if}
    </div>

    <!-- Messages -->
    <div
        bind:this={scrollContainer}
        class="ai-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4"
        aria-live="polite"
        aria-relevant="additions"
    >
        {#if copilot.messages.length === 0}
            <div class="flex h-full flex-col items-center justify-center px-4 py-6 text-center">
                <CopilotLauncherIcon variant="row" class="ai-rise mb-5" />
                <p
                    class="text-foreground ai-rise mb-1.5 text-lg font-medium text-balance"
                    style="animation-delay: 100ms"
                >
                    Tell the Copilot what to fix.
                </p>
                <p
                    class="text-muted-foreground ai-rise mb-5 max-w-md text-xs leading-relaxed text-pretty md:text-sm"
                    style="animation-delay: 200ms"
                >
                    Describe an edit in plain words — it updates the right rows, repairs warnings, and flags risky
                    orders before you download.
                </p>
                <div class="flex w-full max-w-xs flex-col gap-2">
                    {#each examples as example, i (example.text)}
                        <button
                            type="button"
                            onclick={() => onSubmit(example.text)}
                            class="ai-rise group border-border-strong/40 bg-card pointer-fine:hover:border-border-strong/70 pointer-fine:hover:bg-muted flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors"
                            style="animation-delay: {300 + i * 80}ms"
                        >
                            <span
                                class="bg-primary/5 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg"
                            >
                                <example.icon class="size-3.5" aria-hidden="true" />
                            </span>
                            <span class="text-muted-foreground min-w-0 flex-1 text-xs leading-snug text-pretty">
                                {example.text}
                            </span>
                        </button>
                    {/each}
                </div>
            </div>
        {:else}
            {#each copilot.messages as msg (msg.id)}
                <CopilotMessage message={msg} />
            {/each}
        {/if}

        {#if copilot.error}
            <p class="ai-enter text-center text-xs text-pretty text-red-400/80" role="alert">
                {copilot.error}
            </p>
        {/if}
    </div>

    <!-- Input -->
    <form
        class="border-border-strong/40 border-t p-2.5"
        onsubmit={(e) => {
            e.preventDefault();
            void onSubmit();
        }}
    >
        <div
            class="border-border-strong/50 bg-card focus-within:border-border-strong flex flex-col gap-1.5 rounded-2xl border p-1.5 transition-colors"
        >
            {#if pendingImage}
                <div class="ai-enter flex items-center gap-2 px-1 pt-1">
                    <img
                        src={pendingImage}
                        alt="Attached preview"
                        class="border-border-strong/50 size-12 rounded-lg border object-cover"
                    />
                    <span class="text-muted-foreground flex-1 text-xs">Image attached</span>
                    <button
                        type="button"
                        onclick={() => (pendingImage = null)}
                        class="text-muted-foreground pointer-fine:hover:text-foreground pointer-fine:hover:bg-muted rounded-md p-1 transition-colors"
                        aria-label="Remove attached image"
                    >
                        <X class="size-3.5" aria-hidden="true" />
                    </button>
                </div>
            {/if}
            <div class="flex items-end gap-1.5">
                <input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={onPickImage} />
                <button
                    type="button"
                    onclick={() => fileInput?.click()}
                    disabled={copilot.inputBusy}
                    class="text-muted-foreground pointer-fine:hover:text-foreground pointer-fine:hover:bg-muted inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Attach an image"
                    title="Attach an image"
                >
                    <ImagePlus class="size-4" aria-hidden="true" />
                </button>
                <textarea
                    bind:this={textarea}
                    bind:value={input}
                    oninput={autoGrow}
                    onkeydown={onKeyDown}
                    placeholder="Ask the Copilot to change something…"
                    rows="1"
                    disabled={copilot.inputBusy}
                    class="text-foreground placeholder:text-muted-foreground ai-scroll max-h-32 min-h-[2rem] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm leading-relaxed outline-none disabled:opacity-60"
                    aria-label="Type a request"
                ></textarea>
                <button
                    type="submit"
                    disabled={copilot.inputBusy || (input.trim().length === 0 && !pendingImage)}
                    class={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-all disabled:cursor-not-allowed",
                        copilot.inputBusy && "cursor-wait",
                        copilot.inputBusy || (input.trim().length === 0 && !pendingImage)
                            ? "text-muted-foreground"
                            : "bg-primary/10 text-foreground pointer-fine:hover:bg-muted active:scale-95"
                    )}
                    aria-label="Send"
                >
                    {#if copilot.inputBusy}
                        <span class="flex items-center gap-[3px]" aria-hidden="true">
                            {#each dots as dot (dot)}
                                <span
                                    class="ai-dot size-1 rounded-full bg-current"
                                    style="animation-delay: {dot * 0.15}s"
                                ></span>
                            {/each}
                        </span>
                    {:else}
                        <ArrowUp class="size-4" aria-hidden="true" />
                    {/if}
                </button>
            </div>
        </div>
        <div class="text-muted-foreground mt-1.5 hidden items-center gap-1 px-1 text-[10px] sm:flex">
            <kbd class="border-border-strong/50 bg-card rounded border px-1 py-px font-sans">Enter</kbd>
            <span>to send</span>
            <span class="text-muted-foreground/40">·</span>
            <kbd class="border-border-strong/50 bg-card rounded border px-1 py-px font-sans">Shift</kbd>
            <span>+</span>
            <kbd class="border-border-strong/50 bg-card rounded border px-1 py-px font-sans">Enter</kbd>
            <span>for a new line</span>
        </div>
    </form>
</section>
