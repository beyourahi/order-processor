<script lang="ts">
    /**
     * Confirmation modal for Copilot batch mutations. The executor runs tool
     * calls sequentially, so at most one confirmation is pending at a time — but
     * a single confirmation's `diff` can list many rows (e.g. auto-fix).
     */
    import { tick } from "svelte";
    import { copilot } from "$lib/stores/copilot.svelte";
    import { respondToConfirmation } from "$lib/ai/chat-client";
    import { ShieldCheck, Undo2 } from "@lucide/svelte";
    import CopilotAnomalyWarning from "./copilot-anomaly-warning.svelte";

    const pending = $derived(copilot.pendingConfirmations[0] ?? null);

    const onConfirm = () => {
        if (pending) respondToConfirmation(pending.toolCallId, true);
    };
    const onReject = () => {
        if (pending) respondToConfirmation(pending.toolCallId, false);
    };

    const focusOnMount = (node: HTMLElement) => {
        tick().then(() => node.focus());
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (pending && event.key === "Escape") {
            event.preventDefault();
            onReject();
        }
    };
</script>

<svelte:window onkeydown={onKeydown} />

{#if pending}
    <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="copilot-confirm-title"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
        <div
            class="border-border-strong/60 bg-surface-raised flex max-h-[85vh] w-[min(30rem,calc(100vw-2rem))] flex-col rounded-2xl border shadow-2xl"
        >
            <div class="border-border-strong/40 flex items-center gap-2 border-b px-5 py-4">
                <ShieldCheck class="size-4 shrink-0 text-amber-300" aria-hidden="true" />
                <h2 id="copilot-confirm-title" class="text-sm font-medium text-balance text-white">
                    Confirm this change
                </h2>
            </div>

            <div class="ai-scroll flex-1 space-y-3 overflow-y-auto px-5 py-4">
                <p class="text-sm text-pretty text-zinc-300">{pending.humanLabel}.</p>

                {#if pending.diff.length > 0}
                    <div class="border-border-strong/40 bg-background space-y-2.5 rounded-lg border p-3">
                        {#each pending.diff as row, i (i)}
                            <div class="space-y-1">
                                <div class="font-mono text-[10px] tracking-wide text-zinc-400 uppercase">
                                    {row.label}
                                </div>
                                <div class="flex items-start gap-2 text-xs">
                                    <span class="text-destructive/70 shrink-0 font-mono select-none">−</span>
                                    <span class="min-w-0 break-words text-zinc-400 line-through">
                                        {row.current}
                                    </span>
                                </div>
                                <div class="flex items-start gap-2 text-xs">
                                    <span class="shrink-0 font-mono text-emerald-400 select-none">+</span>
                                    <span class="min-w-0 font-medium break-words text-white">
                                        {row.proposed}
                                    </span>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                {#if pending.anomalies.length > 0}
                    <CopilotAnomalyWarning anomalies={pending.anomalies} />
                {/if}

                <p class="flex items-start gap-1.5 text-[11px] text-pretty text-zinc-400">
                    <Undo2 class="mt-px size-3 shrink-0" aria-hidden="true" />
                    <span>{pending.inverseSummary}</span>
                </p>
            </div>

            <div class="border-border-strong/40 flex items-center justify-end gap-2 border-t px-5 py-4">
                <button
                    type="button"
                    onclick={onReject}
                    use:focusOnMount
                    class="border-border-strong/40 pointer-fine:hover:bg-surface inline-flex h-9 cursor-pointer items-center rounded-md border px-4 text-sm text-zinc-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                    Reject
                </button>
                <button
                    type="button"
                    onclick={onConfirm}
                    class="bg-primary text-primary-foreground pointer-fine:hover:bg-primary/90 inline-flex h-9 cursor-pointer items-center rounded-md px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                    Confirm
                </button>
            </div>
        </div>
    </div>
{/if}
