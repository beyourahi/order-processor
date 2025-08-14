/**
 * Data processing utilities for order preparation
 * Contains utility functions for cleaning, filtering, and preparing CSV data
 */

import { STEADFAST_INDEXES_ARRAY, PATHAO_INDEXES_ARRAY, SHOPIFY_STEADFAST_INDEXES_ARRAY } from "@/constants";

// ================== DATA PROCESSING UTILITIES ==================

/**
 * Optimized function to remove duplicates and extract specific indexes
 * Uses Set for O(1) lookup performance
 */
export const removeDuplicatesAndExtractIndexes = (data: string[][], indexes: number[]): string[][] => {
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
            uniqueData.push(indexes.map(index => entry[index] || ""));
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
 * Prepare data for Pathao courier processing
 * Optimized with proper filtering and error handling
 */
export const preparePathaoOrderData = (rawData: string[][]): string[][] => {
    if (rawData.length <= 1) return []; // Need at least header + data

    return rawData
        .slice(1) // Skip header row
        // Pathao only accepts orders with invoice numbers starting with "#"
        // This filtering ensures compliance with Pathao's order format requirements
        .filter(row => row?.[0]?.startsWith("#"))
        // Map each row to extract only the columns Pathao needs
        .map(row => PATHAO_INDEXES_ARRAY.map(index => row[index] || ""));
};

/**
 * Prepare data for SteadFast courier processing from Shopify export
 * Handles multi-line orders and consolidates customer information
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
            // Extract: [name, address, phone, amount, notes]
            const extractedData = SHOPIFY_STEADFAST_INDEXES_ARRAY.map(index => row[index] || "");
            orderMap.set(orderNumber, extractedData);
        }
    }
    
    // Convert map values to array
    return Array.from(orderMap.values());
};