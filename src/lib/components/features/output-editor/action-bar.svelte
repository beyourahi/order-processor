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
    class="border-border bg-card/90 sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-solid p-3 shadow-sm backdrop-blur"
>
    <div class="flex flex-wrap items-center gap-2 text-sm">
        <span
            class="border-border bg-background text-foreground inline-flex min-h-[44px] items-center rounded-md border border-solid px-3 whitespace-nowrap tabular-nums sm:min-h-9"
            aria-live="polite"
        >
            {rowCount}
            <span class="text-muted-foreground ml-1">{rowCount === 1 ? "order" : "orders"}</span>
        </span>

        {#if warningCount > 0}
            <button
                type="button"
                onclick={onJumpToFirstWarning}
                class="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-md border border-solid border-amber-500/40 bg-amber-500/10 px-3 text-sm whitespace-nowrap text-amber-300 transition-colors hover:bg-amber-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 sm:min-h-9"
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
                "inline-flex min-h-[44px] cursor-pointer items-center rounded-md border border-solid px-3 text-xs whitespace-nowrap sm:min-h-9",
                "focus-visible:ring-ring transition-colors focus:outline-none focus-visible:ring-2",
                showBatchColumns
                    ? "bg-courier-accent/10 text-courier-accent border-courier-accent/30"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
        >
            {showBatchColumns ? "Hide batch columns" : "Show batch columns"}
        </button>

        {#if selectionCount > 0}
            <Button variant="destructive" size="lg" onclick={onBulkDelete} class="min-h-[44px] sm:min-h-9">
                Delete {selectionCount} selected
            </Button>
        {/if}

        {#if undoAvailable}
            <button
                type="button"
                onclick={onUndo}
                class="bg-secondary text-foreground hover:bg-secondary/80 focus-visible:ring-ring inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md px-3 text-xs whitespace-nowrap focus:outline-none focus-visible:ring-2 sm:min-h-9"
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
                <span class="text-muted-foreground">{undoLabel}</span>
            </button>
        {/if}
    </div>

    <div class="flex items-center gap-2">
        <Button variant="ghost" size="lg" onclick={onDiscard} class="min-h-[44px] sm:min-h-9">Discard</Button>
        <button
            type="button"
            onclick={onDownload}
            disabled={!canDownload}
            class={cn(
                "bg-courier-accent text-background inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap sm:min-h-9",
                "hover:bg-courier-accent/90 focus-visible:ring-courier-accent/40 focus:outline-none focus-visible:ring-2",
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
