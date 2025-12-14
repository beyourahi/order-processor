<!--
  SteadFast Settings Component
  Editable contact info form that appears when SteadFast courier is selected
  Data is shared across all users of the same brand
-->
<script lang="ts">
    import { cn } from "$lib/utils";
    import { hasMerchantId } from "$lib/stores";
    import type { BrandSettingsPayload } from "$lib/types";

    interface Props {
        visible: boolean;
        brandName: string;
    }

    let { visible, brandName }: Props = $props();

    // Form state
    let contactName = $state("");
    let contactPhone = $state("");
    let merchantId = $state("");

    // UI state
    type FormState = "idle" | "loading" | "editing" | "saving" | "saved" | "error";
    let formState: FormState = $state("idle");
    let errorMessage: string | null = $state(null);
    let hasFetched = $state(false);

    // Track original values for change detection
    let originalValues = $state({ contactName: "", contactPhone: "", merchantId: "" });

    const hasChanges = $derived(
        contactName !== originalValues.contactName ||
            contactPhone !== originalValues.contactPhone ||
            merchantId !== originalValues.merchantId
    );

    // Validation: Merchant ID is required
    const isValid = $derived(merchantId.trim().length > 0);
    const canSave = $derived(hasChanges && isValid);

    // Sync merchant ID status to store for cross-component communication
    $effect(() => {
        hasMerchantId.set(isValid);
    });

    // Fetch settings when component becomes visible
    $effect(() => {
        if (visible && !hasFetched) {
            fetchSettings();
        }
    });

    async function fetchSettings() {
        formState = "loading";
        try {
            const response = await fetch("/api/brand-settings");
            if (!response.ok) throw new Error("Failed to load settings");

            const result = (await response.json()) as {
                data: { contactName?: string; contactPhone?: string; merchantId?: string };
            };
            contactName = result.data.contactName ?? "";
            contactPhone = result.data.contactPhone ?? "";
            merchantId = result.data.merchantId ?? "";

            // Store original values for change detection
            originalValues = { contactName, contactPhone, merchantId };
            hasFetched = true;
            formState = "idle";
        } catch (e) {
            errorMessage = e instanceof Error ? e.message : "Failed to load settings";
            formState = "error";
        }
    }

    async function saveSettings() {
        formState = "saving";
        try {
            // Build payload - only include non-empty values
            const payload: BrandSettingsPayload = {};
            if (contactName) payload.contactName = contactName;
            if (contactPhone) payload.contactPhone = contactPhone;
            if (merchantId) payload.merchantId = merchantId;

            const response = await fetch("/api/brand-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to save settings");

            const result = (await response.json()) as {
                data: { contactName?: string; contactPhone?: string; merchantId?: string };
            };
            originalValues = {
                contactName: result.data.contactName ?? "",
                contactPhone: result.data.contactPhone ?? "",
                merchantId: result.data.merchantId ?? ""
            };

            formState = "saved";
            setTimeout(() => {
                formState = "idle";
            }, 2000);
        } catch (e) {
            errorMessage = e instanceof Error ? e.message : "Failed to save settings";
            formState = "error";
        }
    }

    function handleFocus() {
        if (formState === "idle" || formState === "saved") {
            formState = "editing";
        }
    }

    function dismissError() {
        errorMessage = null;
        formState = "idle";
    }
</script>

