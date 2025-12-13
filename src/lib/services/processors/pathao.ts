/**
 * Pathao courier processor implementation
 * Handles the specific logic for processing orders for Pathao courier service
 */

import type { CourierProcessor, PathaoOrder, UserInfo } from "$lib/types";

/**
 * Pathao processor class
 * Implements the CourierProcessor interface for Pathao-specific order processing
 */
export class PathaoProcessor implements CourierProcessor<PathaoOrder> {
    // User info not needed for Pathao as it uses data directly from CSV
    processOrders(data: string[][], _user: UserInfo): PathaoOrder[] {
        return data.map((row) => ({
            // Order/Invoice number from CSV (already starts with #)
            "Order No": row[0] || "",
            // Customer name for delivery
            Name: row[1] || "",
            // Product description for the order
            Product: row[2] || "",
            // Product price/COD amount
            Price: row[3] || "",
            // Full delivery address
            Address: row[4] || "",
            // City for delivery area classification
            City: row[5] || "",
            // Customer contact number
            "Phone No": row[6] || ""
        }));
    }
}
