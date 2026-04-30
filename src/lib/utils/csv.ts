/**
 * CSV parsing utilities using Papa Parse
 * Provides Promise-based API for parsing CSV files and strings
 */

import Papa from "papaparse";
import type { CSVParseResult } from "$lib/types";

/**
 * Parse a CSV file and return the data
 * Wraps Papa Parse's callback-based API in a Promise
 * @param file - The File object to parse
 * @returns Promise resolving to parsed CSV data
 */
export const parseCSV = (file: File): Promise<CSVParseResult> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            complete: (results) => {
                resolve({
                    data: results.data as string[][],
                    errors: results.errors,
                    meta: results.meta
                });
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};

/**
 * Parse CSV string directly (synchronous)
 * Useful for testing or processing inline CSV data
 * @param csvString - Raw CSV string to parse
 * @returns Parsed CSV result
 */
export const parseCSVString = (csvString: string): CSVParseResult => {
    const results = Papa.parse(csvString);
    return {
        data: results.data as string[][],
        errors: results.errors,
        meta: results.meta
    };
};

/**
 * Format file size for display
 * Converts bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
    const BYTES_PER_UNIT = 1024;
    if (bytes === 0) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT));
    return parseFloat((bytes / Math.pow(BYTES_PER_UNIT, i)).toFixed(2)) + " " + sizes[i];
};
