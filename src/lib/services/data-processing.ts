import { STEADFAST_INDEXES_ARRAY } from "$lib/constants";

const removeDuplicatesAndExtractIndexes = (data: string[][], indexes: readonly number[]): string[][] => {
    const uniqueData: string[][] = [];
    const seenFirstValues = new Set<string>();

    for (const entry of data) {
        const firstValue = entry[0];
        if (firstValue && !seenFirstValues.has(firstValue)) {
            seenFirstValues.add(firstValue);
            uniqueData.push(indexes.map((index) => entry[index] || ""));
        }
    }

    return uniqueData;
};

// Legacy non-Shopify CSV: .slice(1, -1) drops the header AND a trailing
// summary row. CLAUDE.md warning #6: do NOT remove without confirming the
// source format still has both.
export const prepareSteadFastOrderData = (rawData: string[][]): string[][] => {
    if (rawData.length <= 2) return [];
    const processed = removeDuplicatesAndExtractIndexes(rawData, STEADFAST_INDEXES_ARRAY);
    return processed.slice(1, -1);
};

const buildFullAddress = (address1: string, address2: string, city: string): string => {
    return [address1, address2, city]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(", ");
};

/**
 * Shopify exports repeat the order header for every line item; we collapse on
 * `Name` (col 0) keyed by the leading `#`. Column indexes are positional and
 * tied to Shopify's current export schema — if Shopify changes the schema,
 * these break silently (CLAUDE.md warning #5).
 *   34 ShippingName | 36/37/39 ShippingAddress1 / 2 / City
 *   43 ShippingPhone | 11 Total | 44 Notes
 */
export const prepareShopifySteadFastOrderData = (rawData: string[][]): string[][] => {
    if (rawData.length <= 1) return [];

    const orderMap = new Map<string, string[]>();

    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row) continue;

        const orderNumber = row[0];
        if (!orderNumber?.startsWith("#") || !row[34]) continue;

        if (!orderMap.has(orderNumber)) {
            const fullAddress = buildFullAddress(row[36] || "", row[37] || "", row[39] || "");
            orderMap.set(orderNumber, [
                row[34] || "",
                fullAddress,
                row[43] || "",
                row[11] || "",
                row[44] || ""
            ]);
        }
    }

    return Array.from(orderMap.values());
};

export const isShopifyExport = (headers: string[]): boolean => {
    const shopifyHeaders = ["Name", "Email", "Shipping Name", "Billing Name", "Financial Status"];
    return shopifyHeaders.every((header) => headers.some((h) => h.toLowerCase().includes(header.toLowerCase())));
};
