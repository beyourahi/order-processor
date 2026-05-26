import type { CourierProcessor, SteadFastOrder, UserInfo } from "$lib/types";
import { normalizePhoneNumber } from "$lib/utils";

/**
 * Maps prepared rows → SteadFast schema. Input row layout (positional, set by
 * data-processing.ts): [Name, Address, Phone, Amount, Note].
 * Phone is BD-normalized here AND again at download time (idempotent — NFR-14).
 * Lot is blank; Delivery Type is always "Home" (no UI to vary either yet).
 */
export class SteadFastProcessor implements CourierProcessor<SteadFastOrder> {
    processOrders(data: string[][], user: UserInfo): SteadFastOrder[] {
        return data.map((row) => ({
            Invoice: user.merchantId,
            Name: row[0] || "",
            Address: row[1] || "",
            Phone: normalizePhoneNumber(row[2] || ""),
            Amount: row[3] || "",
            Note: row[4] || "",
            Lot: "",
            "Delivery Type": "Home",
            "Contact Name": user.name,
            "Contact Phone": user.phone || ""
        }));
    }
}
