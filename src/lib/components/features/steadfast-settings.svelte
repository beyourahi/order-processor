<!--
  SteadFast Settings Component
  Auto-saving contact info form with debounced persistence and retry logic
-->
<script lang="ts">
    import { hasMerchantId } from "$lib/stores";
    import { LoadingSpinner } from "$lib/components";
    import { Input } from "$lib/components/ui/input";
    import type { BrandSettingsPayload } from "$lib/types";

    interface Props {
        visible: boolean;
    }

    let { visible }: Props = $props();

    // Form values
    let contactName = $state("");
    let contactPhone = $state("");
    let merchantId = $state("");

    // Save state machine
    type SaveState = "idle" | "loading" | "saving" | "saved" | "error";
    let saveState: SaveState = $state("idle");
    let saveError: string | null = $state(null);
    let hasFetched = $state(false);

    // AbortController for cancelling in-flight requests
    let abortController: AbortController | null = null;

    // Debounce timer
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000];

    const isValid = $derived(merchantId.trim().length > 0);

    // Sync merchant ID status to store
    $effect(() => {
        hasMerchantId.set(isValid);
    });

    // Fetch settings when component becomes visible
    $effect(() => {
        if (visible && !hasFetched) {
            fetchSettings();
        }
    });

    // beforeunload guard
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

    async function fetchSettings() {
        saveState = "loading";
        try {
            const response = await fetch("/api/brand-settings");
            if (!response.ok) throw new Error("Failed to load settings");
            const result = (await response.json()) as {
                data: { contactName?: string; contactPhone?: string; merchantId?: string };
            };
            contactName = result.data.contactName ?? "";
            contactPhone = result.data.contactPhone ?? "";
            merchantId = result.data.merchantId ?? "";
            hasFetched = true;
            saveState = "idle";
        } catch (e) {
            saveError = e instanceof Error ? e.message : "Failed to load settings";
            saveState = "error";
        }
    }

    function scheduleAutoSave() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (isValid) performSave();
        }, 500);
    }

    async function performSave(attempt = 0) {
        // Cancel any in-flight request
        if (abortController) abortController.abort();
        abortController = new AbortController();

        saveState = "saving";
        saveError = null;

        try {
            const payload: BrandSettingsPayload = {};
            if (contactName) payload.contactName = contactName;
            if (contactPhone) payload.contactPhone = contactPhone;
            if (merchantId) payload.merchantId = merchantId;

            const response = await fetch("/api/brand-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: abortController.signal
            });

            if (!response.ok) throw new Error("Failed to save settings");

            saveState = "saved";
            setTimeout(() => {
                if (saveState === "saved") saveState = "idle";
            }, 2000);
        } catch (e) {
            if (e instanceof Error && e.name === "AbortError") return; // cancelled, not an error

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
        <!-- Section divider -->
        <div class="mb-4 flex items-center gap-3">
            <div class="h-px flex-1 bg-zinc-800"></div>
            <span class="text-xs font-medium tracking-wider text-zinc-500 uppercase">SteadFast Settings</span>
            <div class="h-px flex-1 bg-zinc-800"></div>
        </div>

        <!-- Form card -->
        <div class="sleek rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
            {#if saveState === "loading"}
                <div class="flex items-center justify-center py-6">
                    <LoadingSpinner size="md" colorClass="border-t-emerald-500" />
                </div>
            {:else}
                <!-- Save status indicator -->
                <div class="mb-3 flex items-center justify-end gap-1.5 text-xs" aria-live="polite" aria-atomic="true">
                    {#if saveState === "saving"}
                        <LoadingSpinner size="sm" colorClass="border-t-emerald-500" />
                        <span class="text-zinc-500">Saving...</span>
                    {:else if saveState === "saved"}
                        <svg
                            class="h-3 w-3 text-emerald-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="3"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-emerald-500">Saved</span>
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
                        <span class="text-destructive">{saveError ?? "Save failed"}</span>
                        <button onclick={dismissError} class="ml-1 text-zinc-500 underline hover:text-zinc-300">
                            Dismiss
                        </button>
                    {/if}
                </div>

                <div class="space-y-4">
                    <!-- Contact Name -->
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

                    <!-- Contact Phone -->
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

                    <!-- Merchant ID (Required) -->
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
            {/if}
        </div>

        <p class="mt-3 text-center text-xs text-zinc-500">Your personal SteadFast delivery settings</p>
    </div>
{/if}
