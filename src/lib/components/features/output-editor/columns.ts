export type CellColumn =
    | "Name"
    | "Address"
    | "Phone"
    | "Amount"
    | "Note"
    | "Invoice"
    | "Contact Name"
    | "Contact Phone"
    | "Delivery Type"
    | "Lot";

export type ColumnKind = "per-row" | "batch-constant";

export type ColumnInputMode = "text" | "tel" | "decimal";

export interface ColumnDescriptor {
    key: CellColumn;
    kind: ColumnKind;
    inputmode: ColumnInputMode;
    required: boolean;
    // FR-8: when true, EditorCell renders a `<textarea>` that auto-grows on
    // focus. Used for Address + Note; all other columns are single-line.
    multiline: boolean;
}

// Canonical render order in editor-grid when batch columns are visible.
// First 5 = per-row, last 5 = batch-constant.
export const STEADFAST_COLUMNS: readonly ColumnDescriptor[] = [
    { key: "Name", kind: "per-row", inputmode: "text", required: true, multiline: false },
    { key: "Address", kind: "per-row", inputmode: "text", required: true, multiline: true },
    { key: "Phone", kind: "per-row", inputmode: "tel", required: true, multiline: false },
    { key: "Amount", kind: "per-row", inputmode: "decimal", required: true, multiline: false },
    { key: "Note", kind: "per-row", inputmode: "text", required: false, multiline: true },
    { key: "Invoice", kind: "batch-constant", inputmode: "text", required: false, multiline: false },
    { key: "Contact Name", kind: "batch-constant", inputmode: "text", required: false, multiline: false },
    { key: "Contact Phone", kind: "batch-constant", inputmode: "tel", required: false, multiline: false },
    { key: "Delivery Type", kind: "batch-constant", inputmode: "text", required: false, multiline: false },
    { key: "Lot", kind: "batch-constant", inputmode: "text", required: false, multiline: false }
] as const;

export const PER_ROW_COLUMNS: readonly ColumnDescriptor[] = STEADFAST_COLUMNS.filter(
    (column) => column.kind === "per-row"
);

export const BATCH_CONSTANT_COLUMNS: readonly ColumnDescriptor[] = STEADFAST_COLUMNS.filter(
    (column) => column.kind === "batch-constant"
);

// Plain object shape (not Map) so $state can wrap it and spread copies are cheap.
// Editor seeds rows from these at mount and on Add-row.
export interface BatchDefaults {
    Invoice: string;
    "Contact Name": string;
    "Contact Phone": string;
    "Delivery Type": string;
    Lot: string;
}
