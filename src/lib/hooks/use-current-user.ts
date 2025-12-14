import { findBrandByEmail } from "$lib/config";
import type { CurrentUser } from "$lib/types";

/**
 * Get current user configuration based on authenticated email
 *
 * This function replaces the React useCurrentUser hook.
 * Instead of being a hook, it's a pure function that can be called
 * from server-side code (hooks.server.ts) to derive the CurrentUser
 * from the authenticated user's email.
 *
 * The CurrentUser contains brand-specific configuration needed for
 * order processing (courier preference).
 *
 * Note: contact_name, contact_phone, and merchant_id are now stored
 * in the database and fetched via the /api/brand-settings endpoint.
 *
 * @param email - The authenticated user's email address
 * @returns CurrentUser object with brand details, or null if not found/authorized
 */
export const getCurrentUser = (email: string | undefined): CurrentUser | null => {
    if (!email) return null;

    const brand = findBrandByEmail(email);

    if (!brand) return null;

    return {
        name: brand.name,
        courier: brand.courier,
        ...(brand.url !== undefined && { url: brand.url })
    };
};

/**
 * Check if an email is authorized to use the application
 *
 * Used for authorization checks - an email is authorized if it
 * belongs to a configured brand in the allowlist.
 *
 * @param email - Email address to check
 * @returns true if the email is in the brand allowlist
 */
export const isEmailAuthorized = (email: string | undefined): boolean => {
    if (!email) return false;
    return findBrandByEmail(email) !== undefined;
};
