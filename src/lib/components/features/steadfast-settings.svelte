<script lang="ts">
    import { brandSettings } from "$lib/stores";
    import { LoadingSpinner } from "$lib/components";
    import { Input } from "$lib/components/ui/input";

    interface Props {
        visible: boolean;
    }

    let { visible }: Props = $props();

    const contactName = $derived(brandSettings.value.contactName ?? "");
    const contactPhone = $derived(brandSettings.value.contactPhone ?? "");
    const merchantId = $derived(brandSettings.value.merchantId ?? "");

    const merchantIdInvalid = $derived(merchantId.length > 0 && merchantId.trim().length === 0);

    $effect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (brandSettings.saveState === "saving") {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    });

    const onContactName = (e: Event) => {
        brandSettings.updateField("contactName", (e.currentTarget as HTMLInputElement).value);
    };
    const onContactPhone = (e: Event) => {
        brandSettings.updateField("contactPhone", (e.currentTarget as HTMLInputElement).value);
    };
    const onMerchantId = (e: Event) => {
        brandSettings.updateField("merchantId", (e.currentTarget as HTMLInputElement).value);
    };
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
                {#if brandSettings.saveState === "saving"}
                    <LoadingSpinner size="sm" colorClass="border-t-courier-accent" />
                    <span class="text-zinc-500">Saving...</span>
                {:else if brandSettings.saveState === "saved"}
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
                {:else if brandSettings.saveState === "error"}
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
                    <span class="text-destructive text-xs">{brandSettings.saveError ?? "Save failed"}</span>
                    <button
                        onclick={() => brandSettings.dismissError()}
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
                        value={contactName}
                        placeholder="e.g., Lord Voldemort"
                        oninput={onContactName}
                    />
                </div>

                <div>
                    <label for="contact-phone" class="mb-1.5 block text-xs font-medium text-zinc-400">
                        Contact Phone <span class="text-zinc-600">(optional)</span>
                    </label>
                    <Input
                        id="contact-phone"
                        type="tel"
                        value={contactPhone}
                        placeholder="e.g., 1XXXXXXXXX"
                        oninput={onContactPhone}
                    />
                </div>

                <div>
                    <label for="merchant-id" class="mb-1.5 block text-xs font-medium text-zinc-400">
                        Merchant ID <span class="text-destructive">*</span>
                    </label>
                    <Input
                        id="merchant-id"
                        value={merchantId}
                        placeholder="e.g., 123456"
                        error={merchantIdInvalid}
                        oninput={onMerchantId}
                    />
                    {#if merchantIdInvalid}
                        <p class="text-destructive mt-1 text-xs">Merchant ID is required</p>
                    {/if}
                </div>
            </div>
        </div>

        <p class="mt-3 text-center text-xs text-zinc-500">Your personal SteadFast delivery settings</p>
    </div>
{/if}
