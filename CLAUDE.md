# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 15 application for processing and formatting order data for multiple courier services (Pathao and SteadFast). Authorized users upload CSV files and download courier-specific Excel formats.

## Technology Stack

- **Framework**: Next.js 15.1.3 (App Router)
- **Runtime**: React 19.0.0
- **Language**: TypeScript 5.9.x with strict mode
- **Build System**: Turbopack (dev), Webpack (production)
- **Styling**: Tailwind CSS v4.0.0-beta.4
- **Authentication**: Kinde Auth (`@kinde-oss/kinde-auth-nextjs`)
- **Data Processing**: `xlsx`, `react-papaparse`
- **UI Components**: Radix UI primitives
- **Package Manager**: npm/bun compatible

## Development Commands

```bash
npm run dev        # Start development server with Turbopack
npm run build      # Build production bundle
npm start          # Start production server
npm run lint       # Run ESLint checks
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── process/page.tsx   # Order processing page
│   └── fonts/             # Font files (Geist family)
├── components/            # React components
│   ├── ui/               # Reusable UI components (Radix-based)
│   ├── order-processor.tsx # Main file upload/processing component
│   ├── footer.tsx        # Footer component
│   └── header.tsx        # Header with navigation
├── lib/                   # Utility functions
│   ├── context/          # React context definitions
│   └── hooks/            # Custom React hooks
├── config.ts            # Application configuration and constants
├── services.ts          # Service orchestrator, processors, and utilities
├── types.ts             # All TypeScript types, interfaces, and enums
└── tailwind.css         # Global Tailwind CSS styles
```

## Architecture Details

### Authentication & Authorization

- **Provider**: Kinde Auth with server-side and client-side support
- **Authorization**: Email-based allowlist system in `config.ts`
- **Protected Routes**: `/process` requires authentication
- **Session Management**: Server-side session validation

### Data Processing Pipeline

1. **Upload Stage**: CSV files parsed using `react-papaparse`
2. **Preparation Stage**: Data cleaned and validated in `services.ts`
   - `prepareSteadFastOrderData()`: Extracts columns, removes duplicates
   - `preparePathaoOrderData()`: Filters and maps to Pathao format
3. **Processing Stage**: `CourierService` class orchestrates processing
4. **Export Stage**: Excel files generated with `xlsx` library

### Service Architecture

All services and processors are consolidated in `services.ts`:

```typescript
// Utility functions
removeDuplicatesAndExtractIndexes(data, indexes)
extractInvoices(rawData)
prepareSteadFastOrderData(rawData)
preparePathaoOrderData(rawData)

// Processor implementations
CourierProcessor<T> interface
├── PathaoProcessor
│   └── process(preparedData): PathaoOrder[]
└── SteadFastProcessor
    └── process(preparedData): SteadFastOrder[]

// Main service orchestrator
CourierService
├── processOrders(brand, rawData)
├── Routes to appropriate processor
└── Returns processed Excel buffer
```

### Key Configuration Files

**config.ts**
- Application metadata (name, description, URL)
- Repository information
- Author details
- Used for meta tags and app configuration

**Note**: Brand configurations and constants previously in `data.ts` are now integrated into the main application flow

## TypeScript Configuration

### Centralized Type System
All types, interfaces, and enums are consolidated in `src/types.ts`:
- **Order Types**: `PathaoOrder`, `SteadFastOrder`, `OrderType`
- **User Types**: `UserInfo`, `CurrentUser`, `Brand`
- **UI Types**: `ButtonProps`, `DownloadProps`, `ErrorProps`, `CourierOption`
- **Application Types**: `AppContextType`, `CSVReaderProps`, `AppConfig`
- **Processing Types**: `CourierProcessor<T>` generic interface
- **Utility Types**: `DeepPartial<T>`, `RequireFields<T, K>`, `ArrayElement<T>`
- **Type Guards**: `isPathaoOrder()`, `isSteadFastOrder()`
- **Constants**: `STEADFAST_INDEXES`, `PATHAO_INDEXES`

### Compiler Options
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **Strict Mode**: Enabled with all checks
- **Path Aliases**:
  ```json
  "@/*": ["./src/*"]
  "@/components/*": ["./src/components/*"]
  "@/lib/*": ["./src/lib/*"]
  "@/providers/*": ["./src/providers/*"]
  "@/types": ["./src/types.ts"]
  ```

