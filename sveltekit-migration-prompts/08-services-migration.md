# 08 - Services Migration

## Prerequisites
- `01-project-setup.md` through `07-config-constants-migration.md` completed

## Next Prompt
- `09-ui-components-migration.md`

---

## Objective

Migrate the business logic services from Next.js. These are pure TypeScript and require only import path updates.

---

## Instructions

### Step 1: Create Services Directory

```bash
mkdir -p src/lib/services/processors
```

### Step 2: Migrate SteadFast Processor

**src/lib/services/processors/steadfast.ts:**
```typescript
import type { CourierProcessor, SteadFastOrder, UserInfo } from "$lib/types";

/**
 * Normalize Bangladesh phone numbers for SteadFast
 * - Removes +880 country code
 * - Strips leading zeros
 * - Ensures number starts with 1 (Bangladesh mobile format)
 */
const normalizePhone = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // Remove +880 country code if present
    if (cleaned.startsWith("880")) {
        cleaned = cleaned.slice(3);
    }

    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, "");

    // Ensure it starts with 1 (Bangladesh mobile)
    if (!cleaned.startsWith("1") && cleaned.length === 10) {
        cleaned = "1" + cleaned;
    }

    return cleaned;
};

/**
 * SteadFast order processor
 * Transforms prepared CSV data into SteadFast order format
 */
export class SteadFastProcessor implements CourierProcessor<SteadFastOrder> {
    processOrders(data: string[][], user: UserInfo): SteadFastOrder[] {
        return data.map(row => ({
            Invoice: user.merchant_id,
            Name: row[0] ?? "",
            Address: row[1] ?? "",
            Phone: normalizePhone(row[2] ?? ""),
            Amount: row[3] ?? "",
            Note: row[4] ?? "",
            Lot: "",
            "Delivery Type": "Home",
            "Contact Name": user.name,
            "Contact Phone": user.phone
        }));
    }
}
```

### Step 3: Migrate Pathao Processor

**src/lib/services/processors/pathao.ts:**
```typescript
import type { CourierProcessor, PathaoOrder, UserInfo } from "$lib/types";

/**
 * Pathao order processor
 * Transforms prepared CSV data into Pathao order format
 */
export class PathaoProcessor implements CourierProcessor<PathaoOrder> {
    processOrders(data: string[][], _user: UserInfo): PathaoOrder[] {
        return data.map(row => ({
            "Order No": row[0] ?? "",
            Name: row[1] ?? "",
            Product: row[2] ?? "",
            Address: row[3] ?? "",
            City: row[4] ?? "",
            Price: row[5] ?? "",
            "Phone No": row[6] ?? ""
        }));
    }
}
```

### Step 4: Create Processors Index

**src/lib/services/processors/index.ts:**
```typescript
export { SteadFastProcessor } from "./steadfast";
export { PathaoProcessor } from "./pathao";
```

### Step 5: Migrate Data Processing Utilities

**src/lib/services/data-processing.ts:**
```typescript
import {
    SHOPIFY_EXPORT_INDEXES,
    STEADFAST_INDEXES_ARRAY,
    PATHAO_INDEXES_ARRAY,
    SHOPIFY_STEADFAST_INDEXES_ARRAY
} from "$lib/constants";

/**
 * Remove duplicate rows and extract specific columns
 * Uses Set for O(1) deduplication based on first column
 */
export const removeDuplicatesAndExtractIndexes = (
    data: string[][],
    indexes: readonly number[]
): string[][] => {
    const seen = new Set<string>();
    const result: string[][] = [];

    for (const row of data) {
        const key = row[0];
        if (key && !seen.has(key)) {
            seen.add(key);
            result.push(indexes.map(i => row[i] ?? ""));
        }
    }

    return result;
};

/**
 * Extract invoice numbers from order data
 * Creates a map of order names to their line counts
 */
export const extractInvoices = (data: string[][]): Map<string, number> => {
    const invoiceMap = new Map<string, number>();

    for (const row of data) {
        const orderName = row[SHOPIFY_EXPORT_INDEXES.ORDER_NAME];
        if (orderName) {
            invoiceMap.set(orderName, (invoiceMap.get(orderName) ?? 0) + 1);
        }
    }

    return invoiceMap;
};

/**
 * Prepare data for SteadFast format
 * Filters rows and extracts required columns
 */
export const prepareSteadFastOrderData = (data: string[][]): string[][] => {
    // Skip header row, filter rows that have data in required columns
    const filtered = data.slice(1).filter(row => {
        const name = row[STEADFAST_INDEXES_ARRAY[0]];
        return name && name.trim() !== "";
    });

    return removeDuplicatesAndExtractIndexes(filtered, STEADFAST_INDEXES_ARRAY);
};

/**
 * Prepare data for Pathao format
 * Filters rows starting with # (order numbers) and extracts columns
 */
export const preparePathaoOrderData = (data: string[][]): string[][] => {
    // Filter rows where first column starts with #
    const filtered = data.filter(row => {
        const orderNo = row[SHOPIFY_EXPORT_INDEXES.ORDER_NAME];
        return orderNo && orderNo.startsWith("#");
    });

    return removeDuplicatesAndExtractIndexes(filtered, PATHAO_INDEXES_ARRAY);
};

/**
 * Prepare Shopify export data for SteadFast format
 * Consolidates multi-line orders and extracts required columns
 */
export const prepareShopifySteadFastOrderData = (data: string[][]): string[][] => {
    // Skip header row
    const dataRows = data.slice(1);

    // Group by order name and consolidate
    const orderMap = new Map<string, string[]>();

    for (const row of dataRows) {
        const orderName = row[SHOPIFY_EXPORT_INDEXES.ORDER_NAME];
        if (!orderName || orderName.trim() === "") continue;

        if (!orderMap.has(orderName)) {
            // First occurrence - store the full row data
            orderMap.set(orderName, SHOPIFY_STEADFAST_INDEXES_ARRAY.map(i => row[i] ?? ""));
        }
        // Subsequent occurrences are ignored (same order, different line items)
    }

    return Array.from(orderMap.values());
};

/**
 * Detect if data is from a Shopify export
 * Checks for presence of specific Shopify column headers
 */
export const isShopifyExport = (headers: string[]): boolean => {
    const shopifyHeaders = ["Name", "Email", "Shipping Name", "Billing Name", "Financial Status"];
    return shopifyHeaders.every(header =>
        headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
    );
};
```

