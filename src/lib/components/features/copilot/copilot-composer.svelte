<script lang="ts">
    import { ArrowUp, ImagePlus } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import CopilotImageUpload from "./copilot-image-upload.svelte";

    let {
        value = $bindable<string>(""),
        image = $bindable<string | null>(null),
        disabled = false,
        focusNonce = 0,
        onSend
    }: {
        value: string;
        image: string | null;
        disabled?: boolean;
        focusNonce?: number;
        onSend: (text: string, image: string | null) => void;
    } = $props();

    const MAX_HEIGHT = 200;

    let textareaEl = $state<HTMLTextAreaElement | null>(null);
    let uploadRef = $state<CopilotImageUpload | null>(null);
    let dragging = $state(false);
    let imageError = $state<string | null>(null);

    const trimmed = $derived(value.trim());
    const canSubmit = $derived((trimmed.length > 0 || image !== null) && !disabled);

    $effect(() => {
        if (!textareaEl) return;
        void value;
        textareaEl.style.height = "auto";
        textareaEl.style.height = `${Math.min(textareaEl.scrollHeight, MAX_HEIGHT)}px`;
    });

    $effect(() => {
        if (focusNonce === 0) return;
        queueMicrotask(() => textareaEl?.focus());
    });

    const handleSubmit = () => {
        if (!canSubmit) return;
        onSend(trimmed, image);
        value = "";
        image = null;
        if (textareaEl) {
            textareaEl.style.height = "auto";
        }
    };

    const handleImageError = (msg: string) => {
        imageError = msg;
        setTimeout(() => {
            imageError = null;
        }, 5000);
    };

    const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        dragging = false;
        const file = event.dataTransfer?.files?.[0];
        if (file && uploadRef) void uploadRef.addFile(file);
    };

    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
        dragging = true;
    };

    const handleDragLeave = (event: DragEvent) => {
        const target = event.currentTarget as HTMLElement;
        if (!target.contains(event.relatedTarget as Node)) {
            dragging = false;
        }
    };
</script>

<div class="px-3 pt-2 pb-3 md:px-4 md:pb-4">
    <div
        class={cn(
            "border-chat-border bg-chat-surface relative rounded-2xl border border-solid px-3 pt-2.5 pb-9 transition-colors duration-150 md:px-4 md:pt-3 md:pb-10",
            dragging && "border-chat-accent/30 bg-chat-accent/5"
        )}
        ondrop={handleDrop}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        role="presentation"
    >
        {#if dragging}
            <div
                class="border-chat-accent/30 bg-chat-accent/5 absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed"
            >
                <span class="text-chat-text-secondary text-sm">drop an image here</span>
            </div>
        {/if}

        <CopilotImageUpload bind:this={uploadRef} bind:image onError={handleImageError} />

        <textarea
            bind:this={textareaEl}
            bind:value
            name="copilot-prompt"
            onkeydown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit();
                }
            }}
            placeholder={disabled ? "generating response..." : "ask the Copilot to change something..."}
            aria-label="Type a request"
            rows={2}
            {disabled}
            class={cn(
                "text-chat-text-primary chat-scrollbar min-h-[3.25rem] w-full resize-none bg-transparent text-base leading-relaxed transition-[height] duration-100 ease-out outline-none md:text-sm",
                disabled ? "placeholder:text-chat-text-secondary" : "placeholder:text-chat-text-muted"
            )}
            style="max-height: {MAX_HEIGHT}px;"
        ></textarea>

        {#if imageError}
            <div role="alert" aria-live="assertive" class="px-1 pb-1 text-xs text-pretty text-red-400/80">
                {imageError}
            </div>
        {/if}

        <div class="absolute right-3 bottom-2.5 flex items-center gap-2">
            <button
                type="button"
                aria-label="Attach an image"
                onclick={() => uploadRef?.triggerUpload()}
                class={cn(
                    "relative rounded-lg p-2 transition-all duration-200",
                    image
                        ? "bg-chat-accent-muted text-chat-text-primary"
                        : "text-chat-text-muted hover:text-chat-text-secondary"
                )}
            >
                <ImagePlus class="h-4 w-4" aria-hidden="true" />
            </button>
            <button
                type="button"
                onclick={handleSubmit}
                disabled={!canSubmit}
                aria-label={disabled ? "Generating response" : "Send message"}
                class={cn(
                    "rounded-lg p-2 transition-all duration-200",
                    disabled
                        ? "bg-chat-accent-muted/40 text-chat-text-muted cursor-not-allowed"
                        : canSubmit
                          ? "bg-chat-accent-muted text-chat-text-primary hover:bg-chat-surface-hover"
                          : "text-chat-text-muted cursor-not-allowed"
                )}
            >
                {#if disabled}
                    <div class="flex h-4 w-4 items-center justify-center gap-[3px]" aria-hidden="true">
                        <span
                            class="chat-dot-pulse bg-chat-text-muted h-1 w-1 rounded-full"
                            style="animation-delay: 0s;"
                        ></span>
                        <span
                            class="chat-dot-pulse bg-chat-text-muted h-1 w-1 rounded-full"
                            style="animation-delay: 0.2s;"
                        ></span>
                        <span
                            class="chat-dot-pulse bg-chat-text-muted h-1 w-1 rounded-full"
                            style="animation-delay: 0.4s;"
                        ></span>
                    </div>
                {:else}
                    <ArrowUp class="h-4 w-4" aria-hidden="true" />
                {/if}
            </button>
        </div>

        <span class="text-chat-text-muted/60 absolute bottom-2.5 left-4 text-micro">
            {#if disabled}
                generating...
            {:else}
                <span class="hidden md:inline">shift + enter for new line</span>
            {/if}
        </span>
    </div>
</div>
