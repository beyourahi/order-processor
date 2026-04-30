/**
 * User and brand related types
 * Contains all types related to users and authentication
 */

// ==================== User Interfaces ====================

/**
 * User information required for order processing
 * Contains essential details needed by courier processors
 */
export interface UserInfo {
    name: string;
    phone: string;
    merchantId: string;
}

/**
 * Current user derived from auth session
 * Represents the authenticated user's identity
 */
export interface CurrentUser {
    name: string;
    email: string;
}