### Step 6: Migrate Courier Service

**src/lib/services/courier-service.ts:**
```typescript
import { Courier } from "$lib/types";
import type { SteadFastOrder, PathaoOrder, UserInfo } from "$lib/types";
import { SteadFastProcessor, PathaoProcessor } from "./processors";
import {
    prepareSteadFastOrderData,
    preparePathaoOrderData,
    prepareShopifySteadFastOrderData,
    isShopifyExport
} from "./data-processing";

/**
 * Main courier service - orchestrates order processing
 */
export class CourierService {
    private static readonly processors = new Map([
        [Courier.SteadFast, new SteadFastProcessor()],
        [Courier.Pathao, new PathaoProcessor()]
    ]);

    /**
     * Process orders for a specific courier
     * Auto-detects Shopify export format and routes to appropriate processor
     */
    static processOrders(
        courier: Courier,
        rawData: string[][],
        user: UserInfo
    ): SteadFastOrder[] | PathaoOrder[] {
        const processor = this.processors.get(courier);

        if (!processor) {
            throw new Error(`No processor found for courier: ${courier}`);
        }

        // Check if this is a Shopify export
        const headers = rawData[0] ?? [];
        const isShopify = isShopifyExport(headers);

        // Prepare data based on courier and source
        let preparedData: string[][];

        switch (courier) {
            case Courier.SteadFast:
                preparedData = isShopify
                    ? prepareShopifySteadFastOrderData(rawData)
                    : prepareSteadFastOrderData(rawData);
                break;
            case Courier.Pathao:
                preparedData = preparePathaoOrderData(rawData);
                break;
            default:
                throw new Error(`Unsupported courier: ${courier}`);
        }

        return processor.processOrders(preparedData, user);
    }

    /**
     * Check if data appears to be a Shopify export
     */
    static isShopifyExport(rawData: string[][]): boolean {
        const headers = rawData[0] ?? [];
        return isShopifyExport(headers);
    }
}
```

### Step 7: Create Services Index

**src/lib/services/index.ts:**
```typescript
// Main service
export { CourierService } from "./courier-service";

// Processors
export { SteadFastProcessor, PathaoProcessor } from "./processors";

// Data processing utilities
export {
    removeDuplicatesAndExtractIndexes,
    extractInvoices,
    prepareSteadFastOrderData,
    preparePathaoOrderData,
    prepareShopifySteadFastOrderData,
    isShopifyExport
} from "./data-processing";
```

---

## Verification

```bash
# Type check
bun run check
```

Test the service:

```svelte
<script lang="ts">
    import { CourierService } from "$lib/services";
    import { Courier } from "$lib/types";

    // Test data
    const testData = [
        ["Name", "Email", "Total", "Shipping Name", "Shipping Address", "Shipping Phone", "Notes"],
        ["#13826", "test@example.com", "1500", "John Doe", "123 Main St", "01712345678", "Handle with care"]
    ];

    const result = CourierService.processOrders(
        Courier.SteadFast,
        testData,
        { name: "Test User", phone: "01700000000", merchant_id: "12345" }
    );

    console.log("Processed orders:", result);
</script>
```

---

## Files Created

- `src/lib/services/processors/steadfast.ts`
- `src/lib/services/processors/pathao.ts`
- `src/lib/services/processors/index.ts`
- `src/lib/services/data-processing.ts`
- `src/lib/services/courier-service.ts`
- `src/lib/services/index.ts`

---

## Changes from Original

| Original | SvelteKit | Reason |
|----------|-----------|--------|
| `@/services` | `$lib/services` | Path alias |
| `@/types` | `$lib/types` | Path alias |
| `@/constants` | `$lib/constants` | Path alias |

---

## Notes

- All business logic is pure TypeScript and works identically
- The phone normalization logic for Bangladesh numbers is preserved
- The Shopify export detection checks for specific column headers
- The CourierService.processOrders() method is the main entry point
- Data preparation functions handle deduplication and column extraction
