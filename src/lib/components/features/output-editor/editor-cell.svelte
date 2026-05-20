<script lang="ts">
    import { cn } from "$lib/utils";
    import type { CellColumn, ColumnInputMode } from "./columns";

    export type CellNavigationDirection = "up" | "down" | "left" | "right" | "next" | "previous";

    interface Props {
        value: string;
        column: CellColumn;
        inputmode: ColumnInputMode;
        multiline: boolean;
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
        multiline,
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
    let inputRef = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);

    /**
     * Resolve the caret character offset under a click point so editing
     * begins where the user pointed (FR-4). Read while the display span is
     * still mounted, before it swaps to an input. Returns null when the
     * browser exposes neither caret API.
     */
    const caretOffsetFromPoint = (x: number, y: number): number | null => {
        type CaretDoc = Document & {
            caretPositionFromPoint?: (x: number, y: number) => { offset: number } | null;
            caretRangeFromPoint?: (x: number, y: number) => Range | null;
        };
        const doc = document as CaretDoc;
        if (typeof doc.caretPositionFromPoint === "function") {
            return doc.caretPositionFromPoint(x, y)?.offset ?? null;
        }
        if (typeof doc.caretRangeFromPoint === "function") {
            return doc.caretRangeFromPoint(x, y)?.startOffset ?? null;
        }
        return null;
    };

    /** Grow a textarea to fit its content (FR-8 expand-on-focus). */
    const autoGrow = (el: HTMLTextAreaElement) => {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    };

    /** Focus the freshly mounted editor and place the caret. */
    const focusEditor = (caret: number | "end") => {
        queueMicrotask(() => {
            const el = inputRef;
            if (!el) return;
            el.focus();
            const end = el.value.length;
            const pos = caret === "end" ? end : Math.min(Math.max(caret, 0), end);
            el.setSelectionRange(pos, pos);
            if (multiline) autoGrow(el as HTMLTextAreaElement);
        });
    };

    /**
     * Enter edit mode and place the caret. Text columns honour the click
     * offset; tel/decimal columns always start at the end (FR-4).
     */
    const enterEditMode = (caret: number | "end") => {
        draft = value;
        isEditing = true;
        focusEditor(caret);
    };

    const handleCellClick = (event: MouseEvent) => {
        if (isEditing) return;
        if (inputmode === "text" && value) {
            enterEditMode(caretOffsetFromPoint(event.clientX, event.clientY) ?? "end");
        } else {
            enterEditMode("end");
        }
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
                enterEditMode("end");
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

        // Type-to-edit: any printable character starts editing with that key.
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault();
            draft = event.key;
            isEditing = true;
            focusEditor("end");
        }
    };

    const handleInputKeydown = (event: KeyboardEvent) => {
        switch (event.key) {
            case "Enter":
                // Enter commits even in a textarea — SteadFast cells hold a
                // single logical value; the textarea only wraps long text,
                // it never stores literal newlines (FR-5).
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

    /**
     * Reject any keystroke or paste that would put a non-digit — or a second
     * decimal point — into an Amount cell (FR-8). Cancelling at `beforeinput`
     * never mutates the value after the fact, so the caret never jumps.
     */
    const handleBeforeInput = (event: InputEvent) => {
        if (inputmode !== "decimal") return;
        const data = event.data;
        if (!data) return; // deletions / composition end — always allowed
        if (!/^[0-9.]*$/.test(data)) {
            event.preventDefault();
            return;
        }
        if (data.includes(".")) {
            const el = event.currentTarget as HTMLInputElement;
            const start = el.selectionStart ?? el.value.length;
            const end = el.selectionEnd ?? el.value.length;
            const resulting = el.value.slice(0, start) + data + el.value.slice(end);
            if ((resulting.match(/\./g)?.length ?? 0) > 1) {
                event.preventDefault();
            }
        }
    };

    const handleTextareaInput = (event: Event) => {
        autoGrow(event.currentTarget as HTMLTextAreaElement);
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
    onclick={handleCellClick}
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
        {#if multiline}
            <textarea
                bind:this={inputRef}
                bind:value={draft}
                {inputmode}
                rows="1"
                autocomplete="off"
                spellcheck="false"
                onblur={commit}
                onkeydown={handleInputKeydown}
                oninput={handleTextareaInput}
                class="block max-h-[40vh] w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-base leading-snug text-white outline-none focus:ring-0"
                aria-label="Editing {column}, row {rowIndex + 1}"
            ></textarea>
        {:else}
            <input
                bind:this={inputRef}
                bind:value={draft}
                {inputmode}
                type="text"
                autocomplete="off"
                spellcheck="false"
                onblur={commit}
                onbeforeinput={handleBeforeInput}
                onkeydown={handleInputKeydown}
                class="block h-full w-full border-0 bg-transparent p-0 text-base text-white outline-none focus:ring-0"
                aria-label="Editing {column}, row {rowIndex + 1}"
            />
        {/if}
    {:else}
        <span class={cn("block w-full truncate", value ? "text-white/90" : "text-zinc-400 italic")}>
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
