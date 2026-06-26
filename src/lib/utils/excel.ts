import * as XLSX from "xlsx";

export const buildWorkbook = <T extends object>(data: T[], sheetName: string = "Sheet1"): XLSX.WorkBook => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return workbook;
};

// Side effect: triggers an immediate browser download of the .xlsx. Returns
// nothing — must run client-side (SheetJS writeFile uses the DOM/Blob APIs).
export const writeWorkbook = (workbook: XLSX.WorkBook, fileName: string): void => {
    XLSX.writeFile(workbook, fileName);
};
