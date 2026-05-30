<script lang="ts">
    import { onMount } from "svelte";
    import type { SteadFastOrder } from "$lib/types";
    import { Table } from "$lib/components/ui";
    import { cn } from "$lib/utils";
    import EditorRow from "./editor-row.svelte";
    import type { CellNavigationDirection } from "./editor-cell.svelte";
    import { PER_ROW_COLUMNS, STEADFAST_COLUMNS, type CellColumn, type BatchDefaults } from "./columns";

    // Singleton sentinel handed to rows with no warnings — avoids allocating an empty Map per render.
    const EMPTY_WARNING_MAP: ReadonlyMap<CellColumn, string> = new Map();

    interface Props {
        rows: SteadFastOrder[];
        rowIds: string[];
        batchDefaults: BatchDefaults;
        showBatchColumns: boolean;
        selection: ReadonlySet<number>;
        warningsByRow: ReadonlyMap<number, ReadonlyMap<CellColumn, string>>;
        onCellCommit: (rowIndex: number, column: CellColumn, value: string) => void;
        onToggleSelect: (rowIndex: number, event: MouseEvent | KeyboardEvent) => void;
        onDeleteRow: (rowIndex: number) => void;
        onDuplicateRow: (rowIndex: number) => void;
        onAddRow: () => void;
    }

    let {
        rows,
        rowIds,
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

    // Gate row entry transitions so the initial mount is instant and only
    // user-driven row inserts animate (UX §Motion in PRD).
    let mounted = $state(false);
    onMount(() => {
        mounted = true;
    });

    const visibleColumns = $derived(showBatchColumns ? STEADFAST_COLUMNS : PER_ROW_COLUMNS);
    const visibleColumnKeys = $derived(visibleColumns.map((c) => c.key));

    /**
     * Map (source cell, direction) → target cell or null (out-of-bounds noop).
     * Arrow keys stay in their row/column; Tab/Shift+Tab wraps to next/prev row.
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
        // CellColumn values are a fixed string union (no quotes) — safe to interpolate without CSS.escape.
        const selector = `[data-cell="${rowIndex}:${column}"]`;
        const target = gridRef.querySelector<HTMLElement>(selector);
        target?.focus();
    };

    const handleNavigate = (rowIndex: number, column: CellColumn, direction: CellNavigationDirection) => {
        const target = resolveNavigationTarget(rowIndex, column, direction);
        if (target) focusCell(target.row, target.column);
    };

    // FR-16/FR-17: called by parent after add/duplicate to land focus in the new row.
    // microtask waits for the EditorRow to render.
    export const focusNameCell = (rowIndex: number) => {
        queueMicrotask(() => focusCell(rowIndex, "Name"));
    };
</script>

<div
    bind:this={gridRef}
    aria-label="Editable orders table"
    class="no-scrollbar border-border bg-card max-h-[50vh] overflow-auto rounded-lg border border-solid sm:max-h-[60vh]"
>
    <Table.Root class="w-full text-base">
        <Table.Header class="bg-secondary sticky top-0 z-20 backdrop-blur">
            <Table.Row class="border-border">
                <Table.Head class="bg-secondary sticky left-0 z-30 w-14 text-center text-micro" aria-label="Select"
                ></Table.Head>
                <Table.Head class="w-10 text-right text-micro" aria-label="Row number">#</Table.Head>
                {#each visibleColumns as column (column.key)}
                    <Table.Head
                        class={cn(
                            "border-border min-w-[10rem] border-l border-solid text-[11px]",
                            column.kind === "batch-constant" && "text-courier-accent/80"
                        )}
                    >
                        {column.key}
                        {#if column.required}
                            <span class="text-amber-400/70" aria-label="required">*</span>
                        {/if}
                    </Table.Head>
                {/each}
                <Table.Head class="bg-secondary sticky right-0 z-30 w-20 text-center" aria-label="Actions"></Table.Head>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#each rows as row, rowIndex (rowIds[rowIndex])}
                <EditorRow
                    {row}
                    {rowIndex}
                    columns={visibleColumns}
                    {batchDefaults}
                    animateEntry={mounted}
                    warningMessages={warningsByRow.get(rowIndex) ?? EMPTY_WARNING_MAP}
                    isSelected={selection.has(rowIndex)}
                    onCellCommit={(column, value) => onCellCommit(rowIndex, column, value)}
                    onCellNavigate={handleNavigate}
                    onToggleSelect={(event) => onToggleSelect(rowIndex, event)}
                    onDelete={() => onDeleteRow(rowIndex)}
                    onDuplicate={() => onDuplicateRow(rowIndex)}
                />
            {:else}
                <tr>
                    <td
                        colspan={visibleColumns.length + 3}
                        class="text-muted-foreground px-4 py-12 text-center text-sm text-pretty"
                    >
                        No orders yet — click Add row to create the first.
                    </td>
                </tr>
            {/each}
        </Table.Body>
    </Table.Root>

    <button
        type="button"
        onclick={onAddRow}
        class="border-border text-muted-foreground hover:bg-secondary/60 hover:text-courier-accent focus-visible:ring-ring flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 border-t border-dashed text-sm whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 sm:min-h-11"
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