### Type Safety
- Strict null checks
- No implicit any
- Exact optional property types
- No unused locals/parameters
- VerbatimModuleSyntax for type-only imports

## Tailwind CSS v4 Configuration

### Custom Configuration
- **Theme Extensions**: Custom colors, animations
- **Important Selector**: `#__next`
- **Content Paths**: All TypeScript/JavaScript files in src/
- **Plugin Architecture**: Forms, typography, animate plugins

### Design Tokens
- **Colors**: Tailwind v4 color system with custom semantic tokens
- **Typography**: Geist font family (Sans and Mono)
- **Spacing**: Default Tailwind scale
- **Animations**: Custom animations for UI feedback

## Environment Variables

Required environment variables for production:

```env
# Kinde Auth (Required)
KINDE_CLIENT_ID=
KINDE_CLIENT_SECRET=
KINDE_ISSUER_URL=
KINDE_SITE_URL=
KINDE_POST_LOGOUT_REDIRECT_URL=
KINDE_POST_LOGIN_REDIRECT_URL=

# Optional
NODE_ENV=production
```

## Next.js 15 Configuration

### App Router Features
- Server Components by default
- Streaming and Suspense
- Parallel and intercepted routes support
- Metadata API for SEO

### Performance Optimizations
- Turbopack for development (faster HMR)
- Image optimization with next/image
- Font optimization with next/font
- Automatic code splitting

### Security Headers
Configured in `next.config.ts`:
- Strict Transport Security
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- Permissions Policy

## Data Models

### RawOrderItem (Input)
```typescript
{
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  recipient_area: string
  cod_amount: string
  instructions?: string
  product_name?: string
  invoice?: string
}
```

### PathaoOrder (Output)
```typescript
{
  "Store ID": string
  "Merchant Order ID": string | null
  "Recipient Name": string
  "Recipient Phone": string
  "Recipient Address": string
  "Recipient City": string
  "Recipient Zone": string
  "Recipient Area": string
  "Delivery Type": "48"
  "Actual Product Price": string
  "Instruction": string
  "Cash Collection Amount": string
  "Product Name": string
}
```

### SteadFastOrder (Output)
```typescript
{
  invoice: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  cod_amount: number
  instructions: string
}
```

## UI Component System

### Base Components (src/components/ui/)
- Button, Input, Label, Badge
- Card, Alert, Avatar
- Select, Tabs, Toast
- All built on Radix UI primitives

### Component Patterns
- Compound components with context
- Forwardref for all interactive components
- Consistent variant system using class-variance-authority
- Accessibility-first approach

## Testing & Quality

### Linting
- ESLint with Next.js recommended config
- TypeScript ESLint parser
- Auto-fix on save in development

### Type Checking
- Strict TypeScript configuration
- Build-time type validation
- IDE integration for real-time feedback

## Deployment Considerations

### Build Output
- Static files in `.next/static`
- Server files in `.next/server`
- Standalone mode available for containerization

### Performance
- Automatic static optimization
- ISR (Incremental Static Regeneration) ready
- Edge runtime compatible

### Monitoring
- Built-in Next.js analytics support
- Error boundary implementation
- Client-side error tracking ready

## Common Tasks

### Adding a New Courier Service
1. Add new courier enum value in `types.ts`
2. Create processor class in `services.ts`
3. Implement `CourierProcessor<T>` interface
4. Update `CourierService` in `services.ts`
5. Add brand configuration in `config.ts`

### Updating Allowed Users
1. Edit `brands` array in `config.ts`
2. Add email addresses to the brand's `emails` array
3. Deploy changes

### Modifying Order Formats
1. Update type definitions in `types.ts`
2. Modify processor logic in `services.ts`
3. Update preparation functions in `services.ts`
4. Test with sample CSV files

## Important Notes

- Always check authentication before processing orders
- Validate CSV data structure before processing
- Handle duplicate orders appropriately
- Maintain backward compatibility with existing Excel formats
- Use proper TypeScript types for all data transformations
- Follow Next.js 15 best practices for App Router
- Utilize React 19 features where applicable
- Keep security headers updated
- Monitor bundle size with Webpack Bundle Analyzer
- Use Turbopack for faster development builds

## Code Style Guidelines

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use server components where possible
- Implement proper error boundaries
- Follow ESLint rules
- Use Tailwind CSS classes for styling
- Avoid inline styles
- Keep components small and focused
- Use proper TypeScript generics
- Document complex business logic