# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 application for processing Shopify order exports into courier-specific Excel formats (Pathao and SteadFast). Authorized users upload CSV files and download courier-ready files.

## Commands

```bash
npm run dev        # Development server with Turbopack (default in Next.js 16)
npm run build      # Production build
npm start          # Start production server
npm run lint       # ESLint checks
```

## Tech Stack

- **Framework**: Next.js 16.0.10 (App Router) with React Compiler
- **Runtime**: React 19.2.3
- **Language**: TypeScript 5.9.3 (strict mode)
- **Styling**: Tailwind CSS 4.1.18 with PostCSS
- **Authentication**: Kinde Auth (`@kinde-oss/kinde-auth-nextjs`)
- **Data Processing**: `xlsx`, `react-papaparse`
- **UI Components**: Radix UI primitives + class-variance-authority
- **Linting**: ESLint 9.x + Prettier with Tailwind plugin

## Architecture

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/auth/[kindeAuth]/    # Kinde auth route
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page
│   ├── pages.tsx                # Process page component
│   ├── providers.tsx            # Context providers
│   ├── error.tsx                # Error boundary
│   ├── loading.tsx              # Loading state
│   └── not-found.tsx            # 404 page
├── components/                   # React components
│   ├── ui/                      # Reusable UI (Button, Footer, etc.)
│   ├── order-processor.tsx      # Main processing component
│   ├── upload.tsx               # CSV upload component
│   ├── download.tsx             # Excel download component
│   └── courier-picker.tsx       # Courier selection dropdown
├── config/                       # Application configuration
│   ├── index.ts                 # Re-exports all config
│   ├── app.ts                   # App metadata
│   ├── brands.ts                # Authorized brands/emails
│   └── couriers.ts              # Courier options with logos
├── constants/                    # Static constants
│   ├── index.ts                 # Re-exports all constants
│   ├── files.ts                 # File-related constants
│   └── indexes.ts               # CSV column indexes
├── services/                     # Business logic
│   ├── index.ts                 # Re-exports all services
│   ├── courier-service.ts       # Main orchestrator
│   ├── data-processing.ts       # CSV preparation utilities
│   └── processors/              # Courier-specific processors
│       ├── index.ts             # Re-exports processors
│       ├── pathao.ts
│       └── steadfast.ts
├── types/                        # TypeScript definitions
│   ├── index.ts                 # Re-exports all types
│   ├── courier.ts               # Order types, CourierProcessor interface
│   ├── user.ts                  # User/Brand interfaces
│   ├── ui.ts                    # Component prop types
│   └── config.ts                # Config types
└── lib/
    ├── utils.ts                 # cn() helper for Tailwind
    ├── context/                 # React context
    │   └── AppContext.tsx       # Global app state
    └── hooks/                   # Custom hooks
        └── useCurrentUser.ts    # User authentication hook
```

### Data Processing Pipeline

1. **Upload**: CSV parsed via `react-papaparse`
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

### Constants Architecture

```typescript
// constants/indexes.ts - CSV column mappings
export const SHOPIFY_EXPORT_INDEXES = {
    ORDER_NAME: 0,      // #13826
    EMAIL: 1,
    TOTAL: 11,
    SHIPPING_NAME: 34,
    SHIPPING_ADDRESS: 36,
    SHIPPING_PHONE: 43,
    NOTES: 44
} as const;

