# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SvelteKit application for processing Shopify order exports into courier-specific Excel formats (Pathao and SteadFast). Authorized users upload CSV files and download courier-ready files. Deployed to Cloudflare Workers.

## Commands

```bash
bun run dev           # Development server (Vite)
bun run build         # Production build
bun run preview       # Build + wrangler dev (local preview)
bun run deploy        # Build + deploy to Cloudflare Workers
bun run check         # TypeScript/Svelte type checking
bun run lint          # ESLint + Prettier checks
bun run cf-typegen    # Generate Cloudflare types
bun run db:migrate    # Run D1 database migrations
```

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5
- **Language**: TypeScript 5.9.3 (strict mode)
- **Styling**: Tailwind CSS 4.x
- **Authentication**: Better Auth with Cloudflare D1
- **Data Processing**: `xlsx`, `papaparse`
- **UI Components**: bits-ui (shadcn/svelte) + class-variance-authority
- **Deployment**: Cloudflare Workers with D1 database
- **Linting**: ESLint 9.x + Prettier with Svelte plugin

## Architecture

### Project Structure

```
src/
├── routes/                       # SvelteKit routes
│   ├── +layout.svelte           # Root layout
│   ├── +layout.server.ts        # Server-side layout data
│   ├── +page.svelte             # Home page
│   ├── +page.server.ts          # Server-side page data
│   ├── +error.svelte            # Error page
│   ├── login/                   # Login page
│   └── api/                     # API routes
│       └── logout/+server.ts    # Logout endpoint
├── lib/
│   ├── auth-client.ts           # Better Auth client
│   ├── components/              # Svelte components
│   │   ├── ui/                  # Reusable UI (Button, Footer, etc.)
│   │   └── features/            # Feature components
│   │       ├── order-processor.svelte
│   │       ├── upload.svelte
│   │       ├── download.svelte
│   │       ├── courier-picker.svelte
│   │       └── user.svelte
│   ├── config/                  # Application configuration
│   │   ├── index.ts             # Re-exports all config
│   │   ├── app.ts               # App metadata
│   │   ├── brands.ts            # Authorized brands/emails
│   │   └── couriers.ts          # Courier options with logos
│   ├── constants/               # Static constants
│   │   ├── index.ts             # Re-exports all constants
│   │   ├── files.ts             # File-related constants
│   │   └── indexes.ts           # CSV column indexes
│   ├── services/                # Business logic
│   │   ├── index.ts             # Re-exports all services
│   │   ├── courier-service.ts   # Main orchestrator
│   │   ├── data-processing.ts   # CSV preparation utilities
│   │   └── processors/          # Courier-specific processors
│   │       ├── pathao.ts
│   │       └── steadfast.ts
│   ├── server/                  # Server-only code
│   │   └── auth.ts              # Better Auth server config
│   ├── stores/                  # Svelte stores
│   │   └── app.ts               # Global app state
│   ├── hooks/                   # Custom hooks
│   │   └── use-current-user.ts  # User authentication hook
│   ├── types/                   # TypeScript definitions
│   │   ├── index.ts             # Re-exports all types
│   │   ├── courier.ts           # Order types, CourierProcessor interface
│   │   ├── user.ts              # User/Brand interfaces
│   │   ├── ui.ts                # Component prop types
│   │   └── config.ts            # Config types
│   └── utils/                   # Utility functions
│       └── index.ts             # cn() helper for Tailwind
├── hooks.server.ts              # SvelteKit server hooks (auth)
├── app.css                      # Global styles
├── app.d.ts                     # App type declarations
└── app.html                     # HTML template
```

### Data Processing Pipeline

1. **Upload**: CSV parsed via `papaparse`
2. **Detection**: `CourierService.isShopifyExport()` auto-detects Shopify format
3. **Preparation**: Data cleaned and columns extracted
    - `prepareSteadFastOrderData()` - Standard CSV format
    - `prepareShopifySteadFastOrderData()` - Shopify export format
    - `preparePathaoOrderData()` - Pathao format
4. **Processing**: Processor transforms to courier schema
5. **Export**: Excel file generated with `xlsx` library

### Service Architecture

