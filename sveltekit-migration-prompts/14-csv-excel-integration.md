# 14 - CSV & Excel Integration

## Prerequisites

- `01-project-setup.md` through `13-auth-flows-migration.md` completed

## Next Prompt

- `15-static-assets-migration.md`

---

## MCP Servers to Use

Before implementing this prompt, use these MCP servers for accurate documentation:

| MCP Server   | Usage                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| **context7** | **PRIMARY** - Use `resolve-library-id` → `get-library-docs` for papaparse CSV parsing API and xlsx Excel generation |
| **svelte**   | Use `get-documentation` for Svelte 5 async patterns and `$state` for processing states                              |

### Recommended MCP Queries

```
context7 MCP:
- resolve-library-id: "papaparse" → get-library-docs for parse() API, complete callback
- resolve-library-id: "xlsx" → get-library-docs for utils.json_to_sheet, writeFile
- resolve-library-id: "xlsx" → get-library-docs topic: "workbook"

svelte MCP:
- get-documentation: "async", "promises"
- svelte-autofixer: Validate OrderProcessor component updates
```

**Note**: This prompt verifies the CSV/Excel pipeline. The libraries work the same as in React, but without react-papaparse wrapper.

---

## Objective

Verify and finalize the CSV parsing (Papa Parse) and Excel generation (xlsx) integration. Test the complete file processing pipeline.

---

## Instructions

### Step 1: Install Papa Parse Types

```bash
bun add -D @types/papaparse
```

### Step 2: Create CSV Utilities

**src/lib/utils/csv.ts:**

```typescript
import Papa from "papaparse";
import type { CSVParseResult } from "$lib/types";

/**
 * Parse a CSV file and return the data
 */
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

/**
 * Parse CSV string directly
 */
export const parseCSVString = (csvString: string): CSVParseResult => {
    const results = Papa.parse(csvString);
    return {
        data: results.data as string[][],
        errors: results.errors,
        meta: results.meta
    };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
```

### Step 3: Create Excel Utilities

**src/lib/utils/excel.ts:**

```typescript
import * as XLSX from "xlsx";

/**
 * Generate and download an Excel file from data
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
 */
export const generateExcelBlob = <T extends object>(data: T[], sheetName: string = "Sheet1"): Blob => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate binary string
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    return new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
};
```

### Step 4: Update Utils Index

**src/lib/utils/index.ts:**

```typescript
// Class name utility
export { cn } from "./cn";

// CSV utilities
export { parseCSV, parseCSVString, formatFileSize } from "./csv";

// Excel utilities
export { generateExcel, generateExcelBlob } from "./excel";
```

**src/lib/utils/cn.ts:** (move from utils.ts)

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => {
    return twMerge(clsx(inputs));
};
```

### Step 5: Update OrderProcessor with Utilities

**src/lib/components/features/order-processor.svelte:**

```svelte
<!--
  OrderProcessor Component
  Main CSV upload and Excel generation component
-->
<script lang="ts">
    import { CourierService } from "$lib/services";
    import { generateFileName } from "$lib/constants";
    import { Courier } from "$lib/types";
    import type { CurrentUser } from "$lib/types";
    import { cn, parseCSV, generateExcel } from "$lib/utils";
    import Upload from "./upload.svelte";
    import Download from "./download.svelte";

    interface Props {
        currentUser: CurrentUser;
        selectedCourier: string;
    }

    let { currentUser, selectedCourier }: Props = $props();

    // Component state
    let zoneHover = $state(false);
    let acceptedFile = $state<File | null>(null);
    let isProcessing = $state(false);
    let error = $state<string | null>(null);
    let fileInputRef = $state<HTMLInputElement | null>(null);

    // Computed: is upload disabled?
    const isDisabled = $derived(selectedCourier === "" || currentUser.courier !== selectedCourier);

    // Handle file selection
    const handleFileSelect = async (file: File) => {
        if (isDisabled || !currentUser.courier) return;

        acceptedFile = file;
        isProcessing = true;
        error = null;

        try {
            // Parse CSV
            const result = await parseCSV(file);

            if (result.errors.length > 0) {
                console.warn("CSV parsing warnings:", result.errors);
            }

            // Process orders through courier service
            const processedOrders = CourierService.processOrders(currentUser.courier as Courier, result.data, {
                name: currentUser.name,
                phone: currentUser.phone || "",
                merchant_id: currentUser.merchant_id || ""
            });

            // Generate and download Excel file
            const fileName = generateFileName(currentUser.courier as string);
            generateExcel(processedOrders, fileName, "Sheet1");

            // Reset state after short delay (so user sees the download preview)
            setTimeout(() => {
                acceptedFile = null;
                zoneHover = false;
            }, 2000);
        } catch (e) {
            console.error("Processing error:", e);
            error = e instanceof Error ? e.message : "Failed to process file";
            acceptedFile = null;
        } finally {
            isProcessing = false;
        }
    };

    // Handle drag events
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (!isDisabled) {
            zoneHover = true;
        }
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        zoneHover = false;
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        zoneHover = false;

        if (isDisabled) return;

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
                handleFileSelect(file);
            } else {
                error = "Please upload a CSV file";
            }
        }
    };

    // Handle click to browse
    const handleClick = () => {
        if (!isDisabled && fileInputRef) {
            fileInputRef.click();
        }
    };

    const handleInputChange = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const files = input.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file) {
                handleFileSelect(file);
            }
        }
        // Reset input so same file can be selected again
        input.value = "";
    };
