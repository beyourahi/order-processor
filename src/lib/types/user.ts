/**
 * User and brand related types
 * Contains all types related to users, authentication, and brand configurations
 */

import type { Courier } from "./courier";

// ==================== User & Brand Interfaces ====================

/**
 * User information required for order processing
 * Contains essential details needed by courier processors
 */
export interface UserInfo {
    name: string;
    phone: string;
    merchant_id: string;
}

/**
 * Current user derived from auth and brand config
 * Represents the authenticated user's information with optional fields
 */
export interface CurrentUser {
    name: string;
    phone?: string;
    courier: Courier | null;
    merchant_id?: string;
    url?: string;
}

/**
 * Brand configuration for authorized users
 * Defines the structure for brand-specific settings and allowed emails
 */
export interface Brand {
    name: string;
    phone?: string;
    emails: string[];
    url: string;
    courier: Courier | null;
    merchant_id?: string;
}
