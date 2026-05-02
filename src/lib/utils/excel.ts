import * as XLSX from "xlsx";

export const generateExcel = <T extends object>(data: T[], fileName: string, sheetName: string = "Sheet1"): void => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
};
