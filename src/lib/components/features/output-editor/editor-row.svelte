<script lang="ts">
    import { fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import type { SteadFastOrder } from "$lib/types";
    import { Table } from "$lib/components/ui";
    import { cn } from "$lib/utils";
    import EditorCell, { type CellNavigationDirection } from "./editor-cell.svelte";
    import type { CellColumn, ColumnDescriptor, BatchDefaults } from "./columns";

    interface Props {
        row: SteadFastOrder;
        rowIndex: number;
        columns: readonly ColumnDescriptor[];
        batchDefaults: BatchDefaults;
        animateEntry: boolean;
        warningMessages: ReadonlyMap<CellColumn, string>;
        isSelected: boolean;
        onCellCommit: (column: CellColumn, value: string) => void;
        onCellNavigate: (rowIndex: number, column: CellColumn, direction: CellNavigationDirection) => void;
        onToggleSelect: (event: MouseEvent | KeyboardEvent) => void;
        onDelete: () => void;
        onDuplicate: () => void;
    }

    let {
        row,
        rowIndex,
        columns,
        batchDefaults,
        animateEntry,
        warningMessages,
        isSelected,
        onCellCommit,
        onCellNavigate,
        onToggleSelect,
        onDelete,
        onDuplicate
    }: Props = $props();

    const isOverride = (column: CellColumn): boolean => {
        if (column in batchDefaults) {
            return row[column as keyof SteadFastOrder] !== batchDefaults[column as keyof BatchDefaults];
        }
        return false;
    };

    const controlBase = "border border-solid border-border bg-secondary shadow-sm";

    // Row motion uses `fade` (NOT `slide`) — Svelte rejects `slide` on
    // <tr> (transition_slide_display) because table rows have no overflow
    // clipping and ignore padding/margin. See CLAUDE.md warning #13.
    // animateEntry gates IN so initial mount is instant; OUT always animates.
    const ROW_MOTION_MS = 100;
    const rowMotion = (node: Element, { animate }: { animate: boolean }) =>
        animate ? fade(node, { duration: ROW_MOTION_MS, easing: cubicOut }) : { duration: 0 };
</script>

<tr
    data-slot="table-row"
    data-selected={isSelected ? "true" : undefined}
    in:rowMotion={{ animate: animateEntry }}
    out:rowMotion={{ animate: true }}
    class={cn(
        "border-border hover:bg-muted/40 border-b border-solid transition-colors",
        isSelected && "bg-secondary/40"
    )}
>
    <Table.Cell class="sticky left-0 z-10 w-14 bg-inherit p-0 align-middle">
        <div class="flex items-center justify-center gap-1">
            <label
                class={cn(
                    "sleek flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md sm:min-h-10 sm:min-w-10",
                    controlBase,
                    "focus-within:ring-ring hover:border-border-strong hover:bg-muted focus-within:ring-2"
                )}
                aria-label="Select row {rowIndex + 1}"
            >
                <input
                    type="checkbox"
                    checked={isSelected}
                    onclick={(e) => onToggleSelect(e)}
                    onkeydown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onToggleSelect(e);
                        }
                    }}
                    class="accent-courier-accent h-4 w-4 cursor-pointer focus:outline-none"
                />
            </label>
        </div>
    </Table.Cell>

    <Table.Cell class="text-muted-foreground w-10 px-2 text-xs tabular-nums">
        {rowIndex + 1}
    </Table.Cell>

    {#each columns as column (column.key)}
        <Table.Cell class="border-border border-l border-solid p-0 align-middle">
            <EditorCell
                value={row[column.key as keyof SteadFastOrder] ?? ""}
                column={column.key}
                inputmode={column.inputmode}
                multiline={column.multiline}
                {rowIndex}
                warning={warningMessages.get(column.key) ?? null}
                isOverride={isOverride(column.key)}
                {isSelected}
                onCommit={(value) => onCellCommit(column.key, value)}
                onNavigate={(direction) => onCellNavigate(rowIndex, column.key, direction)}
            />
        </Table.Cell>
    {/each}

    <Table.Cell class="border-border sticky right-0 z-10 w-20 border-l border-solid bg-inherit p-0 align-middle">
        <div class="flex min-h-[44px] items-center justify-center gap-0.5 sm:min-h-10">
            <button
                type="button"
                onclick={onDuplicate}
                class={cn(
                    "sleek text-muted-foreground flex h-auto min-h-[44px] w-auto min-w-[44px] cursor-pointer items-center justify-center rounded-md sm:h-9 sm:min-h-9 sm:w-9 sm:min-w-9",
                    controlBase,
                    "hover:border-border-strong hover:bg-muted hover:text-foreground active:bg-muted",
                    "focus-visible:ring-ring focus:outline-none focus-visible:ring-2"
                )}
                title="Duplicate row"
                aria-label="Duplicate row {rowIndex + 1}"
            >
                <svg
                    viewBox="0 0 16 16"
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                >
                    <rect x="3" y="3" width="8" height="8" rx="1" />
                    <rect x="6" y="6" width="8" height="8" rx="1" />
                </svg>
            </button>
            <button
                type="button"
                onclick={onDelete}
                class={cn(
                    "sleek text-muted-foreground flex h-auto min-h-[44px] w-auto min-w-[44px] cursor-pointer items-center justify-center rounded-md sm:h-9 sm:min-h-9 sm:w-9 sm:min-w-9",
                    controlBase,
                    "hover:bg-destructive/15 hover:border-destructive/30 hover:text-destructive active:bg-destructive/25",
                    "focus-visible:ring-ring focus:outline-none focus-visible:ring-2"
                )}
                title="Delete row"
                aria-label="Delete row {rowIndex + 1}"
            >
                <svg
                    viewBox="0 0 16 16"
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                >
                    <path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9h5l.5-9" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
        </div>
    </Table.Cell>
</tr>
