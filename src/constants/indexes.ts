/**
 * Column indexes for CSV data extraction
 * These constants define which columns to extract from CSV files for each courier service
 */

/**
 * Column indexes for Shopify export format
 * Based on the standard Shopify order export CSV structure
 */
export const SHOPIFY_EXPORT_INDEXES = {
    ORDER_NAME: 0, // Order number (e.g., #13826)
    EMAIL: 1, // Customer email
    TOTAL: 11, // Total amount including shipping
    SHIPPING_NAME: 34, // Customer name for delivery
    SHIPPING_ADDRESS: 36, // Customer address for delivery
    SHIPPING_PHONE: 43, // Customer phone for delivery
    NOTES: 44 // Customer notes/instructions
} as const;

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
 * Column indexes for Pathao CSV data extraction
 */
export const PATHAO_INDEXES = {
    NAME: 3,
    PHONE: 4,
    ADDRESS: 5,
    AREA: 6,
    AMOUNT: 9,
    INSTRUCTIONS: 10,
    PRODUCT: 11
} as const;

/**
 * Array-based indexes for data extraction
 *
 * SHOPIFY_STEADFAST_INDEXES_ARRAY maps to Shopify export columns for SteadFast:
 * [34, 36, 43, 11, 44] = [name, address, phone, amount, notes]
 *
 * STEADFAST_INDEXES_ARRAY maps to CSV columns:
 * [34, 36, 39, 43, 11, 44] = [invoice, name, phone, address, amount, instructions]
 *
 * PATHAO_INDEXES_ARRAY maps to CSV columns:
 * [0, 34, 17, 36, 39, 11, 43] = [order_no, name, product, price, address, city, phone]
 */
export const SHOPIFY_STEADFAST_INDEXES_ARRAY = [34, 36, 43, 11, 44];
export const STEADFAST_INDEXES_ARRAY = [34, 36, 39, 43, 11, 44];
export const PATHAO_INDEXES_ARRAY = [0, 34, 17, 36, 39, 11, 43];

/**
 * Type definitions for the indexes to ensure type safety
 */
export type SteadFastIndexes = typeof STEADFAST_INDEXES;
export type PathaoIndexes = typeof PATHAO_INDEXES;
