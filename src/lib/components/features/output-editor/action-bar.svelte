<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { cn } from "$lib/utils";

    interface Props {
        rowCount: number;
        warningCount: number;
        selectionCount: number;
        showBatchColumns: boolean;
        undoAvailable: boolean;
        undoLabel: string;
        canDownload: boolean;
        onToggleBatchColumns: () => void;
        onJumpToFirstWarning: () => void;
        onBulkDelete: () => void;
        onUndo: () => void;
        onDiscard: () => void;
        onDownload: () => void;
    }

    let {
        rowCount,
        warningCount,
        selectionCount,
        showBatchColumns,
        undoAvailable,
        undoLabel,
        canDownload,
        onToggleBatchColumns,
        onJumpToFirstWarning,
        onBulkDelete,
        onUndo,
        onDiscard,
        onDownload
    }: Props = $props();
</script>

<div
    class="border-border-strong/40 bg-surface/80 sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 backdrop-blur"
>
    <div class="flex flex-wrap items-center gap-2 text-sm">
        <span
            class="border-border-strong/40 bg-background inline-flex min-h-[44px] items-center rounded-md border px-3 whitespace-nowrap text-zinc-200 tabular-nums sm:min-h-9"
            aria-live="polite"
        >
            {rowCount}
            <span class="ml-1 text-zinc-500">{rowCount === 1 ? "order" : "orders"}</span>
        </span>

        {#if warningCount > 0}
            <button
                type="button"
                onclick={onJumpToFirstWarning}
                class="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 text-sm whitespace-nowrap text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:min-h-9 pointer-fine:hover:bg-amber-500/20"
                aria-label="{warningCount} warning{warningCount === 1 ? '' : 's'} — jump to first"
            >
                <span aria-hidden="true">⚠</span>
                {warningCount}
                <span class="text-amber-300/80">{warningCount === 1 ? "warning" : "warnings"}</span>
            </button>
        {/if}

        <button
            type="button"
            onclick={onToggleBatchColumns}
            aria-pressed={showBatchColumns}
            class={cn(
                "border-border-strong/40 inline-flex min-h-[44px] cursor-pointer items-center rounded-md border px-3 text-xs whitespace-nowrap sm:min-h-9",
                "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                showBatchColumns
                    ? "bg-courier-accent/15 text-courier-accent border-courier-accent/30"
                    : "bg-background text-zinc-400 pointer-fine:hover:text-white"
            )}
        >
            {showBatchColumns ? "Hide batch columns" : "Show batch columns"}
        </button>

        {#if selectionCount > 0}
            <Button
                variant="ghost"
                onclick={onBulkDelete}
                class="text-destructive pointer-fine:hover:bg-destructive/10 pointer-fine:hover:text-destructive min-h-[44px] sm:min-h-9"
            >
                Delete {selectionCount} selected
            </Button>
        {/if}

        {#if undoAvailable}
            <button
                type="button"
                onclick={onUndo}
                class="bg-surface-raised pointer-fine:hover:bg-surface-raised/80 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md px-3 text-xs whitespace-nowrap text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:min-h-9"
                aria-label="Undo {undoLabel}"
            >
                <svg
                    viewBox="0 0 16 16"
                    class="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                >
                    <path d="M4 8a4 4 0 014-4h4M4 8l-2-2m2 2l2-2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                Undo
                <span class="text-zinc-500">{undoLabel}</span>
            </button>
        {/if}
    </div>

    <div class="flex items-center gap-2">
        <Button
            variant="ghost"
            onclick={onDiscard}
            class="min-h-[44px] text-zinc-400 sm:min-h-9 pointer-fine:hover:text-zinc-200">Discard</Button
        >
        <button
            type="button"
            onclick={onDownload}
            disabled={!canDownload}
            class={cn(
                "bg-courier-accent text-background inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap sm:min-h-9",
                "pointer-fine:hover:bg-courier-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                "transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            )}
        >
            <svg
                viewBox="0 0 16 16"
                class="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
            >
                <path d="M8 2v9m0 0l-3-3m3 3l3-3M3 13h10" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Download .xlsx
        </button>
    </div>
</div>