{#if visible}
    <div class="animate-in fade-in slide-in-from-top-2 w-full max-w-sm duration-300">
        <!-- Section divider -->
        <div class="mb-4 flex items-center gap-3">
            <div class="h-px flex-1 bg-zinc-800"></div>
            <span class="text-xs font-medium tracking-wider text-zinc-500 uppercase"> SteadFast Settings </span>
            <div class="h-px flex-1 bg-zinc-800"></div>
        </div>

        <!-- Form card -->
        <div class="sleek rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
            {#if formState === "loading"}
                <div class="flex items-center justify-center py-6">
                    <div class="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500"></div>
                </div>
            {:else if formState === "error"}
                <div class="flex flex-col items-center gap-3 py-4 text-center">
                    <p class="text-sm text-red-400">{errorMessage}</p>
                    <button
                        onclick={dismissError}
                        class="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                        Dismiss
                    </button>
                </div>
            {:else}
                <div class="space-y-4">
                    <!-- Contact Name -->
                    <div>
                        <label for="contact-name" class="mb-1.5 block text-xs font-medium text-zinc-400">
                            Contact Name
                            <span class="text-zinc-600">(optional)</span>
                        </label>
                        <input
                            id="contact-name"
                            type="text"
                            bind:value={contactName}
                            onfocus={handleFocus}
                            placeholder="e.g., Lord Voldemort"
                            class={cn(
                                "w-full rounded-lg border bg-zinc-800/50 px-3 py-2.5 text-sm text-white placeholder-zinc-500",
                                "transition-all duration-200",
                                "focus:ring-2 focus:ring-emerald-500/50 focus:outline-none",
                                "border-zinc-700 focus:border-emerald-500/50"
                            )}
                        />
                    </div>

                    <!-- Contact Phone -->
                    <div>
                        <label for="contact-phone" class="mb-1.5 block text-xs font-medium text-zinc-400">
                            Contact Phone
                            <span class="text-zinc-600">(optional)</span>
                        </label>
                        <input
                            id="contact-phone"
                            type="tel"
                            bind:value={contactPhone}
                            onfocus={handleFocus}
                            placeholder="e.g., 1XXXXXXXXX"
                            class={cn(
                                "w-full rounded-lg border bg-zinc-800/50 px-3 py-2.5 text-sm text-white placeholder-zinc-500",
                                "transition-all duration-200",
                                "focus:ring-2 focus:ring-emerald-500/50 focus:outline-none",
                                "border-zinc-700 focus:border-emerald-500/50"
                            )}
                        />
                    </div>

                    <!-- Merchant ID (Required) -->
                    <div>
                        <label for="merchant-id" class="mb-1.5 block text-xs font-medium text-zinc-400">
                            Merchant ID
                            <span class="text-red-400">*</span>
                        </label>
                        <input
                            id="merchant-id"
                            type="text"
                            bind:value={merchantId}
                            onfocus={handleFocus}
                            placeholder="e.g., 123456"
                            required
                            class={cn(
                                "w-full rounded-lg border bg-zinc-800/50 px-3 py-2.5 text-sm text-white placeholder-zinc-500",
                                "transition-all duration-200",
                                "focus:ring-2 focus:ring-emerald-500/50 focus:outline-none",
                                !isValid && formState === "editing"
                                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50"
                                    : "border-zinc-700 focus:border-emerald-500/50"
                            )}
                        />
                        {#if !isValid && formState === "editing"}
                            <p class="mt-1 text-xs text-red-400">Merchant ID is required</p>
                        {/if}
                    </div>

                    <!-- Save button -->
                    <button
                        onclick={saveSettings}
                        disabled={!canSave || formState === "saving"}
                        class={cn(
                            "w-full rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
                            canSave && formState !== "saving"
                                ? "cursor-pointer bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 active:scale-[0.98]"
                                : "cursor-not-allowed bg-zinc-800/50 text-zinc-500"
                        )}
                    >
                        {#if formState === "saving"}
                            <span class="flex items-center justify-center gap-2">
                                <div
                                    class="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-emerald-400"
                                ></div>
                                Saving...
                            </span>
                        {:else if formState === "saved"}
                            <span class="text-emerald-400">Saved!</span>
                        {:else}
                            Save Changes
                        {/if}
                    </button>
                </div>
            {/if}
        </div>

        <!-- Helper text -->
        <p class="mt-3 text-center text-xs text-zinc-500">
            Settings are shared with all {brandName} team members
        </p>
    </div>
{/if}
