import Papa from "papaparse";
import type { CSVParseResult } from "$lib/types";

// Parses with `header: false` (PapaParse default), so `data` is a raw 2D array
// including the header row. Downstream prep (data-processing.ts) relies on this
// positional layout and on fixed column indexes — do not enable header mode.
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
