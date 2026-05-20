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
    /**
     * When true the cell edits in a `<textarea>` that wraps long text and
     * auto-grows on focus (FR-8). Address and Note carry free-form text that
     * routinely overflows a single line; every other column is single-line.
     */
    multiline: boolean;
}

/**
 * SteadFast column layout: five per-row fields followed by five batch-constant
 * fields. The order here is the canonical render order in the grid when batch
 * columns are toggled visible.
 */
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

/**
 * The five batch-constant fields, typed as a plain object so the defaults
 * strip can $state it and so the editor can spread it onto each row at
 * mount / Add-row time.
 */
export interface BatchDefaults {
    Invoice: string;
    "Contact Name": string;
    "Contact Phone": string;
    "Delivery Type": string;
    Lot: string;
}
