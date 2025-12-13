# 06 - Types Migration

## Prerequisites

- `01-project-setup.md` through `05-better-auth-setup.md` completed

## Next Prompt

- `07-config-constants-migration.md`

---

## MCP Servers to Use

Before implementing this prompt, use these MCP servers for accurate documentation:

| MCP Server      | Usage                                                                      |
| --------------- | -------------------------------------------------------------------------- |
| **better-auth** | Use `search` for Better Auth type definitions (User, Session types)        |
| **svelte**      | Use `get-documentation` for SvelteKit `app.d.ts` type declaration patterns |

### Recommended MCP Queries

```
better-auth MCP:
- search: "TypeScript types User Session"
- search: "type definitions"

svelte MCP:
- get-documentation: "types", "app.d.ts"
- get-documentation: "typescript"
```

---

## Objective

Migrate TypeScript type definitions from the Next.js project to the SvelteKit structure. Most types remain unchanged as they are pure TypeScript.

---

## Instructions

### Step 1: Create Types Directory

```bash
mkdir -p src/lib/types
```

### Step 2: Migrate Courier Types

**src/lib/types/courier.ts:**

```typescript
/**
 * Supported courier services
 */
export enum Courier {
    SteadFast = "SteadFast",
    Pathao = "Pathao"
}

/**
 * SteadFast order format for Excel export
 */
export interface SteadFastOrder {
    Invoice: string;
    Name: string;
    Address: string;
    Phone: string;
    Amount: string;
    Note: string;
    Lot: string;
    "Delivery Type": string;
    "Contact Name": string;
    "Contact Phone": string;
}

/**
 * Pathao order format for Excel export
 */
export interface PathaoOrder {
    "Order No": string;
    Name: string;
    Product: string;
    Price: string;
    Address: string;
    City: string;
    "Phone No": string;
}

/**
 * Generic courier processor interface
 */
export interface CourierProcessor<T> {
    processOrders(data: string[][], user: UserInfo): T[];
}

/**
 * User info required for order processing
 */
export interface UserInfo {
    name: string;
    phone: string;
    merchant_id: string;
}

/**
 * Courier option for dropdown/picker
 */
export interface CourierOption {
    value: string;
    label: string;
    logo: string;
}

/**
 * Type guard for PathaoOrder
 */
export const isPathaoOrder = (order: unknown): order is PathaoOrder => {
    return typeof order === "object" && order !== null && "Order No" in order && "Phone No" in order;
};

/**
 * Type guard for SteadFastOrder
 */
export const isSteadFastOrder = (order: unknown): order is SteadFastOrder => {
    return typeof order === "object" && order !== null && "Invoice" in order && "Delivery Type" in order;
};
```

### Step 3: Migrate User Types

**src/lib/types/user.ts:**

```typescript
import type { Courier } from "./courier";

/**
 * Brand configuration for authorized users
 */
export interface Brand {
    name: string;
    phone?: string;
    emails: string[];
    url: string;
    courier: Courier | null;
    merchant_id?: string;
}

/**
 * Current user derived from auth and brand config
 */
export interface CurrentUser {
    name: string;
    phone?: string;
    courier: Courier | null;
    merchant_id?: string;
    url?: string;
}

/**
 * User info for order processing
 */
export interface UserInfo {
    name: string;
    phone: string;
    merchant_id: string;
}
```

### Step 4: Migrate Config Types

**src/lib/types/config.ts:**

```typescript
/**
 * Application configuration
 */
export interface AppConfig {
    name: string;
    description: string;
    url: string;
    repository: {
        type: string;
        url: string;
    };
    author: {
        name: string;
        url: string;
    };
}

/**
 * Deep partial type utility
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Require specific fields utility
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Array element type utility
 */
export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
```

### Step 5: Create UI Types (Svelte-specific)

**src/lib/types/ui.ts:**

