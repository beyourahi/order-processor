import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const log = (caption: string, message: unknown) => {
    if (typeof message === "object") message = JSON.stringify(message, null, 4);
    return console.log(`\n\u001b[1;31m LOG ===>\u001b[1;32m ${caption}: ${message}\n`);
};

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const removeDuplicatesAndExtractIndexes = (data: any[][], indexes: number[]) => {
    const uniqueData = [];
    const seenFirstValues = new Set<any>();

    for (const entry of data) {
        const firstValue = entry[0];

        if (!seenFirstValues.has(firstValue)) {
            seenFirstValues.add(firstValue);
            uniqueData.push(indexes.map(index => entry[index]));
        }
    }

    return uniqueData;
};

export const extractInvoices = (rawData: string[][]): Map<string, string> => {
    const invoices = new Map<string, string>();
    rawData.slice(1).forEach((row: string[]) => {
        if (row[0]?.startsWith("#")) {
            invoices.set(row[34], row[0]);
        }
    });
    return invoices;
};

export const prepareSteadFastOrderData = (rawData: string[][]): string[][] => {
    const indexes = [34, 36, 39, 43, 11, 44];
    return removeDuplicatesAndExtractIndexes(rawData, indexes).slice(1, -1);
};

export const preparePathaoOrderData = (rawData: string[][]): string[][] => {
    const indexes = [0, 34, 17, 36, 39, 11, 43];
    return rawData
        .slice(1)
        .filter(row => row[0]?.startsWith("#"))
        .map(row => indexes.map(index => row[index]));
};
