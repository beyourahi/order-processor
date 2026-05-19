<script lang="ts">
    import type { SteadFastOrder } from "$lib/types";
    import { Table } from "$lib/components/ui";
    import { cn } from "$lib/utils";
    import EditorRow from "./editor-row.svelte";
    import type { CellNavigationDirection } from "./editor-cell.svelte";
    import { PER_ROW_COLUMNS, STEADFAST_COLUMNS, type CellColumn, type BatchDefaults } from "./columns";

    // Shared empty map for rows without warnings — avoids per-render allocation.
    const EMPTY_WARNING_MAP: ReadonlyMap<CellColumn, string> = new Map();

    interface Props {
        rows: SteadFastOrder[];
        batchDefaults: BatchDefaults;
        showBatchColumns: boolean;
        selection: ReadonlySet<number>;
        warningsByRow: ReadonlyMap<number, ReadonlyMap<CellColumn, string>>;
        onCellCommit: (rowIndex: number, column: CellColumn, value: string) => void;
        onToggleSelect: (rowIndex: number, event: MouseEvent) => void;
        onDeleteRow: (rowIndex: number) => void;
        onDuplicateRow: (rowIndex: number) => void;
        onAddRow: () => void;
    }

    let {
        rows,
        batchDefaults,
        showBatchColumns,
        selection,
        warningsByRow,
        onCellCommit,
        onToggleSelect,
        onDeleteRow,
        onDuplicateRow,
        onAddRow
    }: Props = $props();

    let gridRef = $state<HTMLDivElement | null>(null);

    const visibleColumns = $derived(showBatchColumns ? STEADFAST_COLUMNS : PER_ROW_COLUMNS);
    const visibleColumnKeys = $derived(visibleColumns.map((c) => c.key));

    /**
     * Resolve where a navigation event should move focus, given the source
     * cell and the requested direction. Tab wraps to next/previous row,
     * arrow keys stay within their row/column. Out-of-bounds = noop.
     */
    const resolveNavigationTarget = (
        rowIndex: number,
        column: CellColumn,
        direction: CellNavigationDirection
    ): { row: number; column: CellColumn } | null => {
        const columnIndex = visibleColumnKeys.indexOf(column);
        if (columnIndex === -1) return null;

        switch (direction) {
            case "left": {
                const next = columnIndex - 1;
                if (next < 0) return null;
                const col = visibleColumnKeys[next];
                return col === undefined ? null : { row: rowIndex, column: col };
            }
            case "right": {
                const next = columnIndex + 1;
                if (next >= visibleColumnKeys.length) return null;
                const col = visibleColumnKeys[next];
                return col === undefined ? null : { row: rowIndex, column: col };
            }
            case "up": {
                if (rowIndex - 1 < 0) return null;
                return { row: rowIndex - 1, column };
            }
            case "down": {
                if (rowIndex + 1 >= rows.length) return null;
                return { row: rowIndex + 1, column };
            }
            case "next": {
                const next = columnIndex + 1;
                if (next >= visibleColumnKeys.length) {
                    if (rowIndex + 1 >= rows.length) return null;
                    const firstCol = visibleColumnKeys[0];
                    return firstCol === undefined ? null : { row: rowIndex + 1, column: firstCol };
                }
                const col = visibleColumnKeys[next];
                return col === undefined ? null : { row: rowIndex, column: col };
            }
            case "previous": {
                const prev = columnIndex - 1;
                if (prev < 0) {
                    if (rowIndex - 1 < 0) return null;
                    const lastCol = visibleColumnKeys[visibleColumnKeys.length - 1];
                    return lastCol === undefined ? null : { row: rowIndex - 1, column: lastCol };
                }
                const col = visibleColumnKeys[prev];
                return col === undefined ? null : { row: rowIndex, column: col };
            }
        }
    };

    const focusCell = (rowIndex: number, column: CellColumn) => {
        if (!gridRef) return;
        // Attribute value is quoted, so only " needs escaping; column names
        // contain spaces but no quotes — no escape needed.
        const selector = `[data-cell="${rowIndex}:${column}"]`;
        const target = gridRef.querySelector<HTMLElement>(selector);
        target?.focus();
    };

    const handleNavigate = (rowIndex: number, column: CellColumn, direction: CellNavigationDirection) => {
        const target = resolveNavigationTarget(rowIndex, column, direction);
        if (target) focusCell(target.row, target.column);
    };

    /**
     * Public method on the grid so the editor can focus the most recently
     * added/duplicated row's Name cell, per FR-16/FR-17.
     */
    export const focusNameCell = (rowIndex: number) => {
        // wait one tick for the new row to render
        queueMicrotask(() => focusCell(rowIndex, "Name"));
    };
</script>

<div
    bind:this={gridRef}
    aria-label="Editable orders table"
    class="no-scrollbar border-border-strong/40 bg-surface/30 max-h-[50vh] overflow-auto rounded-lg border sm:max-h-[60vh] lg:max-h-[72vh] lg:min-h-[62vh]"
>
    <Table.Root class="w-full text-base">
        <Table.Header class="bg-surface-raised/95 sticky top-0 z-20 backdrop-blur">
            <Table.Row class="border-border-strong/50">
                <Table.Head
                    class="bg-surface-raised/95 sticky left-0 z-30 w-14 text-center text-[10px]"
                    aria-label="Select"
                ></Table.Head>
                <Table.Head class="w-10 text-right text-[10px]" aria-label="Row number">#</Table.Head>
                {#each visibleColumns as column (column.key)}
                    <Table.Head
                        class={cn(
                            "border-border-strong/30 min-w-[10rem] border-l text-[11px]",
                            column.kind === "batch-constant" && "text-courier-accent/80"
                        )}
                    >
                        {column.key}
                        {#if column.required}
                            <span class="text-amber-400/70" aria-label="required">*</span>
                        {/if}
                    </Table.Head>
                {/each}
                <Table.Head class="bg-surface-raised/95 sticky right-0 z-30 w-20 text-center" aria-label="Actions"
                ></Table.Head>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#each rows as row, rowIndex (rowIndex)}
                <EditorRow
                    {row}
                    {rowIndex}
                    columns={visibleColumns}
                    {batchDefaults}
                    warningMessages={warningsByRow.get(rowIndex) ?? EMPTY_WARNING_MAP}
                    isSelected={selection.has(rowIndex)}
                    onCellCommit={(column, value) => onCellCommit(rowIndex, column, value)}
                    onCellNavigate={handleNavigate}
                    onToggleSelect={(event) => onToggleSelect(rowIndex, event)}
                    onDelete={() => onDeleteRow(rowIndex)}
                    onDuplicate={() => onDuplicateRow(rowIndex)}
                />
            {/each}
        </Table.Body>
    </Table.Root>

    <button
        type="button"
        onclick={onAddRow}
        class="border-border-strong/30 hover:bg-surface-raised/40 hover:text-courier-accent flex min-h-[44px] w-full items-center justify-center gap-2 border-t border-dashed text-sm text-zinc-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:min-h-11"
        aria-label="Add row"
    >
        <svg
            viewBox="0 0 16 16"
            class="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
        >
            <path d="M8 3v10M3 8h10" stroke-linecap="round" />
        </svg>
        Add row
    </button>
</div>