```typescript
import type { Snippet } from "svelte";

/**
 * Props for file drop zone
 */
export interface DropZoneProps {
    onDrop: (files: FileList) => void;
    accept?: string;
    disabled?: boolean;
}

/**
 * Props for download component
 */
export interface DownloadProps {
    fileName: string;
    fileSize: number;
}

/**
 * Error boundary props
 */
export interface ErrorProps {
    error: Error;
    reset: () => void;
}

/**
 * CSV parse result from Papa Parse
 */
export interface CSVParseResult {
    data: string[][];
    errors: Array<{
        type: string;
        code: string;
        message: string;
        row?: number;
    }>;
    meta: {
        delimiter: string;
        linebreak: string;
        aborted: boolean;
        truncated: boolean;
        cursor: number;
    };
}

/**
 * App store state
 */
export interface AppState {
    courierService: string;
    zoneHover: boolean;
    acceptedFile: File | null;
}
```

### Step 6: Create Index Export

**src/lib/types/index.ts:**

```typescript
// Courier types
export * from "./courier";
export type { Courier, SteadFastOrder, PathaoOrder, CourierProcessor, CourierOption } from "./courier";

// User types
export * from "./user";
export type { Brand, CurrentUser, UserInfo } from "./user";

// Config types
export * from "./config";
export type { AppConfig, DeepPartial, RequireFields, ArrayElement } from "./config";

// UI types
export * from "./ui";
export type { DropZoneProps, DownloadProps, ErrorProps, CSVParseResult, AppState } from "./ui";
```

### Step 7: Update app.d.ts with Better Auth Types

**src/app.d.ts:**

```typescript
/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

import type { CurrentUser } from "$lib/types";

declare global {
    namespace App {
        interface Locals {
            user: {
                id: string;
                email: string;
                name: string;
                image?: string | null;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            session: {
                id: string;
                userId: string;
                expiresAt: Date;
                token: string;
                createdAt: Date;
                updatedAt: Date;
                ipAddress?: string | null;
                userAgent?: string | null;
            } | null;
            currentUser: CurrentUser | null;
        }
        interface Platform {
            env: {
                DB: D1Database;
                BETTER_AUTH_SECRET: string;
                BETTER_AUTH_URL: string;
                GOOGLE_CLIENT_ID: string;
                GOOGLE_CLIENT_SECRET: string;
            };
            cf: CfProperties;
            ctx: ExecutionContext;
        }
        interface PageData {
            user: Locals["user"];
            session: Locals["session"];
            currentUser: CurrentUser | null;
        }
    }
}

export {};
```

---

## Verification

```bash
# Type check - should pass with no errors
bun run check
```

---

## Files Created

- `src/lib/types/courier.ts`
- `src/lib/types/user.ts`
- `src/lib/types/config.ts`
- `src/lib/types/ui.ts`
- `src/lib/types/index.ts`
- `src/app.d.ts` (updated)

---

## Changes from Original

| Original             | SvelteKit             | Reason                      |
| -------------------- | --------------------- | --------------------------- |
| `@/types`            | `$lib/types`          | SvelteKit path alias        |
| `CSVReaderProps`     | `CSVParseResult`      | Different library API       |
| React-specific types | Svelte-specific types | Framework change            |
| `ButtonProps`        | Removed               | Defined in component module |

---

## Import Examples

```typescript
// Import all types
import type { Courier, SteadFastOrder, CurrentUser } from "$lib/types";

// Import specific enum
import { Courier } from "$lib/types";

// Import type guards
import { isPathaoOrder, isSteadFastOrder } from "$lib/types";
```

---

## Notes

- Most types are framework-agnostic and transfer directly
- The `Courier` enum is used both as a type and a value (runtime)
- Type guards work the same way in Svelte
- UI types are adapted for Svelte's patterns (Snippets instead of ReactNode)
- The `UserInfo` interface is duplicated in courier.ts and user.ts for convenience (matching original)
