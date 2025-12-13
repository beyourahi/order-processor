/**
 * Excel generation utilities using SheetJS (xlsx)
 * Provides functions for creating and downloading Excel files
 */

import * as XLSX from "xlsx";

/**
 * Generate and download an Excel file from data
 * Creates a workbook from the data and triggers browser download
 * @param data - Array of objects to convert to Excel rows
 * @param fileName - Name for the downloaded file (with .xlsx extension)
 * @param sheetName - Name for the worksheet (default: "Sheet1")
 */
export const generateExcel = <T extends object>(data: T[], fileName: string, sheetName: string = "Sheet1"): void => {
    // Create worksheet from JSON data
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate and download the file
    XLSX.writeFile(workbook, fileName);
};

/**
 * Generate Excel file as a Blob (for custom handling)
 * Useful when you need to do something other than direct download
 * @param data - Array of objects to convert to Excel rows
 * @param sheetName - Name for the worksheet (default: "Sheet1")
 * @returns Blob containing the Excel file data
 */
export const generateExcelBlob = <T extends object>(data: T[], sheetName: string = "Sheet1"): Blob => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate binary array
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    return new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
};
