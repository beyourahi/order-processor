/**
 * Courier service types and interfaces
 * Contains all types related to courier services and order processing
 */

import type { UserInfo } from "./user";

// ==================== Courier Services ====================

/**
 * Supported courier services
 */
export enum Courier {
    SteadFast = "SteadFast"
}

// ==================== Order Types ====================

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
 * Union type for all order types
 */
export type OrderType = SteadFastOrder;

// ==================== Processing Interfaces ====================

/**
 * Generic courier processor interface
 * Each courier service must implement this interface
 * @template T - The specific order type (SteadFastOrder)
 */
export interface CourierProcessor<T> {
    processOrders(data: string[][], user: UserInfo): T[];
}

/**
 * Courier option for dropdown/picker UI components
 */
export interface CourierOption {
    value: string;
    label: string;
    logo: string;
}

// ==================== Type Guards ====================

/**
 * Type guard to check if an order is a SteadFast order
 */
export const isSteadFastOrder = (order: unknown): order is SteadFastOrder => {
    return typeof order === "object" && order !== null && "Invoice" in order && "Delivery Type" in order;
};
