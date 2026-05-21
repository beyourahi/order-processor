/**
 * Zod argument schemas — one per Copilot tool. The executor validates every
 * model-emitted tool call against these before touching editor state; the chat
 * endpoint uses them to drive a corrective retry when the model emits a
 * malformed call.
 */
import { z } from "zod";

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
] as const;

const WARNING_CODES = ["empty", "phone_format", "amount_format"] as const;

const cellColumn = z.enum(CELL_COLUMNS);

/** Row fields the model may set on a freshly added row. */
const rowDraft = z.object({
    Name: z.string().max(200).optional(),
    Address: z.string().max(2000).optional(),
    Phone: z.string().max(60).optional(),
    Amount: z.string().max(40).optional(),
    Note: z.string().max(2000).optional(),
    Invoice: z.string().max(200).optional(),
    "Contact Name": z.string().max(200).optional(),
    "Contact Phone": z.string().max(60).optional(),
    "Delivery Type": z.string().max(60).optional(),
    Lot: z.string().max(60).optional()
});

export const argSchemas = {
    getBatchSummary: z.object({}).default({}),

    getRows: z
        .object({
            indexes: z.array(z.number().int().min(0)).max(500).optional(),
            query: z.string().max(200).optional()
        })
        .default({}),

    flagAnomalies: z.object({}).default({}),

    editCells: z.object({
        edits: z
            .array(
                z.object({
                    rowIndex: z.number().int().min(0),
                    column: cellColumn,
                    value: z.string().max(2000)
                })
            )
            .min(1)
            .max(500)
    }),

    setBatchDefaults: z.object({
        patch: z
            .object({
                Invoice: z.string().max(200).optional(),
                "Contact Name": z.string().max(200).optional(),
                "Contact Phone": z.string().max(60).optional(),
                "Delivery Type": z.string().max(60).optional(),
                Lot: z.string().max(60).optional()
            })
            .refine((v) => Object.keys(v).length > 0, { message: "Empty patch" })
    }),

    addRows: z.object({
        rows: z.array(rowDraft).min(1).max(200)
    }),

    deleteRows: z.object({
        indexes: z.array(z.number().int().min(0)).min(1).max(500)
    }),

    autoFixWarnings: z
        .object({
            codes: z.array(z.enum(WARNING_CODES)).optional()
        })
        .default({}),

    updateBrandSettings: z.object({
        patch: z
            .object({
                contactName: z.string().max(200).optional(),
                contactPhone: z.string().max(60).optional(),
                merchantId: z.string().max(120).optional()
            })
            .refine((v) => Object.keys(v).length > 0, { message: "Empty patch" })
    }),

    proposeCsvColumnMapping: z.object({
        nameIndex: z.number().int().min(0),
        addressIndexes: z.array(z.number().int().min(0)).min(1).max(6),
        phoneIndex: z.number().int().min(0),
        amountIndex: z.number().int().min(0),
        noteIndex: z.number().int().min(0).nullable(),
        skipFirst: z.number().int().min(0).max(20).default(0),
        skipLast: z.number().int().min(0).max(20).default(0)
    }),

    undoLastChange: z.object({}).default({})
} as const;

export type ArgsOf<K extends keyof typeof argSchemas> = z.infer<(typeof argSchemas)[K]>;

export const isKnownToolName = (name: string): name is keyof typeof argSchemas => name in argSchemas;
