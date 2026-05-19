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
}

/**
 * SteadFast column layout: five per-row fields followed by five batch-constant
 * fields. The order here is the canonical render order in the grid when batch
 * columns are toggled visible.
 */
export const STEADFAST_COLUMNS: readonly ColumnDescriptor[] = [
    { key: "Name", kind: "per-row", inputmode: "text", required: true },
    { key: "Address", kind: "per-row", inputmode: "text", required: true },
    { key: "Phone", kind: "per-row", inputmode: "tel", required: true },
    { key: "Amount", kind: "per-row", inputmode: "decimal", required: true },
    { key: "Note", kind: "per-row", inputmode: "text", required: false },
    { key: "Invoice", kind: "batch-constant", inputmode: "text", required: false },
    { key: "Contact Name", kind: "batch-constant", inputmode: "text", required: false },
    { key: "Contact Phone", kind: "batch-constant", inputmode: "tel", required: false },
    { key: "Delivery Type", kind: "batch-constant", inputmode: "text", required: false },
    { key: "Lot", kind: "batch-constant", inputmode: "text", required: false }
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
