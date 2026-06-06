/**
 * Tool catalog handed to the model. Each entry's `parameters` is a JSON Schema
 * passed verbatim in the OpenAI-style `tools` payload. Keep descriptions terse
 * and concrete — the model leans on them to pick the right tool and shape args.
 */
import type { ToolCatalogEntry, ToolName } from "./types";

const CELL_COLUMNS = [
    "Name",
    "Address",
    "Phone",
    "Amount",
    "Note",
    "Invoice",
    "Contact Name",
    "Contact Phone",
    "Delivery Type",
    "Lot"
];

const ROW_DRAFT_PROPERTIES = {
    Name: { type: "string" },
    Address: { type: "string" },
    Phone: { type: "string" },
    Amount: { type: "string" },
    Note: { type: "string" },
    Invoice: { type: "string" },
    "Contact Name": { type: "string" },
    "Contact Phone": { type: "string" },
    "Delivery Type": { type: "string" },
    Lot: { type: "string" }
};

export const TOOLS_CATALOG: ToolCatalogEntry[] = [
    {
        name: "getBatchSummary",
        description:
            "Read-only. Return counts and totals for the loaded batch — row count, total Amount, rows with validation warnings, and the current batch defaults. Use for 'how many orders', 'what's the total', pre-download checks.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "getRows",
        description:
            "Read-only. Return full row data so you can reason about specific orders. Pass `indexes` to fetch specific rows, or `query` to filter by a substring match on Name/Address/Phone/Note. With no args, returns all rows (capped).",
        parameters: {
            type: "object",
            properties: {
                indexes: { type: "array", items: { type: "number" } },
                query: { type: "string", description: "Case-insensitive substring filter." }
            }
        }
    },
    {
        name: "flagAnomalies",
        description:
            "Read-only. Scan the batch for delivery-risk rows: Amount outliers vs the batch median, suspiciously short addresses, notes containing cancellation/return language, and phone numbers that are not deliverable Bangladesh mobiles. Returns a list of flagged rows with reasons.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "editCells",
        description:
            "Edit one or more grid cells. Each edit targets a row by 0-based index and a column. Use for natural-language single edits, address cleanup, transliteration, note drafting, and amount fixes. Editing more than one row asks the user to confirm first.",
        parameters: {
            type: "object",
            properties: {
                edits: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            rowIndex: { type: "number" },
                            column: { type: "string", enum: CELL_COLUMNS },
                            value: { type: "string" }
                        },
                        required: ["rowIndex", "column", "value"]
                    },
                    minItems: 1
                }
            },
            required: ["edits"]
        }
    },
    {
        name: "setBatchDefaults",
        description:
            "Set batch-wide default values that apply to every row (Invoice/merchant ref, Contact Name, Contact Phone, Delivery Type, Lot). Use for 'whole batch is COD to lot 7' style requests. Changing a default rewrites every row that still holds the old default; multi-row rewrites ask the user to confirm.",
        parameters: {
            type: "object",
            properties: {
                patch: {
                    type: "object",
                    properties: {
                        Invoice: { type: "string" },
                        "Contact Name": { type: "string" },
                        "Contact Phone": { type: "string" },
                        "Delivery Type": { type: "string" },
                        Lot: { type: "string" }
                    }
                }
            },
            required: ["patch"]
        }
    },
    {
        name: "addRows",
        description:
            "Append new order rows. Use for parsing a pasted free-text order (a WhatsApp/Messenger message) or splitting one multi-item order into separate courier rows. Provide Name/Address/Phone/Amount/Note; omitted batch fields inherit the batch defaults. Adding more than one row asks the user to confirm.",
        parameters: {
            type: "object",
            properties: {
                rows: {
                    type: "array",
                    items: { type: "object", properties: ROW_DRAFT_PROPERTIES },
                    minItems: 1
                }
            },
            required: ["rows"]
        }
    },
    {
        name: "deleteRows",
        description:
            "Delete rows by 0-based index. Use for removing near-duplicate orders, cancelled orders, or rows that reconciled as already paid. Always asks the user to confirm before deleting.",
        parameters: {
            type: "object",
            properties: {
                indexes: { type: "array", items: { type: "number" }, minItems: 1 }
            },
            required: ["indexes"]
        }
    },
    {
        name: "autoFixWarnings",
        description:
            "Compute corrections for every validation warning in the batch (empty required fields, malformed phone numbers, non-numeric amounts) and present them to the user as a confirmation panel before applying. Optionally restrict to specific warning codes.",
        parameters: {
            type: "object",
            properties: {
                codes: {
                    type: "array",
                    items: { type: "string", enum: ["empty", "phone_format", "amount_format"] }
                }
            }
        }
    },
    {
        name: "updateBrandSettings",
        description:
            "Update the user's saved brand settings — Contact Name, Contact Phone, and SteadFast Merchant ID. Call this WHENEVER the user asks to set or change any of these directly (e.g. 'set my merchant ID to 123456', 'my contact phone is 01700000000', 'change the contact name to Acme') as well as when onboarding settings from a pasted SteadFast email. Persisted to the account.",
        parameters: {
            type: "object",
            properties: {
                patch: {
                    type: "object",
                    properties: {
                        contactName: { type: "string" },
                        contactPhone: { type: "string" },
                        merchantId: { type: "string" }
                    }
                }
            },
            required: ["patch"]
        }
    },
    {
        name: "proposeCsvColumnMapping",
        description:
            "When an uploaded CSV was not auto-recognized, the raw headers and sample rows appear in CURRENT STATE. Inspect them and emit a column mapping: 0-based indexes for Name, Address (one or more columns joined together), Phone, Amount, and Note (or null), plus skipFirst/skipLast — how many header/summary rows to trim. The user confirms before it loads.",
        parameters: {
            type: "object",
            properties: {
                nameIndex: { type: "number" },
                addressIndexes: { type: "array", items: { type: "number" } },
                phoneIndex: { type: "number" },
                amountIndex: { type: "number" },
                noteIndex: { type: "number", description: "Column index, or null if none." },
                skipFirst: { type: "number" },
                skipLast: { type: "number" }
            },
            required: ["nameIndex", "addressIndexes", "phoneIndex", "amountIndex", "noteIndex"]
        }
    },
    {
        name: "undoLastChange",
        description:
            "Revert the most recent change you applied to the batch. Use when the user says 'undo that' or 'revert'.",
        parameters: { type: "object", properties: {} }
    }
];

/**
 * Human-readable card titles for tool calls. The raw tool name (e.g. "editCells")
 * is an internal identifier and must never be shown to the user.
 */
export const TOOL_LABELS: Record<ToolName, string> = {
    getBatchSummary: "Batch summary",
    getRows: "Looked up orders",
    flagAnomalies: "Risk scan",
    editCells: "Edit cells",
    setBatchDefaults: "Batch defaults",
    addRows: "Add orders",
    deleteRows: "Delete orders",
    autoFixWarnings: "Auto-fix warnings",
    updateBrandSettings: "Brand settings",
    proposeCsvColumnMapping: "Column mapping",
    undoLastChange: "Undo change"
};
