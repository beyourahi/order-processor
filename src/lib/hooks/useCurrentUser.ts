import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { brands } from "@/config";
import type { CurrentUser } from "@/types";

/**
 * Custom hook to get current user information based on email
 * Maps authenticated user email to brand configuration for order processing
 */
export const useCurrentUser = (): CurrentUser | undefined => {
    const { user } = useKindeBrowserClient();

    if (!user?.email) return undefined;

    // Find the brand configuration that matches the authenticated user's email
    // This determines which merchant settings to use for order processing
    const brand = brands.find(brand => brand.emails.includes(user.email!));

    if (!brand) return undefined;

    // Return user data with brand-specific configuration
    // Uses spread operator to conditionally include optional fields
    return {
        name: brand.name,
        // Only include phone if brand has one configured
        ...(brand.phone !== undefined && { phone: brand.phone }),
        // Courier preference determines which processor to use
        courier: brand.courier,
        // Merchant ID is used for invoice generation (SteadFast)
        ...(brand.merchant_id !== undefined && { merchant_id: brand.merchant_id }),
        url: brand.url
    };
};
