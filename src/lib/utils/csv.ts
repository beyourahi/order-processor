import Papa from "papaparse";
import type { CSVParseResult } from "$lib/types";

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

const BYTES_PER_UNIT = 1024;

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT));
    return parseFloat((bytes / Math.pow(BYTES_PER_UNIT, i)).toFixed(2)) + " " + sizes[i];
};
