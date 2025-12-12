/**
 * User and brand related types
 * Contains all types related to users, authentication, and brand configurations
 */

import type { Courier } from "./courier";

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
