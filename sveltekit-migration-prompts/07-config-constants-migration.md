# 07 - Config & Constants Migration

## Prerequisites
- `01-project-setup.md` through `06-types-migration.md` completed

## Next Prompt
- `08-services-migration.md`

---

## MCP Servers to Use

Before implementing this prompt, use these MCP servers for accurate documentation:

| MCP Server | Usage |
|------------|-------|
| **svelte** | Use `get-documentation` for SvelteKit `$lib` alias and module resolution patterns |

### Recommended MCP Queries
```
svelte MCP:
- get-documentation: "modules", "$lib"
- get-documentation: "imports", "aliases"
```

**Note**: This prompt involves pure TypeScript files with minimal framework-specific code. The main change is updating import paths from `@/` to `$lib/`.

---

## Objective

Migrate configuration files and constants from the Next.js project. These are pure TypeScript and require only path updates.

---

## Instructions

### Step 1: Create Config Directory

```bash
mkdir -p src/lib/config
```

### Step 2: Migrate App Config

**src/lib/config/app.ts:**
```typescript
import type { AppConfig } from "$lib/types";

export const APP_CONFIG: AppConfig = {
    name: "Shopify Order Processor",
    description: "Turn Chaos into Orders",
    url: "https://order-processor.pages.dev", // Update for Cloudflare Pages
    repository: {
        type: "git",
        url: "https://github.com/beyourahi/order-processor"
    },
    author: {
        name: "Rahi Khan",
        url: "https://github.com/beyourahi"
    }
};
```

### Step 3: Migrate Brands Config

**src/lib/config/brands.ts:**
```typescript
import { Courier } from "$lib/types";
import type { Brand } from "$lib/types";

/**
 * Authorized brands/users configuration
 * Each brand has an email allowlist for authorization
 */
export const BRANDS: Brand[] = [
    {
        name: "Rahi Khan",
        phone: "01700000000", // Replace with actual phone
        emails: ["youremail@gmail.com"], // Replace with actual email
        url: "https://github.com/beyourahi",
        courier: Courier.SteadFast,
        merchant_id: "12345" // Replace with actual merchant ID
    },
    {
        name: "EnScented",
        phone: "01700000001",
        emails: ["enscented@example.com"],
        url: "https://enscented.com",
        courier: Courier.SteadFast,
        merchant_id: "12346"
    },
    {
        name: "Aetheria",
        phone: "01700000002",
        emails: ["aetheria@example.com"],
        url: "https://aetheria.com",
        courier: Courier.Pathao,
        merchant_id: "12347"
    },
    {
        name: "Corvien",
        phone: "01700000003",
        emails: ["corvien@example.com"],
        url: "https://corvien.com",
        courier: Courier.Pathao,
        merchant_id: "12348"
    }
];

/**
 * Flattened list of all allowed email addresses
 * Used for quick authorization checks
 */
export const allowedEmails: string[] = BRANDS.flatMap(brand => brand.emails);

/**
 * Find brand by email address
 */
export const findBrandByEmail = (email: string): Brand | undefined => {
    return BRANDS.find(brand => brand.emails.includes(email));
};
```

### Step 4: Migrate Couriers Config

**src/lib/config/couriers.ts:**
```typescript
import type { CourierOption } from "$lib/types";

// Import logos - these will be in static/ directory
import pathaoLogo from "$lib/assets/pathao.png";
import steadfastLogo from "$lib/assets/steadfast.png";

/**
 * Available courier options for the picker
 * Only active couriers are included (coming soon couriers removed)
 */
export const COURIER_OPTIONS: CourierOption[] = [
    {
        value: "Pathao",
        label: "Pathao",
        logo: pathaoLogo
    },
    {
        value: "SteadFast",
        label: "SteadFast",
        logo: steadfastLogo
    }
];
```

**Note:** We need to create an assets directory for the logos. See Step 7.

### Step 5: Create Config Index

**src/lib/config/index.ts:**
```typescript
// App configuration
export { APP_CONFIG } from "./app";

// Brands configuration
export { BRANDS, allowedEmails, findBrandByEmail } from "./brands";

// Courier options
export { COURIER_OPTIONS } from "./couriers";
```

### Step 6: Create Constants Directory

```bash
mkdir -p src/lib/constants
```

### Step 7: Migrate File Constants

**src/lib/constants/files.ts:**
```typescript
/**
 * Output file configuration
 */
export const FILE_PREFIX = "formatted-orders";
export const FILE_EXTENSION = ".xlsx";

/**
 * Generate output filename
 */
export const generateFileName = (courierName: string): string => {
    return `${FILE_PREFIX}-${courierName.toLowerCase()}${FILE_EXTENSION}`;
};
```

### Step 8: Migrate Index Constants