// Array-based for data extraction
export const STEADFAST_INDEXES_ARRAY = [34, 36, 39, 43, 11, 44];
export const PATHAO_INDEXES_ARRAY = [0, 34, 17, 36, 39, 11, 43];
export const SHOPIFY_STEADFAST_INDEXES_ARRAY = [34, 36, 43, 11, 44];
```

### Courier Options

```typescript
// config/couriers.ts
COURIER_OPTIONS = [
    { value: "Pathao", label: "Pathao", logo: pathao },
    { value: "SteadFast", label: "SteadFast", logo: steadFast },
    // Coming soon:
    { value: "REDX", label: "REDX", coming_soon: true },
    { value: "Sheba", label: "Sheba", coming_soon: true },
    { value: "eCourier", label: "eCourier", coming_soon: true },
    { value: "FedX", label: "FedX", coming_soon: true },
    { value: "DHL", label: "DHL", coming_soon: true }
];
```

### Authentication Flow

- **Provider**: Kinde Auth (server + client support)
- **Authorization**: Email allowlist in `config/brands.ts`
- **Session**: Server-side validation via `getKindeServerSession()`

## Key Types

### Order Output Schemas

```typescript
// SteadFast courier format
interface SteadFastOrder {
    Invoice: string;           // Merchant ID
    Name: string;              // Customer name
    Address: string;           // Full address
    Phone: string;             // Normalized (starts with 1)
    Amount: string;            // COD amount
    Note: string;              // Instructions
    Lot: string;               // Empty
    "Delivery Type": string;   // "Home"
    "Contact Name": string;    // Brand name
    "Contact Phone": string;   // Brand phone
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
    emails: string[];         // Allowed email addresses
    url: string;
    courier: Courier | null;
    merchant_id?: string;
}
```

## Path Aliases

```json
"@/*": ["./src/*"]
"@/components/*": ["./src/components/*"]
"@/lib/*": ["./src/lib/*"]
"@/app/*": ["./src/app/*"]
"@/config": ["./src/config"]
"@/services": ["./src/services"]
```

## Environment Variables

```env
# Kinde Auth (Required)
KINDE_CLIENT_ID=
KINDE_CLIENT_SECRET=
KINDE_ISSUER_URL=
KINDE_SITE_URL=
KINDE_POST_LOGOUT_REDIRECT_URL=
KINDE_POST_LOGIN_REDIRECT_URL=

# Optional
NEXT_PUBLIC_APP_URL=
ANALYZE=true  # Enable bundle analyzer
```

## Configuration Notes

### Next.js 16 Features

- **React Compiler**: Enabled (`reactCompiler: true`)
- **Turbopack**: Default for development
- **Package Import Optimization**: Radix UI packages optimized
- **Console Removal**: Production builds remove console.log (except errors)
- **Image Optimization**: AVIF/WebP formats

### Security Headers

Configured in `next.config.ts`:
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` with preload
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restricting camera/mic/geolocation
- `X-DNS-Prefetch-Control: on`

### TypeScript Strict Settings

- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`
- `verbatimModuleSyntax: true`

## Utility Functions

```typescript
// lib/utils.ts - Tailwind class merging
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => {
    return twMerge(clsx(inputs));
};
```

## Common Tasks

### Adding a New Courier Service

1. Add enum value in `types/courier.ts`:
   ```typescript
   export enum Courier {
       SteadFast = "SteadFast",
       Pathao = "Pathao",
       NewCourier = "NewCourier"  // Add here
   }
   ```

2. Create order interface and type guard in `types/courier.ts`

3. Add column indexes in `constants/indexes.ts`

4. Create processor in `services/processors/newcourier.ts`:
   ```typescript
   export class NewCourierProcessor implements CourierProcessor<NewCourierOrder> {
       processOrders(data: string[][], user: UserInfo): NewCourierOrder[] { ... }
   }
   ```

5. Export from `services/processors/index.ts`

6. Add preparation function in `services/data-processing.ts`

7. Register in `services/courier-service.ts`:
   ```typescript
   private static readonly processors = new Map([
       [Courier.NewCourier, new NewCourierProcessor()],
       // ...existing
   ]);
   ```

8. Add courier option in `config/couriers.ts` with logo

### Updating Allowed Users

Edit `config/brands.ts` and add email to the brand's `emails` array.

### Modifying Column Indexes

Edit `constants/indexes.ts` - indexes map to Shopify export CSV columns.

### Adding Shopify Export Support for New Courier

1. Add column mapping in `constants/indexes.ts`
2. Create preparation function in `services/data-processing.ts`
3. Update detection in `CourierService.isShopifyExport()` if needed
4. Add routing logic in `CourierService.processOrders()`

## Code Style

- Functional components with hooks
- Server Components where possible
- Tailwind CSS for styling (no inline styles)
- Use `cn()` for class merging
- Proper TypeScript generics
- Document complex business logic with JSDoc comments
- Use barrel exports (`index.ts`) for clean imports
