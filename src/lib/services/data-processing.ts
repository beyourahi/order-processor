/**
 * Data processing utilities for order preparation
 * Contains utility functions for cleaning, filtering, and preparing CSV data
 */

import { STEADFAST_INDEXES_ARRAY } from "$lib/constants";

// ================== DATA PROCESSING UTILITIES ==================

/**
 * Optimized function to remove duplicates and extract specific indexes
 * Uses Set for O(1) lookup performance
 */
export const removeDuplicatesAndExtractIndexes = (data: string[][], indexes: readonly number[]): string[][] => {
    const uniqueData: string[][] = [];
    const seenFirstValues = new Set<string>();

    for (const entry of data) {
        // Use first column (usually order ID or invoice) as duplicate detection key
        const firstValue = entry[0];

        // Only process rows with valid first value and avoid duplicates
        // This prevents processing the same order multiple times from CSV uploads
        if (firstValue && !seenFirstValues.has(firstValue)) {
            seenFirstValues.add(firstValue);
            // Extract only the columns we need based on courier requirements
            // Fill missing columns with empty strings to prevent undefined values
            uniqueData.push(indexes.map((index) => entry[index] || ""));
        }
    }

    return uniqueData;
};

/**
 * Extract invoice mapping from raw data
 * More efficient with proper type checking
 */
export const extractInvoices = (rawData: string[][]): Map<string, string> => {
    const invoices = new Map<string, string>();

    // Skip header row and process data
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        // Only process rows that start with "#" (valid invoice format) and have data in column 34
        // Column 34 typically contains customer/recipient information
        // This business rule ensures we only process legitimate order entries
        if (row?.[0]?.startsWith("#") && row[34]) {
            // Map recipient info (column 34) to invoice number (column 0)
            invoices.set(row[34], row[0]);
        }
    }

    return invoices;
};

/**
 * Prepare data for SteadFast courier processing
 * Optimized with better bounds checking
 */
export const prepareSteadFastOrderData = (rawData: string[][]): string[][] => {
    if (rawData.length <= 2) return []; // Need at least header + 1 data row

    const processed = removeDuplicatesAndExtractIndexes(rawData, STEADFAST_INDEXES_ARRAY);
    // Remove first and last entries - these are typically header/footer or test entries
    // that SteadFast doesn't want in the final order processing
    return processed.slice(1, -1);
};

/**
 * Build a complete address string from Shopify CSV address components
 * Combines address1, address2 (if present), and city
 * Filters empty parts and joins with comma separator
 */
const buildFullAddress = (address1: string, address2: string, city: string): string => {
    return [address1, address2, city]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(", ");
};

/**
 * Prepare data for SteadFast courier processing from Shopify export
 * Handles multi-line orders and consolidates customer information
 * Combines address1, address2, and city into a complete address
 */
export const prepareShopifySteadFastOrderData = (rawData: string[][]): string[][] => {
    if (rawData.length <= 1) return []; // Need at least header + data

    const orderMap = new Map<string, string[]>();

    // Process each row and consolidate orders
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row) continue;

        const orderNumber = row[0]; // Order number like #13826

        // Skip rows without order numbers or with empty shipping info
        if (!orderNumber?.startsWith("#") || !row[34]) continue;

        // For Shopify exports, we only need the first occurrence of each order
        // since customer info is the same across all line items
        if (!orderMap.has(orderNumber)) {
            // Build complete address from multiple Shopify address fields
            // Column 36: Shipping Address1 (street)
            // Column 37: Shipping Address2 (apartment/unit, optional)
            // Column 39: Shipping City
            const fullAddress = buildFullAddress(row[36] || "", row[37] || "", row[39] || "");

            // Extract: [name, FULL_ADDRESS, phone, amount, notes]
            const extractedData = [
                row[34] || "", // Shipping Name (col 34)
                fullAddress, // Combined address (cols 36 + 37 + 39)
                row[43] || "", // Shipping Phone (col 43)
                row[11] || "", // Total (col 11)
                row[44] || "" // Notes (col 44)
            ];
            orderMap.set(orderNumber, extractedData);
        }
    }

    // Convert map values to array
    return Array.from(orderMap.values());
};

/**
 * Detect if data is from a Shopify export
 * Checks for presence of specific Shopify column headers
 */
export const isShopifyExport = (headers: string[]): boolean => {
    const shopifyHeaders = ["Name", "Email", "Shipping Name", "Billing Name", "Financial Status"];
    return shopifyHeaders.every((header) => headers.some((h) => h.toLowerCase().includes(header.toLowerCase())));
};
