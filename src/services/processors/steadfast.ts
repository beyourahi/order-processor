/**
 * SteadFast courier processor implementation
 * Handles the specific logic for processing orders for SteadFast courier service
 */

import type { CourierProcessor, SteadFastOrder, UserInfo } from "@/types";

/**
 * SteadFast processor class
 * Implements the CourierProcessor interface for SteadFast-specific order processing
 */
export class SteadFastProcessor implements CourierProcessor<SteadFastOrder> {
    processOrders(data: string[][], user: UserInfo): SteadFastOrder[] {
        return data.map(row => ({
            // Generate invoice with merchant ID prefix for SteadFast tracking
            Invoice: `#${user.merchant_id}${row[0] || ""}`,
            // Use merchant/brand name for all orders
            Name: user.name,
            // Customer delivery address from CSV column 2
            Address: row[2] || "",
            // Use merchant phone as pickup contact
            Phone: user.phone,
            // Cash on delivery amount from CSV column 3
            Amount: row[3] || "",
            // Special delivery instructions from CSV column 4
            Note: row[4] || "",
            // Lot is always empty for standard orders
            Lot: "",
            // SteadFast only supports home delivery for this integration
            "Delivery Type": "Home",
            // Customer name from CSV column 0 for delivery contact
            "Contact Name": row[0] || "",
            // Customer phone from CSV column 5 for delivery contact
            "Contact Phone": row[5] || ""
        }));
    }
}