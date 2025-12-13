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
    FINANCIAL_STATUS: 2,
    PAID_AT: 3,
    FULFILLMENT_STATUS: 4,
    FULFILLED_AT: 5,
    ACCEPTS_MARKETING: 6,
    CURRENCY: 7,
    SUBTOTAL: 8,
    SHIPPING: 9,
    TAXES: 10,
    TOTAL: 11, // Total amount including shipping
    DISCOUNT_CODE: 12,
    DISCOUNT_AMOUNT: 13,
    SHIPPING_METHOD: 14,
    CREATED_AT: 15,
    LINEITEM_QTY: 16,
    LINEITEM_NAME: 17,
    LINEITEM_PRICE: 18,
    LINEITEM_COMPARE_PRICE: 19,
    LINEITEM_SKU: 20,
    LINEITEM_REQUIRES_SHIPPING: 21,
    LINEITEM_TAXABLE: 22,
    LINEITEM_FULFILLMENT_STATUS: 23,
    BILLING_NAME: 24,
    BILLING_STREET: 25,
    BILLING_ADDRESS1: 26,
    BILLING_ADDRESS2: 27,
    BILLING_COMPANY: 28,
    BILLING_CITY: 29,
    BILLING_ZIP: 30,
    BILLING_PROVINCE: 31,
    BILLING_COUNTRY: 32,
    BILLING_PHONE: 33,
    SHIPPING_NAME: 34, // Customer name for delivery
    SHIPPING_STREET: 35,
    SHIPPING_ADDRESS: 36, // Customer address for delivery
    SHIPPING_ADDRESS2: 37,
    SHIPPING_COMPANY: 38,
    SHIPPING_CITY: 39,
    SHIPPING_ZIP: 40,
    SHIPPING_PROVINCE: 41,
    SHIPPING_COUNTRY: 42,
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
export const SHOPIFY_STEADFAST_INDEXES_ARRAY = [34, 36, 43, 11, 44] as const;
export const STEADFAST_INDEXES_ARRAY = [34, 36, 39, 43, 11, 44] as const;
export const PATHAO_INDEXES_ARRAY = [0, 34, 17, 36, 39, 11, 43] as const;

/**
 * Type definitions for the indexes to ensure type safety
 */
export type ShopifyExportIndexes = typeof SHOPIFY_EXPORT_INDEXES;
export type SteadFastIndexes = typeof STEADFAST_INDEXES;
export type PathaoIndexes = typeof PATHAO_INDEXES;
