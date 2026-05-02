<script lang="ts">
    import { brandSettings } from "$lib/stores";
    import { LoadingSpinner } from "$lib/components";
    import { Input } from "$lib/components/ui/input";
    import type { BrandSettingsPayload } from "$lib/types";

    interface Props {
        visible: boolean;
    }

    let { visible }: Props = $props();

    let contactName = $state($brandSettings.contactName ?? "");
    let contactPhone = $state($brandSettings.contactPhone ?? "");
    let merchantId = $state($brandSettings.merchantId ?? "");

    type SaveState = "idle" | "saving" | "saved" | "error";
    let saveState: SaveState = $state("idle");
    let saveError: string | null = $state(null);

    let abortController: AbortController | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000];

    const isValid = $derived(merchantId.trim().length > 0);

    $effect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (saveState === "saving") {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    });

    function scheduleAutoSave() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (isValid) performSave();
        }, 500);
    }

    async function performSave(attempt = 0) {
        if (abortController) abortController.abort();
        abortController = new AbortController();

        saveState = "saving";
        saveError = null;

        try {
            const payload: BrandSettingsPayload = { merchantId };
            if (contactName) payload.contactName = contactName;
            if (contactPhone) payload.contactPhone = contactPhone;

            const response = await fetch("/api/brand-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: abortController.signal
            });

            if (!response.ok) throw new Error("Failed to save settings");

            brandSettings.set({
                contactName: contactName || null,
                contactPhone: contactPhone || null,
                merchantId
            });

            saveState = "saved";
            setTimeout(() => {
                if (saveState === "saved") saveState = "idle";
            }, 2000);
        } catch (e) {
            if (e instanceof Error && e.name === "AbortError") return;

            if (attempt < MAX_RETRIES) {
                const delay = RETRY_DELAYS[attempt] ?? 4000;
                setTimeout(() => performSave(attempt + 1), delay);
                return;
            }

            saveError = e instanceof Error ? e.message : "Failed to save settings";
            saveState = "error";
        }
    }

    function dismissError() {
        saveError = null;
        saveState = "idle";
    }
</script>

{#if visible}
    <div class="animate-in fade-in slide-in-from-top-2 w-full max-w-sm duration-300">
        <div class="mb-4 flex items-center gap-3">
            <div class="bg-surface-raised h-px flex-1"></div>
            <span class="text-xs font-medium tracking-wider text-zinc-500 uppercase">SteadFast Settings</span>
            <div class="bg-surface-raised h-px flex-1"></div>
        </div>

        <div class="sleek border-surface-raised bg-surface/50 rounded-xl border p-4 backdrop-blur-sm">
            <div class="mb-3 flex items-center justify-end gap-1.5 text-xs" aria-live="polite" aria-atomic="true">
                {#if saveState === "saving"}
                    <LoadingSpinner size="sm" colorClass="border-t-courier-accent" />
                    <span class="text-zinc-500">Saving...</span>
                {:else if saveState === "saved"}
                    <svg
                        class="text-courier-accent h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-courier-accent">Saved</span>
                {:else if saveState === "error"}
                    <svg
                        class="text-destructive h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        />
                    </svg>
                    <span class="text-destructive text-xs">{saveError ?? "Save failed"}</span>
                    <button
                        onclick={dismissError}
                        class="ml-1 rounded text-xs text-zinc-500 underline hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    >
                        Dismiss
                    </button>
                {/if}
            </div>

            <div class="space-y-4">
                <div>
                    <label for="contact-name" class="mb-1.5 block text-xs font-medium text-zinc-400">
                        Contact Name <span class="text-zinc-600">(optional)</span>
                    </label>
                    <Input
                        id="contact-name"
                        bind:value={contactName}
                        placeholder="e.g., Lord Voldemort"
                        oninput={scheduleAutoSave}
                    />
                </div>

                <div>
                    <label for="contact-phone" class="mb-1.5 block text-xs font-medium text-zinc-400">
                        Contact Phone <span class="text-zinc-600">(optional)</span>
                    </label>
                    <Input
                        id="contact-phone"
                        type="tel"
                        bind:value={contactPhone}
                        placeholder="e.g., 1XXXXXXXXX"
                        oninput={scheduleAutoSave}
                    />
                </div>

                <div>
                    <label for="merchant-id" class="mb-1.5 block text-xs font-medium text-zinc-400">
                        Merchant ID <span class="text-destructive">*</span>
                    </label>
                    <Input
                        id="merchant-id"
                        bind:value={merchantId}
                        placeholder="e.g., 123456"
                        error={!isValid && merchantId.length > 0}
                        oninput={scheduleAutoSave}
                    />
                    {#if !isValid && merchantId.length > 0}
                        <p class="text-destructive mt-1 text-xs">Merchant ID is required</p>
                    {/if}
                </div>
            </div>
        </div>

        <p class="mt-3 text-center text-xs text-zinc-500">Your personal SteadFast delivery settings</p>
    </div>
{/if}
