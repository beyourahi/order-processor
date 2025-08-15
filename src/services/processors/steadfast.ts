/**
 * SteadFast courier processor implementation
 * Handles the specific logic for processing orders for SteadFast courier service
 */

import type { CourierProcessor, SteadFastOrder, UserInfo } from "@/types";

/**
 * Utility function to normalize Bangladesh phone numbers for SteadFast
 * Removes +880 country code and leading zeros, ensures number starts with 1
 * @param phoneNumber - The phone number string to process
 * @returns Normalized phone number starting with 1
 */
function normalizePhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return "";
    
    // Remove spaces and any non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, "");
    
    // Remove +880 country code
    if (cleaned.startsWith("+880")) {
        cleaned = cleaned.substring(4);
    }
    
    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, "");
    
    // Return the cleaned number (should start with 1 for Bangladesh mobile)
    return cleaned;
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
            // Customer phone from input file (normalized to start with 1)
            Phone: normalizePhoneNumber(row[2] || ""),
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