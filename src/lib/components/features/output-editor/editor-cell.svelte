<script lang="ts">
    import { cn } from "$lib/utils";
    import type { CellColumn, ColumnInputMode } from "./columns";

    export type CellNavigationDirection = "up" | "down" | "left" | "right" | "next" | "previous";

    interface Props {
        value: string;
        column: CellColumn;
        inputmode: ColumnInputMode;
        rowIndex: number;
        warning?: string | null;
        isOverride?: boolean;
        isSelected?: boolean;
        onCommit: (newValue: string) => void;
        onNavigate?: (direction: CellNavigationDirection) => void;
    }

    let {
        value,
        column,
        inputmode,
        rowIndex,
        warning = null,
        isOverride = false,
        isSelected = false,
        onCommit,
        onNavigate
    }: Props = $props();

    let isEditing = $state(false);
    let draft = $state<string>("");
    let cellRef = $state<HTMLDivElement | null>(null);
    let inputRef = $state<HTMLInputElement | null>(null);

    const enterEditMode = () => {
        draft = value;
        isEditing = true;
        // wait for the input to mount, then focus + select all
        queueMicrotask(() => {
            inputRef?.focus();
            inputRef?.select();
        });
    };

    const commit = () => {
        if (!isEditing) return;
        isEditing = false;
        if (draft !== value) {
            onCommit(draft);
        }
        // restore focus to the cell wrapper so arrow keys keep working
        queueMicrotask(() => cellRef?.focus());
    };

    const revert = () => {
        if (!isEditing) return;
        draft = value;
        isEditing = false;
        queueMicrotask(() => cellRef?.focus());
    };

    const handleCellKeydown = (event: KeyboardEvent) => {
        if (isEditing) return;

        switch (event.key) {
            case "Enter":
            case "F2":
                event.preventDefault();
                enterEditMode();
                return;
            case "ArrowUp":
                event.preventDefault();
                onNavigate?.("up");
                return;
            case "ArrowDown":
                event.preventDefault();
                onNavigate?.("down");
                return;
            case "ArrowLeft":
                event.preventDefault();
                onNavigate?.("left");
                return;
            case "ArrowRight":
                event.preventDefault();
                onNavigate?.("right");
                return;
            case "Tab":
                event.preventDefault();
                onNavigate?.(event.shiftKey ? "previous" : "next");
                return;
        }

        // Type-to-edit: any printable character starts editing with that key
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault();
            draft = event.key;
            isEditing = true;
            queueMicrotask(() => inputRef?.focus());
        }
    };

    const handleInputKeydown = (event: KeyboardEvent) => {
        switch (event.key) {
            case "Enter":
                // stopPropagation prevents the bubble re-entering edit mode on
                // the parent cell wrapper, which would un-commit our exit.
                event.preventDefault();
                event.stopPropagation();
                commit();
                onNavigate?.("down");
                return;
            case "Escape":
                event.preventDefault();
                event.stopPropagation();
                revert();
                return;
            case "Tab":
                event.preventDefault();
                event.stopPropagation();
                commit();
                onNavigate?.(event.shiftKey ? "previous" : "next");
                return;
        }
    };
</script>

<div
    bind:this={cellRef}
    role="button"
    tabindex={isEditing ? -1 : 0}
    data-cell="{rowIndex}:{column}"
    data-row={rowIndex}
    data-column={column}
    aria-label="{column}, row {rowIndex + 1}, {value || 'empty'}"
    aria-describedby={warning ? `cell-warn-${rowIndex}-${column}` : undefined}
    onkeydown={handleCellKeydown}
    onclick={() => !isEditing && enterEditMode()}
    class={cn(
        "ring-offset-background group relative min-h-[44px] min-w-[10rem] cursor-text px-3 text-base focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-white/50 sm:min-h-10",
        "flex items-center transition-colors",
        isSelected && "bg-surface-raised/40",
        warning && "ring-1 ring-amber-500/60 ring-inset",
        isOverride &&
            "before:bg-courier-accent/80 before:absolute before:top-1 before:bottom-1 before:left-0 before:w-[2px] before:rounded-r"
    )}
>
    {#if isEditing}
        <input
            bind:this={inputRef}
            bind:value={draft}
            {inputmode}
            type="text"
            autocomplete="off"
            spellcheck="false"
            onblur={commit}
            onkeydown={handleInputKeydown}
            class="block h-full w-full border-0 bg-transparent p-0 text-base text-white outline-none focus:ring-0"
            aria-label="Editing {column}, row {rowIndex + 1}"
        />
    {:else}
        <span class={cn("block w-full truncate", value ? "text-white/90" : "text-zinc-500 italic")}>
            {value || "—"}
        </span>
        {#if warning}
            <span
                id="cell-warn-{rowIndex}-{column}"
                class="pointer-events-none absolute top-0.5 right-1 text-xs leading-none text-amber-400"
                aria-hidden="true">⚠</span
            >
        {/if}
    {/if}
</div>
