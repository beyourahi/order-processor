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
 * Represents the authenticated user's information
 *
 * Note: contact_name, contact_phone, and merchant_id are now stored
 * in the database (brand_settings table) and fetched separately.
 */
export interface CurrentUser {
    name: string;
    courier: Courier | null;
    url?: string;
}

/**
 * Brand configuration for authorized users
 * Defines the structure for brand-specific settings and allowed emails
 *
 * Note: contact info (phone, merchant_id) is now stored in the database
 * and managed via the SteadFast settings UI.
 */
export interface Brand {
    name: string;
    emails: string[];
    url: string;
    courier: Courier | null;
}
