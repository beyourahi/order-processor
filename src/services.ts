import {
    Courier,
    type CourierProcessor,
    type OrderType,
    type UserInfo,
    type PathaoOrder,
    type SteadFastOrder,
    STEADFAST_INDEXES,
    PATHAO_INDEXES
} from "@/config";

// ================== DATA PROCESSING UTILITIES ==================

/**
 * Optimized function to remove duplicates and extract specific indexes
 * Uses Set for O(1) lookup performance
 */
export const removeDuplicatesAndExtractIndexes = (data: string[][], indexes: number[]): string[][] => {
    const uniqueData: string[][] = [];
    const seenFirstValues = new Set<string>();

    for (const entry of data) {
        const firstValue = entry[0];

        if (firstValue && !seenFirstValues.has(firstValue)) {
            seenFirstValues.add(firstValue);
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
        if (row?.[0]?.startsWith("#") && row[34]) {
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

    const processed = removeDuplicatesAndExtractIndexes(rawData, STEADFAST_INDEXES);
    return processed.slice(1, -1); // Remove first and last entries
};

/**
 * Prepare data for Pathao courier processing
 * Optimized with proper filtering and error handling
 */
export const preparePathaoOrderData = (rawData: string[][]): string[][] => {
    if (rawData.length <= 1) return []; // Need at least header + data

    return rawData
        .slice(1) // Skip header
        .filter(row => row?.[0]?.startsWith("#"))
        .map(row => PATHAO_INDEXES.map(index => row[index] || ""));
};

// ================== COURIER PROCESSORS ==================

class PathaoProcessor implements CourierProcessor<PathaoOrder> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    processOrders(data: string[][], _user: UserInfo): PathaoOrder[] {
        return data.map(row => ({
            "Order No": row[0] || "",
            Name: row[1] || "",
            Product: row[2] || "",
            Price: row[3] || "",
            Address: row[4] || "",
            City: row[5] || "",
            "Phone No": row[6] || ""
        }));
    }
}

class SteadFastProcessor implements CourierProcessor<SteadFastOrder> {
    processOrders(data: string[][], user: UserInfo): SteadFastOrder[] {
        return data.map(row => ({
            Invoice: `#${user.merchant_id}${row[0] || ""}`,
            Name: user.name,
            "Contact Name": row[0] || "",
            "Contact Phone": row[5] || "",
            Address: row[2] || "",
            Phone: user.phone,
            Amount: row[3] || "",
            Note: row[4] || ""
        }));
    }
}

// ================== COURIER SERVICE ==================

export class CourierService {
    private static readonly processors = new Map<Courier, CourierProcessor<OrderType>>([
        [Courier.SteadFast, new SteadFastProcessor()],
        [Courier.Pathao, new PathaoProcessor()]
    ]);

    static processOrders(courierType: Courier, rawData: string[][], user: UserInfo): OrderType[] {
        const processor = this.processors.get(courierType);
        if (!processor) {
            throw new Error(`No processor found for courier: ${courierType}`);
        }

        const preparedData =
            courierType === Courier.SteadFast ? prepareSteadFastOrderData(rawData) : preparePathaoOrderData(rawData);

        return processor.processOrders(preparedData, user);
    }
}
