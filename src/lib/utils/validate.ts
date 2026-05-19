import type { SteadFastOrder } from "$lib/types";
import type { CellColumn } from "$lib/components/features/output-editor/columns";
import { normalizePhoneNumber } from "./phone";

export type WarningCode = "empty" | "phone_format" | "amount_format";

export interface CellWarning {
    rowIndex: number;
    column: CellColumn;
    code: WarningCode;
    message: string;
}

/**
 * BD mobile number is valid when, after stripping country code and leading
 * zeros, the result is exactly 10 digits starting with 1. Empty handled
 * separately by the `empty` warning.
 */
export const validatePhone = (value: string): boolean => {
    const normalized = normalizePhoneNumber(value);
    return /^1\d{9}$/.test(normalized);
};

/**
 * Amount is valid when it parses as a positive decimal. Empty handled
 * separately by the `empty` warning.
 */
export const validateAmount = (value: string): boolean => {
    if (!value) return false;
    return /^\d+(\.\d+)?$/.test(value.trim());
};

const REQUIRED_COLUMNS: readonly CellColumn[] = ["Name", "Address", "Phone", "Amount"];

export const validateRow = (row: SteadFastOrder, rowIndex: number): CellWarning[] => {
    const warnings: CellWarning[] = [];

    for (const column of REQUIRED_COLUMNS) {
        const value = (row[column as keyof SteadFastOrder] ?? "").toString().trim();
        if (!value) {
            warnings.push({
                rowIndex,
                column,
                code: "empty",
                message: `${column} is empty`
            });
        }
    }

    const phone = (row.Phone ?? "").toString().trim();
    if (phone && !validatePhone(phone)) {
        warnings.push({
            rowIndex,
            column: "Phone",
            code: "phone_format",
            message: "Phone is not a valid Bangladesh mobile number"
        });
    }

    const amount = (row.Amount ?? "").toString().trim();
    if (amount && !validateAmount(amount)) {
        warnings.push({
            rowIndex,
            column: "Amount",
            code: "amount_format",
            message: "Amount is not a valid number"
        });
    }

    return warnings;
};
