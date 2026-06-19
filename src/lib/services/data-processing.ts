const buildFullAddress = (address1: string, address2: string, city: string): string => {
    return [address1, address2, city]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(", ");
};

/**
 * Maps one raw CSV row to the SteadFastProcessor's positional contract
 * `[Name, Address, Phone, Amount, Note]`. Column indexes are tied to Shopify's
 * current export schema (CLAUDE.md warning #5 — they break silently if Shopify
 * reorders columns):
 *   34 ShippingName | 36/37/39 ShippingAddress1 / 2 / City | 43 Phone | 11 Total | 44 Notes
 * Both prepare paths share this helper so they can never drift out of alignment.
 */
const toSteadFastRow = (row: string[]): string[] => [
    row[34] || "",
    buildFullAddress(row[36] || "", row[37] || "", row[39] || ""),
    row[43] || "",
    row[11] || "",
    row[44] || ""
];

/**
 * Legacy non-Shopify CSV path. Dedups by the first column, maps each row to the
 * `[Name, Address, Phone, Amount, Note]` contract (via {@link toSteadFastRow}),
 * then `.slice(1, -1)` drops the header AND a trailing summary row. CLAUDE.md
 * warning #6: keep both — the legacy format carries a header and a totals row.
 */
export const prepareSteadFastOrderData = (rawData: string[][]): string[][] => {
    if (rawData.length <= 2) return [];

    const seen = new Set<string>();
    const rows: string[][] = [];
    for (const entry of rawData) {
        const key = entry[0];
        if (!key || seen.has(key)) continue;
        seen.add(key);
        rows.push(toSteadFastRow(entry));
    }

    return rows.slice(1, -1);
};

/**
 * Shopify exports repeat the order header for every line item; we collapse on
 * `Name` (col 0) keyed by the leading `#`, keeping the first line per order.
 * Columns map via {@link toSteadFastRow} — identical semantics to the legacy
 * path, just a different dedup key and no header/summary trim.
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
            orderMap.set(orderNumber, toSteadFastRow(row));
        }
    }

    return Array.from(orderMap.values());
};

export const isShopifyExport = (headers: string[]): boolean => {
    const shopifyHeaders = ["Name", "Email", "Shipping Name", "Billing Name", "Financial Status"];
    return shopifyHeaders.every((header) => headers.some((h) => h.toLowerCase().includes(header.toLowerCase())));
};