```typescript
// Main orchestrator - routes to appropriate processor
CourierService.processOrders(courierType, rawData, user)

// Courier processors implement generic interface
interface CourierProcessor<T> {
    processOrders(data: string[][], user: UserInfo): T[];
}

// Processors
├── SteadFastProcessor → SteadFastOrder[]
└── PathaoProcessor → PathaoOrder[]
```

### Authentication Flow

- **Provider**: Better Auth with Google OAuth
- **Database**: Cloudflare D1 for session storage
- **Authorization**: Email allowlist in `$lib/config/brands.ts`
- **Session**: Server-side validation via `hooks.server.ts`

## Key Types

### Order Output Schemas

```typescript
// SteadFast courier format
interface SteadFastOrder {
    Invoice: string; // Merchant ID
    Name: string; // Customer name
    Address: string; // Full address
    Phone: string; // Normalized (starts with 1)
    Amount: string; // COD amount
    Note: string; // Instructions
    Lot: string; // Empty
    "Delivery Type": string; // "Home"
    "Contact Name": string; // Brand name
    "Contact Phone": string; // Brand phone
}

// Pathao courier format
interface PathaoOrder {
    "Order No": string;
    Name: string;
    Product: string;
    Price: string;
    Address: string;
    City: string;
    "Phone No": string;
}
```

### Phone Number Normalization (SteadFast)

The SteadFast processor normalizes Bangladesh phone numbers:

- Removes `+880` country code
- Strips leading zeros
- Ensures number starts with `1` (Bangladesh mobile format)

### User/Brand Types

```typescript
interface Brand {
    name: string;
    phone?: string;
    emails: string[]; // Allowed email addresses
    url: string;
    courier: Courier | null;
    merchant_id?: string;
}
```

## Path Aliases

```json
"$lib/*": ["./src/lib/*"]
```

## Environment Variables

```env
# Better Auth (Required)
BETTER_AUTH_SECRET=           # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:5173

# Google OAuth (Required)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Cloudflare Configuration

### D1 Database

- **Name**: `order_processor`
- **Binding**: `DB` (in wrangler.jsonc)

### wrangler.jsonc

```jsonc
{
    "name": "order-processor",
    "compatibility_date": "2024-12-01",
    "d1_databases": [
        {
            "binding": "DB",
            "database_name": "order_processor",
            "database_id": "..."
        }
    ]
}
```

## Svelte 5 Patterns

### State Management

```svelte
<script lang="ts">
    // Reactive state
    let value = $state("");

    // Derived values
    let doubled = $derived(value * 2);

    // Props
    let { user, onSubmit }: Props = $props();
</script>
```

### Stores

```typescript
// $lib/stores/app.ts
import { writable } from "svelte/store";

export const courierService = writable<string>("");
export const zoneHover = writable<boolean>(false);
```

## Common Tasks

### Adding a New Courier Service

1. Add enum value in `$lib/types/courier.ts`:

    ```typescript
    export enum Courier {
        SteadFast = "SteadFast",
        Pathao = "Pathao",
        NewCourier = "NewCourier" // Add here
    }
    ```

2. Create order interface and type guard in `$lib/types/courier.ts`

3. Add column indexes in `$lib/constants/indexes.ts`

4. Create processor in `$lib/services/processors/newcourier.ts`:

    ```typescript
    export class NewCourierProcessor implements CourierProcessor<NewCourierOrder> {
        processOrders(data: string[][], user: UserInfo): NewCourierOrder[] { ... }
    }
    ```

5. Export from `$lib/services/processors/index.ts`

6. Add preparation function in `$lib/services/data-processing.ts`

7. Register in `$lib/services/courier-service.ts`:

    ```typescript
    private static readonly processors = new Map([
        [Courier.NewCourier, new NewCourierProcessor()],
        // ...existing
    ]);
    ```

8. Add courier option in `$lib/config/couriers.ts` with logo

### Updating Allowed Users

Edit `$lib/config/brands.ts` and add email to the brand's `emails` array.

## Code Style

- Svelte 5 components with runes ($state, $derived, $props)
- Server-side data loading via +page.server.ts
- Tailwind CSS for styling (no inline styles)
- Use `cn()` from `$lib/utils` for class merging
- Proper TypeScript generics
- Document complex business logic with JSDoc comments
- Use barrel exports (`index.ts`) for clean imports
