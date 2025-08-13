# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Next.js with Turbo)
- **Build production**: `npm run build`
- **Start production**: `npm start`
- **Lint code**: `npm run lint`

## Architecture Overview

This is a Next.js 15 application that processes order data for multiple courier services (Pathao and SteadFast). The app is designed for authorized users to upload CSV files and download formatted Excel files compatible with specific courier platforms.

### Core Components

**Authentication & Authorization**
- Uses Kinde Auth for authentication (`@kinde-oss/kinde-auth-nextjs`)
- Email-based authorization system defined in `data.ts`
- Users must be on the allowed email list to access the application

**Data Processing Pipeline**
1. **Data Upload**: CSV files uploaded via `react-papaparse`
2. **Data Preparation**: Raw data is processed using functions in `lib/index.ts`
   - `prepareSteadFastOrderData()`: Extracts specific columns and removes duplicates
   - `preparePathaoOrderData()`: Filters and maps data for Pathao format
3. **Order Processing**: `CourierService` class routes data to appropriate processors
4. **Export**: Processed data exported as Excel files using `xlsx` library

**Processor Pattern**
- Abstract `CourierProcessor<T>` interface in `types.d.ts`
- Concrete implementations: `PathaoProcessor` and `SteadFastProcessor`
- Each processor transforms data to courier-specific format

### Key Files

- `service.ts`: Main `CourierService` class that orchestrates order processing
- `data.ts`: Contains brand configurations, allowed emails, and courier enums
- `lib/index.ts`: Data preparation utilities and helper functions
- `lib/processors/`: Courier-specific data transformation logic
- `components/order-processor.tsx`: Main upload/download UI component

### Data Flow

1. User uploads CSV file → `OrderProcessor` component
2. Raw data passed to `CourierService.processOrders()`
3. Data prepared using appropriate preparation function
4. Processed through courier-specific processor
5. Exported as Excel file with courier-specific filename

### Brand Management

Brands are configured in `data.ts` with:
- Name, phone, emails (for authorization)
- Associated courier service
- Merchant ID (used in SteadFast orders)

### UI Framework

- **Styling**: Tailwind CSS with custom configuration
- **Components**: Radix UI primitives with custom styling
- **Icons**: Radix UI icons
- **Fonts**: Geist font family