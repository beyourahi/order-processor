import type { CourierProcessor, SteadFastOrder, UserInfo } from "$lib/types";
import { normalizePhoneNumber } from "$lib/utils";

export class SteadFastProcessor implements CourierProcessor<SteadFastOrder> {
    processOrders(data: string[][], user: UserInfo): SteadFastOrder[] {
        return data.map((row) => ({
            // Always use brand's merchant ID as invoice
            Invoice: user.merchantId,
            Name: row[0] || "",
            Address: row[1] || "",
            Phone: normalizePhoneNumber(row[2] || ""),
            // Total checkout amount including delivery charge
            Amount: row[3] || "",
            Note: row[4] || "",
            // Lot is always empty
            Lot: "",
            // Delivery Type is always "Home"
            "Delivery Type": "Home",
            "Contact Name": user.name,
            "Contact Phone": user.phone || ""
        }));
    }
}
