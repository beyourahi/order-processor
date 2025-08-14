/**
 * Consolidated type definitions for the Order Processor application
 * All types, interfaces, and enums from the entire codebase are defined here
 */

import { type VariantProps } from "class-variance-authority";
import { type ClassValue } from "clsx";
import { type NextRequest } from "next/server";
import { type NextConfig } from "next";
import { type PropsWithChildren } from "react";
import { type buttonVariants } from "@/components/ui/button";

// ==================== Courier Services ====================

/**
 * Enum for supported courier services
 */
export enum Courier {
    SteadFast = "SteadFast",
    Pathao = "Pathao"
}

// ==================== Order Types ====================

/**
 * Interface for SteadFast courier orders
 * Represents the data structure for orders processed through SteadFast
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
 * Interface for Pathao courier orders
 * Represents the data structure for orders processed through Pathao
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
 * Union type for all order types
 * Can be either a Pathao order or a SteadFast order
 */
export type OrderType = PathaoOrder | SteadFastOrder;

// ==================== Processing Interfaces ====================

/**
 * Generic interface for courier processors
 * Each courier service must implement this interface
 * @template T - The specific order type (PathaoOrder or SteadFastOrder)
 */
export interface CourierProcessor<T> {
    processOrders(data: string[][], user: UserInfo): T[];
}

// ==================== User & Brand Interfaces ====================

/**
 * User information interface
 * Contains essential user details for order processing
 */
export interface UserInfo {
    name: string;
    phone: string;
    merchant_id: string;
}

/**
 * Current user interface with optional properties
 * Represents the authenticated user's information
 */
export interface CurrentUser {
    name: string;
    phone?: string;
    courier: Courier | null;
    merchant_id?: string;
    url?: string;
}

/**
 * Brand configuration interface
 * Defines the structure for brand-specific settings
 */
export interface Brand {
    name: string;
    phone?: string;
    emails: string[];
    url: string;
    courier: Courier | null;
    merchant_id?: string;
}

// ==================== UI Component Interfaces ====================

/**
 * Courier option interface for UI components
 * Used in select dropdowns and other UI elements
 */
export interface CourierOption {
    value: string;
    label: string;
    logo: any;
    coming_soon?: boolean;
}

/**
 * Application context type for state management
 * Defines the shape of the global application context
 */
export interface AppContextType {
    courierService: string;
    setCourierService: (courier: string) => void;
    CSVReader: any;
    zoneHover: boolean;
    setZoneHover: (hover: boolean) => void;
}

/**
 * CSV Reader props interface
 * Properties for the CSV file reader component
 */
export interface CSVReaderProps {
    getRootProps: () => Record<string, any>;
    acceptedFile: File | null;
}

/**
 * Download component props
 * Properties for the download functionality component
 */
export interface DownloadProps {
    acceptedFile: File;
}

/**
 * Error boundary props
 * Properties for error handling components
 */
export interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Button component props
 * Extended properties for custom button components
 */
export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

// ==================== Configuration Types ====================

/**
 * Application metadata interface
 * Core application configuration details
 */
export interface AppConfig {
    name: string;
    description: string;
    url: string;
    repository: {
        url: string;
        type: string;
    };
    author: {
        name: string;
        email: string;
        url: string;
    };
}

// ==================== Type Guards ====================

/**
 * Type guard to check if an order is a Pathao order
 */
export function isPathaoOrder(order: OrderType): order is PathaoOrder {
    return 'Order No' in order && 'Phone No' in order;
}

/**
 * Type guard to check if an order is a SteadFast order
 */
export function isSteadFastOrder(order: OrderType): order is SteadFastOrder {
    return 'Invoice' in order && 'Contact Phone' in order;
}

// ==================== Utility Types ====================

/**
 * Makes all properties of T optional recursively
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Makes specific properties of T required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extracts the type of array elements
 */
export type ArrayElement<ArrayType extends readonly unknown[]> = 
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// ==================== Constants & Index Types ====================

/**
 * Column indexes for SteadFast CSV data extraction
 */
export const STEADFAST_INDEXES = {
    INVOICE: 0,
    NAME: 3,
    PHONE: 4,
    ADDRESS: 5,
    AMOUNT: 9,
    INSTRUCTIONS: 10
} as const;

/**
 * Column indexes for Pathao CSV data extraction
 */
export const PATHAO_INDEXES = {
    NAME: 3,
    PHONE: 4,
    ADDRESS: 5,
    AREA: 6,
    AMOUNT: 9,
    INSTRUCTIONS: 10,
    PRODUCT: 11
} as const;

/**
 * Type for the indexes to ensure type safety
 */
export type SteadFastIndexes = typeof STEADFAST_INDEXES;
export type PathaoIndexes = typeof PATHAO_INDEXES;

// ==================== Re-exports for External Types ====================

export type { 
    ClassValue,
    NextRequest,
    NextConfig,
    PropsWithChildren,
    VariantProps
};