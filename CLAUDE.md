# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SvelteKit application for processing Shopify order exports into SteadFast courier Excel format. Authorized users upload CSV files and download courier-ready files. Deployed to Cloudflare Workers.

## Commands

```bash
bun run dev           # Development server (Vite)
bun run build         # Production build
bun run preview       # Build + wrangler dev (local preview)
bun run deploy        # Build + deploy to Cloudflare Workers
bun run check         # TypeScript/Svelte type checking
bun run lint          # ESLint + Prettier checks
bun run cf-typegen    # Generate Cloudflare types

# Database Commands
bun run db:generate       # Generate migration from schema changes
bun run db:migrate:local  # Apply migrations to local D1
bun run db:migrate        # Apply migrations to remote D1 (production)
bun run db:push           # Push schema directly (requires D1 credentials)
bun run db:studio         # Open Drizzle Studio (requires D1 credentials)
```

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5
- **Language**: TypeScript 5.9.3 (strict mode)
- **Styling**: Tailwind CSS 4.x
- **Authentication**: Better Auth with Cloudflare D1
- **Database ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Data Processing**: `xlsx`, `papaparse`
- **UI Components**: bits-ui (shadcn/svelte) + class-variance-authority
- **Deployment**: Cloudflare Workers with D1 database
- **Linting**: ESLint 9.x + Prettier with Svelte plugin

## Database Migrations

### Schema-Driven Workflow

The project uses Drizzle Kit for schema-driven migrations. The schema is defined in TypeScript and migrations are generated automatically.

**Files:**

- `src/lib/server/schema.ts` - Drizzle ORM schema definition
- `drizzle.config.ts` - Drizzle Kit configuration
- `migrations/` - SQL migration files
- `migrations/meta/` - Drizzle Kit snapshots and journal

### Making Schema Changes

1. **Edit the schema** in `src/lib/server/schema.ts`:

    ```typescript
    // Add a new column
    export const users = sqliteTable("users", {
        // ... existing columns
        newField: text("new_field") // Add new column
    });
    ```

2. **Generate migration**:

    ```bash
    bun run db:generate
    ```

    This creates a new SQL file in `migrations/` (e.g., `0005_xxx.sql`)

3. **Review the generated SQL** before applying

4. **Apply migration locally**:

    ```bash
    bun run db:migrate:local
    ```

5. **Test the application** with `bun run dev`

6. **Apply to production**:

    ```bash
    bun run db:migrate
    ```

### Migration Best Practices

- **Never edit existing migrations** - Always generate new ones
- **Review generated SQL** before committing
- **Test locally first** using `db:migrate:local`
- **Keep migrations small** - One logical change per migration
- **Commit migrations with schema changes** - Keep them in sync

### Drizzle Kit Commands

| Command            | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `db:generate`      | Generate SQL migration from schema changes               |
| `db:migrate:local` | Apply migrations to local D1 database                    |
| `db:migrate`       | Apply migrations to production D1                        |
| `db:push`          | Push schema directly (dev only, requires D1 credentials) |
| `db:studio`        | Open Drizzle Studio GUI (requires D1 credentials)        |

### D1 Credentials (for push/studio)

For `db:push` and `db:studio` commands, set these environment variables:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=ae9e0e94-99a1-485f-9ed0-c42ad70c6094
CLOUDFLARE_D1_TOKEN=your_api_token
```

Get the API token from [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) with D1 Edit permissions.

### Known Issues

- **drizzle-kit 0.31.x hangs** - Using pinned version 0.30.0 due to [bug #4451](https://github.com/drizzle-team/drizzle-orm/issues/4451)

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
4. **Processing**: Processor transforms to courier schema
5. **Export**: Excel file generated with `xlsx` library

### Service Architecture

```typescript
// Main orchestrator - processes orders for SteadFast courier
CourierService.processOrders(courierType, rawData, user)

// Courier processors implement generic interface
interface CourierProcessor<T> {
    processOrders(data: string[][], user: UserInfo): T[];
}

// Processor
└── SteadFastProcessor → SteadFastOrder[]
```

### Authentication Flow

- **Provider**: Better Auth with Google OAuth
- **Database**: Cloudflare D1 for session storage
- **Authorization**: Email allowlist in `$lib/config/brands.ts`
- **Session**: Server-side validation via `hooks.server.ts`

## Key Types

### Order Output Schema

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

// Pre-selected to SteadFast as it's the only available courier
export const courierService = writable<string>("SteadFast");
export const hasMerchantId = writable<boolean>(false);
```

## Common Tasks

### Adding a New Courier Service

1. Add enum value in `$lib/types/courier.ts`:

    ```typescript
    export enum Courier {
        SteadFast = "SteadFast",
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
        [Courier.SteadFast, new SteadFastProcessor()],
        [Courier.NewCourier, new NewCourierProcessor()]
    ]);
    ```

8. Add courier option in `$lib/config/couriers.ts` with logo

9. Update store in `$lib/stores/app.ts` to remove pre-selection if multiple couriers exist

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