**src/lib/constants/indexes.ts:**
```typescript
/**
 * Shopify export CSV column indexes
 * These map to specific columns in the Shopify order export
 */
export const SHOPIFY_EXPORT_INDEXES = {
    ORDER_NAME: 0,       // #13826
    EMAIL: 1,
    FINANCIAL_STATUS: 2,
    PAID_AT: 3,
    FULFILLMENT_STATUS: 4,
    FULFILLED_AT: 5,
    ACCEPTS_MARKETING: 6,
    CURRENCY: 7,
    SUBTOTAL: 8,
    SHIPPING: 9,
    TAXES: 10,
    TOTAL: 11,
    DISCOUNT_CODE: 12,
    DISCOUNT_AMOUNT: 13,
    SHIPPING_METHOD: 14,
    CREATED_AT: 15,
    LINEITEM_QTY: 16,
    LINEITEM_NAME: 17,
    LINEITEM_PRICE: 18,
    LINEITEM_COMPARE_PRICE: 19,
    LINEITEM_SKU: 20,
    LINEITEM_REQUIRES_SHIPPING: 21,
    LINEITEM_TAXABLE: 22,
    LINEITEM_FULFILLMENT_STATUS: 23,
    BILLING_NAME: 24,
    BILLING_STREET: 25,
    BILLING_ADDRESS1: 26,
    BILLING_ADDRESS2: 27,
    BILLING_COMPANY: 28,
    BILLING_CITY: 29,
    BILLING_ZIP: 30,
    BILLING_PROVINCE: 31,
    BILLING_COUNTRY: 32,
    BILLING_PHONE: 33,
    SHIPPING_NAME: 34,
    SHIPPING_STREET: 35,
    SHIPPING_ADDRESS: 36,
    SHIPPING_ADDRESS2: 37,
    SHIPPING_COMPANY: 38,
    SHIPPING_CITY: 39,
    SHIPPING_ZIP: 40,
    SHIPPING_PROVINCE: 41,
    SHIPPING_COUNTRY: 42,
    SHIPPING_PHONE: 43,
    NOTES: 44
} as const;

/**
 * SteadFast format column indexes
 */
export const STEADFAST_INDEXES = {
    NAME: 0,
    ADDRESS: 1,
    CITY: 2,
    PHONE: 3,
    AMOUNT: 4,
    NOTES: 5
} as const;

/**
 * Pathao format column indexes
 */
export const PATHAO_INDEXES = {
    ORDER_NO: 0,
    NAME: 1,
    PRODUCT: 2,
    ADDRESS: 3,
    CITY: 4,
    AMOUNT: 5,
    PHONE: 6
} as const;

/**
 * Array of indexes for data extraction - SteadFast
 */
export const STEADFAST_INDEXES_ARRAY = [34, 36, 39, 43, 11, 44] as const;

/**
 * Array of indexes for data extraction - Pathao
 */
export const PATHAO_INDEXES_ARRAY = [0, 34, 17, 36, 39, 11, 43] as const;

/**
 * Array of indexes for Shopify to SteadFast conversion
 */
export const SHOPIFY_STEADFAST_INDEXES_ARRAY = [34, 36, 43, 11, 44] as const;
```

### Step 9: Create Constants Index

**src/lib/constants/index.ts:**
```typescript
// File constants
export { FILE_PREFIX, FILE_EXTENSION, generateFileName } from "./files";

// CSV column indexes
export {
    SHOPIFY_EXPORT_INDEXES,
    STEADFAST_INDEXES,
    PATHAO_INDEXES,
    STEADFAST_INDEXES_ARRAY,
    PATHAO_INDEXES_ARRAY,
    SHOPIFY_STEADFAST_INDEXES_ARRAY
} from "./indexes";
```

### Step 10: Create Assets Directory for Logos

```bash
mkdir -p src/lib/assets
```

Copy the courier logos from the original project:

```bash
cp public/pathao.png src/lib/assets/
cp public/steadfast.png src/lib/assets/
```

Or update the couriers.ts to use static paths:

**Alternative src/lib/config/couriers.ts (using static paths):**
```typescript
import type { CourierOption } from "$lib/types";

/**
 * Available courier options for the picker
 */
export const COURIER_OPTIONS: CourierOption[] = [
    {
        value: "Pathao",
        label: "Pathao",
        logo: "/pathao.png"
    },
    {
        value: "SteadFast",
        label: "SteadFast",
        logo: "/steadfast.png"
    }
];
```

---

## Verification

```bash
# Type check
bun run check
```

Test imports in a component:

```svelte
<script lang="ts">
    import { APP_CONFIG, COURIER_OPTIONS, allowedEmails } from "$lib/config";
    import { FILE_PREFIX, SHOPIFY_EXPORT_INDEXES } from "$lib/constants";

    console.log(APP_CONFIG.name);
    console.log(COURIER_OPTIONS);
    console.log(allowedEmails);
</script>
```

---

## Files Created

- `src/lib/config/app.ts`
- `src/lib/config/brands.ts`
- `src/lib/config/couriers.ts`
- `src/lib/config/index.ts`
- `src/lib/constants/files.ts`
- `src/lib/constants/indexes.ts`
- `src/lib/constants/index.ts`
- `src/lib/assets/` (directory for logos)

---

## Changes from Original

| Original | SvelteKit | Reason |
|----------|-----------|--------|
| `@/config` | `$lib/config` | Path alias |
| `@/constants` | `$lib/constants` | Path alias |
| Next.js Image imports | Static paths or $lib/assets | Different asset handling |
| Coming soon couriers | Removed | Already cleaned up in original |

---

## Notes

- The brands.ts file should be updated with actual email addresses and phone numbers
- The courier logos will be served from the static directory
- All configuration is pure TypeScript and works identically in Svelte
- The `findBrandByEmail` helper is added for cleaner code in hooks
