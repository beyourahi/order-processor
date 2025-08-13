import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { brands, type CurrentUser } from "@/config";

/**
 * Custom hook to get current user information based on email
 */
export const useCurrentUser = (): CurrentUser | undefined => {
    const { user } = useKindeBrowserClient();

    if (!user?.email) return undefined;

    const brand = brands.find(brand => brand.emails.includes(user.email!));

    if (!brand) return undefined;

    return {
        name: brand.name,
        ...(brand.phone !== undefined && { phone: brand.phone }),
        courier: brand.courier,
        ...(brand.merchant_id !== undefined && { merchant_id: brand.merchant_id }),
        url: brand.url
    };
};
