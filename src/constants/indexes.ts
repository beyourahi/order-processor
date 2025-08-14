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
 * Legacy array-based indexes for backward compatibility
 * These will be deprecated in favor of the object-based approach above
 * 
 * STEADFAST_INDEXES_ARRAY maps to CSV columns:
 * [34, 36, 39, 43, 11, 44] = [invoice, name, phone, address, amount, instructions]
 * 
 * PATHAO_INDEXES_ARRAY maps to CSV columns:
 * [0, 34, 17, 36, 39, 11, 43] = [order_no, name, product, price, address, city, phone]
 */
export const STEADFAST_INDEXES_ARRAY = [34, 36, 39, 43, 11, 44];
export const PATHAO_INDEXES_ARRAY = [0, 34, 17, 36, 39, 11, 43];

/**
 * Type definitions for the indexes to ensure type safety
 */
export type SteadFastIndexes = typeof STEADFAST_INDEXES;
export type PathaoIndexes = typeof PATHAO_INDEXES;