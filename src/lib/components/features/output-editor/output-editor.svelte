<script lang="ts">
    import { untrack, tick } from "svelte";
    import { SvelteSet, SvelteMap } from "svelte/reactivity";
    import type { SteadFastOrder } from "$lib/types";
    import { buildWorkbook, writeWorkbook, normalizePhoneNumber, validateRow, type CellWarning } from "$lib/utils";
    import BatchDefaultsStrip from "./batch-defaults-strip.svelte";
    import EditorGrid from "./editor-grid.svelte";
    import ActionBar from "./action-bar.svelte";
    import { BATCH_CONSTANT_COLUMNS, type BatchDefaults, type CellColumn } from "./columns";
    import { copilotBridge } from "$lib/stores/copilot-bridge.svelte";
    import type { CellEdit, EditorController, EditorSnapshot } from "$lib/ai/types";

    interface Props {
        initialRows: SteadFastOrder[];
        initialDefaults: BatchDefaults;
        fileName: string;
        onDiscard: () => void;
    }

    let { initialRows, initialDefaults, fileName, onDiscard }: Props = $props();

    // ---- state ----
    // Editor state is seeded from props once. Subsequent prop changes are
    // ignored — a re-mount (new CSV drop) re-creates the component instance.
    // Note: spread-clone each row instead of structuredClone() — initialRows
    // may be a Svelte $state proxy from the parent, which structuredClone
    // refuses to walk.
    let rows = $state<SteadFastOrder[]>(untrack(() => initialRows.map((row) => ({ ...row }))));
    // Stable per-row identity, kept in lockstep with `rows`. Keying the grid
    // by id (not array index) lets a row insert/delete animate exactly one
    // row, and preserves a row's component across a cell commit.
    let rowIds = $state<string[]>(untrack(() => initialRows.map(() => crypto.randomUUID())));
    let defaults = $state<BatchDefaults>(untrack(() => ({ ...initialDefaults })));
    let selection = new SvelteSet<number>();
    let showBatchColumns = $state(false);
    let lastSelectAnchor = $state<number | null>(null);
    let showDiscardConfirm = $state(false);
    let gridComponent = $state<EditorGrid | null>(null);

    type UndoEntry = {
        kind: "delete-rows";
        rows: { row: SteadFastOrder; id: string; index: number }[];
        label: string;
    } | null;

    let undoEntry = $state<UndoEntry>(null);
    let undoTimer: ReturnType<typeof setTimeout> | null = null;

    // ---- snapshots for dirty detection (FR-28) ----
    const initialRowsSnapshot = untrack(() => JSON.stringify(initialRows));
    const initialDefaultsSnapshot = untrack(() => JSON.stringify(initialDefaults));

    const dirty = $derived(
        JSON.stringify(rows) !== initialRowsSnapshot || JSON.stringify(defaults) !== initialDefaultsSnapshot
    );

    // ---- derived: warnings ----
    const allWarnings = $derived.by((): CellWarning[] => {
        const list: CellWarning[] = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;
            list.push(...validateRow(row, i));
        }
        return list;
    });

    const warningsByRow = $derived.by(() => {
        const map = new SvelteMap<number, SvelteMap<CellColumn, string>>();
        for (const warning of allWarnings) {
            let inner = map.get(warning.rowIndex);
            if (!inner) {
                inner = new SvelteMap();
                map.set(warning.rowIndex, inner);
            }
            inner.set(warning.column, warning.message);
        }
        return map;
    });

    // Warning count the live region last reflected. Row operations resync it
    // (via announceRowChange) after announcing themselves, so the validation
    // $effect only speaks for commit-driven validation changes — not the
    // warnings that simply appear when a blank row is added.
    let lastWarningCount = -1;

    // ---- derived: override counts (per batch-constant column) ----
    const overrideCountByColumn = $derived.by(() => {
        const counts: Record<keyof BatchDefaults, number> = {
            Invoice: 0,
            "Contact Name": 0,
            "Contact Phone": 0,
            "Delivery Type": 0,
            Lot: 0
        };
        for (const row of rows) {
            for (const column of BATCH_CONSTANT_COLUMNS) {
                const key = column.key as keyof BatchDefaults;
                if (row[key] !== defaults[key]) counts[key]++;
            }
        }
        return counts;
    });

    // ---- undo machinery ----
    const scheduleUndoExpiry = (ms: number) => {
        if (undoTimer) clearTimeout(undoTimer);
        undoTimer = setTimeout(() => {
            undoEntry = null;
            undoTimer = null;
        }, ms);
    };

    const clearUndo = () => {
        if (undoTimer) clearTimeout(undoTimer);
        undoTimer = null;
        undoEntry = null;
    };

    // ---- cell commit ----
    const commitCell = (rowIndex: number, column: CellColumn, value: string) => {
        const row = rows[rowIndex];
        if (!row) return;
        const next = { ...row, [column]: value };
        rows[rowIndex] = next as SteadFastOrder;
    };

    // ---- row management ----
    const addRow = () => {
        const newRow: SteadFastOrder = {
            Invoice: defaults.Invoice,
            Name: "",
            Address: "",
            Phone: "",
            Amount: "",
            Note: "",
            Lot: defaults.Lot,
            "Delivery Type": defaults["Delivery Type"],
            "Contact Name": defaults["Contact Name"],
            "Contact Phone": defaults["Contact Phone"]
        };
        rows.push(newRow);
        rowIds.push(crypto.randomUUID());
        clearUndo();
        gridComponent?.focusNameCell(rows.length - 1);
        announceRowChange(`Added row ${rows.length}`);
    };

    const duplicateRow = (rowIndex: number) => {
        const source = rows[rowIndex];
        if (!source) return;
        rows.splice(rowIndex + 1, 0, { ...source });
        rowIds.splice(rowIndex + 1, 0, crypto.randomUUID());
        // shift selection indexes >= rowIndex+1 by +1 (mutate in place)
        const snapshot = [...selection];
        selection.clear();
        for (const i of snapshot) selection.add(i >= rowIndex + 1 ? i + 1 : i);
        clearUndo();
        gridComponent?.focusNameCell(rowIndex + 1);
        announceRowChange(`Duplicated row ${rowIndex + 1}`);
    };

    const deleteRow = (rowIndex: number) => {
        const removed = rows[rowIndex];
        const removedId = rowIds[rowIndex];
        if (!removed || removedId === undefined) return;
        rows.splice(rowIndex, 1);
        rowIds.splice(rowIndex, 1);
        // recompute selection (shift indexes > rowIndex by -1) — mutate in place
        const snapshot = [...selection];
        selection.clear();
        for (const i of snapshot) {
            if (i === rowIndex) continue;
            selection.add(i > rowIndex ? i - 1 : i);
        }
        undoEntry = {
            kind: "delete-rows",
            rows: [{ row: removed, id: removedId, index: rowIndex }],
            label: `delete row ${rowIndex + 1}`
        };
        scheduleUndoExpiry(5000);
        announceRowChange(`Deleted row ${rowIndex + 1}`);
    };

    const bulkDelete = () => {
        if (selection.size === 0) return;
        const sortedIndexes = [...selection].sort((a, b) => a - b);
        const removed: { row: SteadFastOrder; id: string; index: number }[] = [];
        // delete in reverse to keep indexes stable
        for (let i = sortedIndexes.length - 1; i >= 0; i--) {
            const idx = sortedIndexes[i];
            if (idx === undefined) continue;
            const row = rows[idx];
            const id = rowIds[idx];
            if (!row || id === undefined) continue;
            removed.unshift({ row, id, index: idx });
            rows.splice(idx, 1);
            rowIds.splice(idx, 1);
        }
        const count = removed.length;
        selection.clear();
        undoEntry = {
            kind: "delete-rows",
            rows: removed,
            label: `delete ${count} row${count === 1 ? "" : "s"}`
        };
        scheduleUndoExpiry(count > 1 ? 10000 : 5000);
        announceRowChange(`Deleted ${count} row${count === 1 ? "" : "s"}`);
    };

    const undo = () => {
        if (!undoEntry) return;
        if (undoEntry.kind === "delete-rows") {
            // re-insert in ascending index order so positions match
            const sorted = [...undoEntry.rows].sort((a, b) => a.index - b.index);
            for (const item of sorted) {
                rows.splice(item.index, 0, item.row);
                rowIds.splice(item.index, 0, item.id);
            }
            announceRowChange(`Restored ${sorted.length} row${sorted.length === 1 ? "" : "s"}`);
        }
        clearUndo();
    };

    // ---- selection (mutate selection in place — SvelteSet is reactive) ----
    const toggleSelect = (rowIndex: number, event: MouseEvent) => {
        const isShift = event.shiftKey;

        if (isShift && lastSelectAnchor !== null) {
            const start = Math.min(lastSelectAnchor, rowIndex);
            const end = Math.max(lastSelectAnchor, rowIndex);
            for (let i = start; i <= end; i++) selection.add(i);
        } else {
            if (selection.has(rowIndex)) selection.delete(rowIndex);
            else selection.add(rowIndex);
            lastSelectAnchor = rowIndex;
        }
    };

    // ---- batch defaults strip ----
    const updateDefault = (field: keyof BatchDefaults, value: string) => {
        const previous = defaults[field];
        defaults = { ...defaults, [field]: value };
        // propagate to every row whose value still matches the previous default
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;
            if (row[field] === previous) {
                rows[i] = { ...row, [field]: value };
            }
        }
    };

    const resetOverrides = (field: keyof BatchDefaults) => {
        const target = defaults[field];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;
            if (row[field] !== target) {
                rows[i] = { ...row, [field]: target };
            }
        }
    };

    // ---- AI Copilot bridge ----
    // The editor publishes this controller so the Copilot's tool layer can read
    // and mutate the grid. These methods deliberately do NOT touch the native
    // `undoEntry` — the Copilot owns a separate snapshot-based undo stack.
    const aiGetRows = (): SteadFastOrder[] => rows.map((row) => ({ ...row }));
    const aiGetDefaults = (): BatchDefaults => ({ ...defaults });
    const aiGetWarnings = (): CellWarning[] => [...allWarnings];
    const aiGetFileName = (): string => fileName;

    const aiSnapshot = (): EditorSnapshot => ({
        rows: rows.map((row) => ({ ...row })),
        rowIds: [...rowIds],
        defaults: { ...defaults }
    });

    const aiRestore = (snap: EditorSnapshot) => {
        rows = snap.rows.map((row) => ({ ...row }));
        rowIds = [...snap.rowIds];
        defaults = { ...snap.defaults };
        selection.clear();
        clearUndo();
    };

    const aiApplyCellEdits = (edits: CellEdit[]) => {
        for (const edit of edits) {
            const row = rows[edit.rowIndex];
            if (!row) continue;
            rows[edit.rowIndex] = { ...row, [edit.column]: edit.value } as SteadFastOrder;
        }
    };

    const aiAddRows = (drafts: Partial<SteadFastOrder>[]) => {
        for (const draft of drafts) {
            rows.push({
                Invoice: draft.Invoice ?? defaults.Invoice,
                Name: draft.Name ?? "",
                Address: draft.Address ?? "",
                Phone: draft.Phone ?? "",
                Amount: draft.Amount ?? "",
                Note: draft.Note ?? "",
                Lot: draft.Lot ?? defaults.Lot,
                "Delivery Type": draft["Delivery Type"] ?? defaults["Delivery Type"],
                "Contact Name": draft["Contact Name"] ?? defaults["Contact Name"],
                "Contact Phone": draft["Contact Phone"] ?? defaults["Contact Phone"]
            });
            rowIds.push(crypto.randomUUID());
        }
    };

    const aiDeleteRows = (indexes: number[]) => {
        const ordered = [...new Set(indexes)].sort((a, b) => b - a);
        for (const idx of ordered) {
            if (idx >= 0 && idx < rows.length) {
                rows.splice(idx, 1);
                rowIds.splice(idx, 1);
            }
        }
        selection.clear();
    };

    const aiSetDefaults = (patch: Partial<BatchDefaults>) => {
        for (const [key, value] of Object.entries(patch)) {
            if (value === undefined) continue;
            updateDefault(key as keyof BatchDefaults, value);
        }
    };

    $effect(() => {
        const controller: EditorController = {
            getRows: aiGetRows,
            getDefaults: aiGetDefaults,
            getWarnings: aiGetWarnings,
            getFileName: aiGetFileName,
            snapshot: aiSnapshot,
            restore: aiRestore,
            applyCellEdits: aiApplyCellEdits,
            addRows: aiAddRows,
            deleteRows: aiDeleteRows,
            setDefaults: aiSetDefaults
        };
        copilotBridge.registerEditor(controller);
        return () => copilotBridge.unregisterEditor(controller);
    });

    // ---- jump-to-first-warning ----
    const jumpToFirstWarning = () => {
        const first = allWarnings[0];
        if (!first) return;
        gridComponent?.focusNameCell(first.rowIndex);
        // focus the exact warning cell instead of Name
        queueMicrotask(() => {
            const selector = `[data-cell="${first.rowIndex}:${CSS.escape(first.column)}"]`;
            const el = document.querySelector<HTMLElement>(selector);
            el?.focus();
            el?.scrollIntoView({ block: "center", behavior: "smooth" });
        });
    };

    // ---- discard ----
    const requestDiscard = () => {
        if (!dirty) {
            onDiscard();
            return;
        }
        showDiscardConfirm = true;
    };

    const confirmDiscard = () => {
        showDiscardConfirm = false;
        onDiscard();
    };

    const cancelDiscard = () => {
        showDiscardConfirm = false;
    };

    // ---- download ----
    const download = () => {
        // single idempotent phone-normalization pass (NFR-14)
        const normalized = rows.map((row) => ({
            ...row,
            Phone: normalizePhoneNumber(row.Phone ?? "")
        }));
        const workbook = buildWorkbook(normalized, "Sheet1");
        writeWorkbook(workbook, fileName);
        liveAnnounce(`Downloaded ${normalized.length} row${normalized.length === 1 ? "" : "s"}`);
    };

    // ---- focus-on-mount action for modal Cancel button ----
    const focusOnMount = (node: HTMLElement) => {
        // schedule after current microtask so the modal is fully laid out
        tick().then(() => node.focus());
    };

    // ---- a11y live region ----
    let liveMessage = $state("");
    let liveTimer: ReturnType<typeof setTimeout> | null = null;
    const liveAnnounce = (msg: string) => {
        liveMessage = msg;
        if (liveTimer) clearTimeout(liveTimer);
        liveTimer = setTimeout(() => {
            liveMessage = "";
            liveTimer = null;
        }, 2000);
    };

    // Announce a row-level change and resync the warning baseline, so the
    // validation $effect below does not also speak for the same change.
    const announceRowChange = (msg: string) => {
        liveAnnounce(msg);
        lastWarningCount = allWarnings.length;
    };

    // ---- a11y: announce validation-state changes (NFR-8) ----
    // Row add/delete announce themselves (announceRowChange); this covers the
    // other half — a cell commit that fixes or introduces a problem. The -1
    // sentinel on lastWarningCount primes the first run so the editor's
    // starting warning count is not announced. Announcing to a live region is
    // a genuine side effect, hence $effect rather than $derived.
    $effect(() => {
        const count = allWarnings.length;
        if (lastWarningCount === -1) {
            lastWarningCount = count;
        } else if (count !== lastWarningCount) {
            lastWarningCount = count;
            liveAnnounce(count === 0 ? "All warnings resolved" : `${count} warning${count === 1 ? "" : "s"}`);
        }
    });

    // ---- Cmd/Ctrl+Z global ----
    const handleKeydown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
            // do not steal undo when an input has focus and the browser would naturally undo text
            const target = event.target as HTMLElement | null;
            if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
            if (undoEntry) {
                event.preventDefault();
                undo();
            }
        }
    };
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex w-full flex-col gap-4" aria-label="Order output editor">
    <BatchDefaultsStrip {defaults} {overrideCountByColumn} onUpdate={updateDefault} onResetOverrides={resetOverrides} />

    <EditorGrid
        bind:this={gridComponent}
        {rows}
        {rowIds}
        batchDefaults={defaults}
        {showBatchColumns}
        {selection}
        {warningsByRow}
        onCellCommit={commitCell}
        onToggleSelect={toggleSelect}
        onDeleteRow={deleteRow}
        onDuplicateRow={duplicateRow}
        onAddRow={addRow}
    />

    <ActionBar
        rowCount={rows.length}
        warningCount={allWarnings.length}
        selectionCount={selection.size}
        {showBatchColumns}
        undoAvailable={undoEntry !== null}
        undoLabel={undoEntry?.label ?? ""}
        canDownload={rows.length > 0}
        onToggleBatchColumns={() => (showBatchColumns = !showBatchColumns)}
        onJumpToFirstWarning={jumpToFirstWarning}
        onBulkDelete={bulkDelete}
        onUndo={undo}
        onDiscard={requestDiscard}
        onDownload={download}
    />
</div>

<div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{liveMessage}</div>

{#if showDiscardConfirm}
    <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discard-title"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
        <div
            class="border-border-strong/60 bg-surface-raised w-[min(420px,calc(100vw-2rem))] rounded-2xl border p-6 shadow-2xl"
        >
            <h2 id="discard-title" class="text-base font-medium text-balance text-white">Discard your edits?</h2>
            <p class="mt-2 text-sm text-pretty text-zinc-400">
                This can't be undone. Your edits will be lost and you'll return to the upload zone.
            </p>
            <div class="mt-6 flex items-center justify-end gap-2">
                <button
                    type="button"
                    onclick={cancelDiscard}
                    use:focusOnMount
                    class="border-border-strong/40 pointer-fine:hover:bg-surface inline-flex h-9 cursor-pointer items-center rounded-md border px-4 text-sm text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onclick={confirmDiscard}
                    class="bg-destructive text-destructive-foreground pointer-fine:hover:bg-destructive/90 inline-flex h-9 cursor-pointer items-center rounded-md px-4 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                    Discard
                </button>
            </div>
        </div>
    </div>
{/if}
