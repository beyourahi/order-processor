/**
 * Courier service types and interfaces
 * Contains all types related to courier services and order processing
 */

import type { UserInfo } from "./user";

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

// ==================== Type Guards ====================

/**
 * Type guard to check if an order is a Pathao order
 */
export function isPathaoOrder(order: OrderType): order is PathaoOrder {
    return "Order No" in order && "Phone No" in order;
}

/**
 * Type guard to check if an order is a SteadFast order
 */
export function isSteadFastOrder(order: OrderType): order is SteadFastOrder {
    return "Invoice" in order && "Contact Phone" in order;
}
