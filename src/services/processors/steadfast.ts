/**
 * SteadFast courier processor implementation
 * Handles the specific logic for processing orders for SteadFast courier service
 */

import type { CourierProcessor, SteadFastOrder, UserInfo } from "@/types";

/**
 * Utility function to remove leading zeros from phone numbers
 * @param phoneNumber - The phone number string to process
 * @returns Phone number with leading zeros removed
 */
function removeLeadingZeros(phoneNumber: string): string {
    if (!phoneNumber) return "";
    return phoneNumber.replace(/^0+/, "");
}

/**
 * SteadFast processor class
 * Implements the CourierProcessor interface for SteadFast-specific order processing
 */
export class SteadFastProcessor implements CourierProcessor<SteadFastOrder> {
    processOrders(data: string[][], user: UserInfo): SteadFastOrder[] {
        return data.map(row => ({
            // Always use brand's merchant ID as invoice
            Invoice: user.merchant_id,
            // Customer name from input file
            Name: row[0] || "",
            // Full customer address from input file
            Address: row[1] || "",
            // Customer phone from input file (with leading zeros removed)
            Phone: removeLeadingZeros(row[2] || ""),
            // Total checkout amount including delivery charge
            Amount: row[3] || "",
            // Customer note from input file
            Note: row[4] || "",
            // Lot is always empty
            Lot: "",
            // Delivery Type is always "Home"
            "Delivery Type": "Home",
            // Brand name as contact name
            "Contact Name": user.name,
            // Brand phone as contact phone
            "Contact Phone": user.phone || ""
        }));
    }
}