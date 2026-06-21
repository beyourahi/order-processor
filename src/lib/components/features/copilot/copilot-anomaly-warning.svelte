<script lang="ts">
    /**
     * Shared safety-check list rendered both inside a tool-badge (post-apply) and
     * in the confirm dialog (pre-apply). `anomaly.rowIndex` is 0-based; the +1 in
     * markup matches the 1-based row numbers the user sees in the editor grid.
     */
    import type { AnomalyResult } from "$lib/ai/types";
    import { AlertTriangle } from "@lucide/svelte";

    let { anomalies }: { anomalies: AnomalyResult[] } = $props();
</script>

{#if anomalies.length > 0}
    <div class="rounded-md border border-solid border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-300">
        <div class="mb-1 flex items-center gap-1.5 font-semibold">
            <AlertTriangle class="size-3.5 shrink-0" aria-hidden="true" />
            <span class="whitespace-nowrap">Safety check</span>
        </div>
        <ul class="space-y-1 pl-5 [list-style:disc]">
            {#each anomalies as anomaly, i (i)}
                <li class="text-pretty wrap-break-word opacity-90">Row {anomaly.rowIndex + 1}: {anomaly.reason}</li>
            {/each}
        </ul>
    </div>
{/if}