</script>

<div
    role="button"
    tabindex={isDisabled ? -1 : 0}
    class={cn(
        "flex h-80 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors lg:w-1/2",
        isDisabled
            ? "cursor-not-allowed border-zinc-800 opacity-50"
            : "cursor-pointer border-zinc-700 hover:border-zinc-500",
        zoneHover && "border-zinc-500 bg-zinc-900/50",
        error && "border-red-500/50"
    )}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onclick={handleClick}
    onkeydown={(e) => e.key === "Enter" && handleClick()}
>
    <!-- Hidden file input -->
    <input
        bind:this={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        class="hidden"
        onchange={handleInputChange}
        disabled={isDisabled}
    />

    <!-- Error display -->
    {#if error}
        <div class="flex flex-col items-center gap-4">
            <p class="text-red-500">{error}</p>
            <button onclick={() => (error = null)} class="text-sm text-zinc-400 hover:text-white"> Try again </button>
        </div>
        <!-- Processing state -->
    {:else if isProcessing}
        <div class="flex flex-col items-center gap-4">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            <p class="text-zinc-400">Processing...</p>
        </div>
        <!-- File accepted -->
    {:else if acceptedFile}
        <Download fileName={acceptedFile.name} fileSize={acceptedFile.size} />
        <!-- Upload prompt -->
    {:else}
        <Upload disabled={isDisabled} />
    {/if}
</div>
```

### Step 6: Create Test CSV File

Create a test CSV file for development:

**static/test-orders.csv:**

```csv
Name,Email,Financial Status,Paid at,Fulfillment Status,Fulfilled at,Accepts Marketing,Currency,Subtotal,Shipping,Taxes,Total,Discount Code,Discount Amount,Shipping Method,Created at,Lineitem quantity,Lineitem name,Lineitem price,Lineitem compare at price,Lineitem sku,Lineitem requires shipping,Lineitem taxable,Lineitem fulfillment status,Billing Name,Billing Street,Billing Address1,Billing Address2,Billing Company,Billing City,Billing Zip,Billing Province,Billing Country,Billing Phone,Shipping Name,Shipping Street,Shipping Address1,Shipping Address2,Shipping Company,Shipping City,Shipping Zip,Shipping Province,Shipping Country,Shipping Phone,Notes
#13826,test@example.com,paid,2024-01-15,unfulfilled,,no,BDT,1200,50,0,1250,,,Standard,2024-01-15,1,Product A,1200,,SKU001,yes,yes,,John Doe,123 Main St,123 Main St,Apt 4,,Dhaka,1205,Dhaka,Bangladesh,01712345678,John Doe,123 Main St,123 Main St,Apt 4,,Dhaka,1205,Dhaka,Bangladesh,01712345678,Handle with care
#13827,test2@example.com,paid,2024-01-15,unfulfilled,,no,BDT,800,50,0,850,,,Standard,2024-01-15,1,Product B,800,,SKU002,yes,yes,,Jane Smith,456 Oak Ave,456 Oak Ave,,,Chittagong,4000,Chittagong,Bangladesh,01898765432,Jane Smith,456 Oak Ave,456 Oak Ave,,,Chittagong,4000,Chittagong,Bangladesh,01898765432,
```

### Step 7: Create File Processing Test Page

**src/routes/test-processing/+page.svelte:**

```svelte
<!--
  File Processing Test Page
  For development testing of CSV/Excel pipeline
-->
<script lang="ts">
    import { CourierService } from "$lib/services";
    import { Courier } from "$lib/types";
    import { parseCSVString, generateExcel } from "$lib/utils";

    // Test data
    const testCSV = `Name,Email,Financial Status,Paid at,Fulfillment Status,Fulfilled at,Accepts Marketing,Currency,Subtotal,Shipping,Taxes,Total,Discount Code,Discount Amount,Shipping Method,Created at,Lineitem quantity,Lineitem name,Lineitem price,Lineitem compare at price,Lineitem sku,Lineitem requires shipping,Lineitem taxable,Lineitem fulfillment status,Billing Name,Billing Street,Billing Address1,Billing Address2,Billing Company,Billing City,Billing Zip,Billing Province,Billing Country,Billing Phone,Shipping Name,Shipping Street,Shipping Address1,Shipping Address2,Shipping Company,Shipping City,Shipping Zip,Shipping Province,Shipping Country,Shipping Phone,Notes
#13826,test@example.com,paid,2024-01-15,unfulfilled,,no,BDT,1200,50,0,1250,,,Standard,2024-01-15,1,Product A,1200,,SKU001,yes,yes,,John Doe,123 Main St,123 Main St,Apt 4,,Dhaka,1205,Dhaka,Bangladesh,01712345678,John Doe,123 Main St,123 Main St,Apt 4,,Dhaka,1205,Dhaka,Bangladesh,01712345678,Handle with care
#13827,test2@example.com,paid,2024-01-15,unfulfilled,,no,BDT,800,50,0,850,,,Standard,2024-01-15,1,Product B,800,,SKU002,yes,yes,,Jane Smith,456 Oak Ave,456 Oak Ave,,,Chittagong,4000,Chittagong,Bangladesh,01898765432,Jane Smith,456 Oak Ave,456 Oak Ave,,,Chittagong,4000,Chittagong,Bangladesh,01898765432,`;

    let results = $state<string>("");

    const testSteadFast = () => {
        const parsed = parseCSVString(testCSV);
        const processed = CourierService.processOrders(Courier.SteadFast, parsed.data, {
            name: "Test Brand",
            phone: "01700000000",
            merchant_id: "12345"
        });
        results = JSON.stringify(processed, null, 2);
    };

    const testPathao = () => {
        const parsed = parseCSVString(testCSV);
        const processed = CourierService.processOrders(Courier.Pathao, parsed.data, {
            name: "Test Brand",
            phone: "01700000000",
            merchant_id: "12345"
        });
        results = JSON.stringify(processed, null, 2);
    };

    const downloadSteadFast = () => {
        const parsed = parseCSVString(testCSV);
        const processed = CourierService.processOrders(Courier.SteadFast, parsed.data, {
            name: "Test Brand",
            phone: "01700000000",
            merchant_id: "12345"
        });
        generateExcel(processed, "test-steadfast.xlsx");
    };

    const downloadPathao = () => {
        const parsed = parseCSVString(testCSV);
        const processed = CourierService.processOrders(Courier.Pathao, parsed.data, {
            name: "Test Brand",
            phone: "01700000000",
            merchant_id: "12345"
        });
        generateExcel(processed, "test-pathao.xlsx");
    };
</script>

<div class="flex min-h-screen flex-col items-center gap-8 p-8">
    <h1 class="text-2xl font-bold">File Processing Test</h1>

    <div class="flex gap-4">
        <button onclick={testSteadFast} class="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700">
            Test SteadFast
        </button>
        <button onclick={testPathao} class="rounded-lg bg-green-600 px-4 py-2 hover:bg-green-700"> Test Pathao </button>
    </div>

    <div class="flex gap-4">
        <button onclick={downloadSteadFast} class="rounded-lg bg-blue-800 px-4 py-2 hover:bg-blue-900">
            Download SteadFast Excel
        </button>
        <button onclick={downloadPathao} class="rounded-lg bg-green-800 px-4 py-2 hover:bg-green-900">
            Download Pathao Excel
        </button>
    </div>

    {#if results}
        <pre class="max-h-96 w-full max-w-4xl overflow-auto rounded-lg bg-zinc-900 p-4 text-sm">{results}</pre>
    {/if}
</div>
```

---

## Verification

```bash
# Type check
bun run check

# Start dev server
bun run dev
```

Test the pipeline:

1. Visit /test-processing
2. Click "Test SteadFast" - should show JSON output
3. Click "Download SteadFast Excel" - should download .xlsx file
4. Open the Excel file - verify data is correct

---

## Files Created/Modified

- `src/lib/utils/csv.ts` (created)
- `src/lib/utils/excel.ts` (created)
- `src/lib/utils/cn.ts` (created from utils.ts)
- `src/lib/utils/index.ts` (created)
- `src/lib/components/features/order-processor.svelte` (updated)
- `static/test-orders.csv` (created)
- `src/routes/test-processing/+page.svelte` (created)

---

## Library Comparison

| react-papaparse           | Papa Parse (direct)         |
| ------------------------- | --------------------------- |
| `<CSVReader>` component   | `Papa.parse(file, options)` |
| Render prop pattern       | Promise-based API           |
| `formatFileSize` included | Custom implementation       |
| React-specific            | Framework agnostic          |

---

## Notes

- Papa Parse works identically, just without the React wrapper
- xlsx library is unchanged
- Added error handling and processing states
- Test page can be removed before production
- The Excel sheet name is "Sheet1" to match original
