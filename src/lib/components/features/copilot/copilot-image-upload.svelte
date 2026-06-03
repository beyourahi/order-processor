<script lang="ts">
    /**
     * Image attachment handler for the composer. Owns the hidden file input,
     * validation, and the `image` data-URL ($bindable up to the composer). Exposes
     * an imperative surface (`triggerUpload`, `addFile`) the composer calls so it
     * can route the file picker button and drag-drop through one validated path.
     *
     * Non-obvious: uploads are re-encoded to WebP in an OffscreenCanvas to shrink
     * the data URL before it rides the chat payload to the vision model — GIFs are
     * passed through (animation would be lost) and small WebPs skip re-encode.
     * Any failure (no OffscreenCanvas, decode error) silently falls back to the
     * original file, so the path degrades rather than blocking the attachment.
     */
    import { X, Loader2 } from "@lucide/svelte";

    const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/heic", "image/heif"];
    const MAX_SIZE = 8 * 1024 * 1024;

    let {
        image = $bindable<string | null>(null),
        onError
    }: {
        image: string | null;
        onError: (msg: string) => void;
    } = $props();

    let fileInput = $state<HTMLInputElement | null>(null);
    let processing = $state(false);

    export const triggerUpload = () => {
        if (!processing) fileInput?.click();
    };

    const reencodeToWebp = async (file: File): Promise<File> => {
        if (file.type === "image/gif") return file;
        if (file.type === "image/webp" && file.size <= 256 * 1024) return file;
        if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas !== "function") {
            return file;
        }
        try {
            const bitmap = await createImageBitmap(file);
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const ctx = canvas.getContext("2d");
            if (!ctx) return file;
            ctx.drawImage(bitmap, 0, 0);
            const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.92 });
            bitmap.close?.();
            const baseName = file.name.replace(/\.[^.]+$/, "");
            return new File([blob], `${baseName}.webp`, { type: "image/webp" });
        } catch {
            return file;
        }
    };

    const toDataUrl = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });

    export const addFile = async (file: File) => {
        if (!ACCEPTED.includes(file.type)) {
            onError("Please choose an image file (PNG, JPEG, WebP, or GIF).");
            return;
        }
        if (file.size > MAX_SIZE) {
            onError("That image is too large — keep it under 8 MB.");
            return;
        }
        processing = true;
        try {
            const sanitized = await reencodeToWebp(file);
            const dataUrl = await toDataUrl(sanitized);
            image = dataUrl;
        } catch {
            onError("Couldn't read that image. Please try a different file.");
        } finally {
            processing = false;
        }
    };

    const handleFileSelect = (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = "";
        if (file) void addFile(file);
    };

    const clear = () => {
        image = null;
    };
</script>

<input
    bind:this={fileInput}
    type="file"
    accept={ACCEPTED.join(",")}
    onchange={handleFileSelect}
    aria-label="Upload image"
    class="hidden"
/>

{#if image || processing}
    <div class="flex flex-wrap items-center gap-1.5 px-1 pt-1 pb-2">
        {#if image}
            <div class="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                <img src={image} alt="Attached" class="h-full w-full object-cover" />
                <button
                    type="button"
                    onclick={clear}
                    aria-label="Remove attached image"
                    class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-sm transition-opacity duration-150 hover:opacity-100"
                >
                    <X class="h-3.5 w-3.5 text-white" aria-hidden="true" />
                </button>
            </div>
        {/if}
        {#if processing}
            <div
                class="border-chat-border-subtle flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed"
            >
                <Loader2 class="text-chat-text-muted h-4 w-4 animate-spin" aria-hidden="true" />
            </div>
        {/if}
        <span class="text-chat-text-muted text-[10px]">image attached</span>
    </div>
{/if}
