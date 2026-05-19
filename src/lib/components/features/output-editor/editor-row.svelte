<script lang="ts">
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
        warningMessages: ReadonlyMap<CellColumn, string>;
        isSelected: boolean;
        onCellCommit: (column: CellColumn, value: string) => void;
        onCellNavigate: (rowIndex: number, column: CellColumn, direction: CellNavigationDirection) => void;
        onToggleSelect: (event: MouseEvent) => void;
        onDelete: () => void;
        onDuplicate: () => void;
    }

    let {
        row,
        rowIndex,
        columns,
        batchDefaults,
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

    // Glassmorphism: opaque fallback for no-backdrop-filter browsers, translucent + blur where supported.
    const glassBase =
        "border border-white/10 bg-zinc-800/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_-2px_rgba(0,0,0,0.35)] supports-[backdrop-filter]:bg-white/8 supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:backdrop-saturate-150";
</script>

<Table.Row data-selected={isSelected ? "true" : undefined} class={cn(isSelected && "bg-surface-raised/30")}>
    <Table.Cell class="sticky left-0 z-10 w-14 bg-inherit p-0 align-middle">
        <div class="flex items-center justify-center gap-1">
            <label
                class={cn(
                    "sleek flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md sm:min-h-10 sm:min-w-10",
                    glassBase,
                    "focus-within:ring-2 focus-within:ring-white/50 hover:border-white/20 hover:bg-white/15"
                )}
                aria-label="Select row {rowIndex + 1}"
            >
                <input
                    type="checkbox"
                    checked={isSelected}
                    onclick={(e) => onToggleSelect(e as unknown as MouseEvent)}
                    onkeydown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onToggleSelect(e as unknown as MouseEvent);
                        }
                    }}
                    class="accent-courier-accent h-4 w-4 cursor-pointer focus:outline-none"
                />
            </label>
        </div>
    </Table.Cell>

    <Table.Cell class="w-10 px-2 text-xs text-zinc-500 tabular-nums">
        {rowIndex + 1}
    </Table.Cell>

    {#each columns as column (column.key)}
        <Table.Cell class="border-border-strong/30 border-l p-0 align-middle">
            <EditorCell
                value={row[column.key as keyof SteadFastOrder] ?? ""}
                column={column.key}
                inputmode={column.inputmode}
                {rowIndex}
                warning={warningMessages.get(column.key) ?? null}
                isOverride={isOverride(column.key)}
                {isSelected}
                onCommit={(value) => onCellCommit(column.key, value)}
                onNavigate={(direction) => onCellNavigate(rowIndex, column.key, direction)}
            />
        </Table.Cell>
    {/each}

    <Table.Cell class="border-border-strong/30 sticky right-0 z-10 w-20 border-l bg-inherit p-0 align-middle">
        <div class="flex min-h-[44px] items-center justify-center gap-0.5 sm:min-h-10">
            <button
                type="button"
                onclick={onDuplicate}
                class={cn(
                    "sleek flex h-auto min-h-[44px] w-auto min-w-[44px] items-center justify-center rounded-md text-zinc-400 sm:h-9 sm:min-h-9 sm:w-9 sm:min-w-9",
                    glassBase,
                    "hover:border-white/20 hover:bg-white/15 hover:text-white active:bg-white/20",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
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
                    "sleek flex h-auto min-h-[44px] w-auto min-w-[44px] items-center justify-center rounded-md text-zinc-400 sm:h-9 sm:min-h-9 sm:w-9 sm:min-w-9",
                    glassBase,
                    "hover:bg-destructive/15 hover:border-destructive/30 hover:text-destructive active:bg-destructive/25",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
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
</Table.Row>
