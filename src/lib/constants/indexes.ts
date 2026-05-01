/**
 * Column indexes for CSV data extraction
 * These constants define which columns to extract from CSV files for each courier service
 */

/**
 * Column indexes for SteadFast CSV data extraction
 */
export const STEADFAST_INDEXES = {
    INVOICE: 0,
    NAME: 3,
    PHONE: 4,
    ADDRESS: 5,
    AMOUNT: 9,
    INSTRUCTIONS: 10
} as const;

/**
 * Array-based indexes for data extraction
 *
 * SHOPIFY_STEADFAST_INDEXES_ARRAY maps to Shopify export columns for SteadFast:
 * [34, 36, 43, 11, 44] = [ShippingName(34), ShippingAddress1(36), Phone(43), TotalPrice(11), Notes(44)]
 * Note: the full delivery address is assembled at processing time from columns 36+37+39
 *
 * STEADFAST_INDEXES_ARRAY maps to CSV columns (Shopify-shaped layout, with city as a discrete field):
 * [34, 36, 39, 43, 11, 44] = [ShippingName(34), ShippingAddress1(36), ShippingCity(39), Phone(43), TotalPrice(11), Notes(44)]
 */
export const SHOPIFY_STEADFAST_INDEXES_ARRAY = [34, 36, 43, 11, 44] as const;
export const STEADFAST_INDEXES_ARRAY = [34, 36, 39, 43, 11, 44] as const;

/**
 * Type definitions for the indexes to ensure type safety
 */
export type SteadFastIndexes = typeof STEADFAST_INDEXES;
