/**
 * Brand configurations and authorized users
 * Contains all brand-specific settings and email allowlists
 */

import { Courier } from "$lib/types";
import type { Brand } from "$lib/types";

/**
 * Configuration for all supported brands
 * Each brand has specific settings for order processing
 *
 * Note: contact_name, contact_phone, and merchant_id are now stored
 * in the database (brand_settings table) and editable via the UI.
 */
export const BRANDS: Brand[] = [
    {
        name: "Rahi Khan",
        emails: ["beyourahi@gmail.com", "rahikhan360@gmail.com"],
        url: "https://beyourahi.com",
        courier: Courier.SteadFast
    },
    {
        name: "EnScented",
        emails: [
            "enscented.bd@gmail.com",
            "enscentedfragrance@gmail.com",
            "tasnimulhossain1410@gmail.com",
            "enscentedexecutives@gmail.com"
        ],
        url: "https://enscented.shop",
        courier: Courier.SteadFast
    },
    {
        name: "Aetheria",
        emails: ["aetheriaselfcare@gmail.com", "team@aetheriaselfcare.com"],
        url: "https://aetheriaselfcare.com",
        courier: Courier.SteadFast
    },
    {
        name: "Corvien",
        emails: ["corvienco@gmail.com", "arifulashfi321@gmail.com"],
        url: "https://corvien.co",
        courier: Courier.SteadFast
    },
    {
        name: "Elegant Punjabi",
        emails: ["saifhossainsujal99@gmail.com"],
        url: "https://elegantpanjabi.com",
        courier: Courier.SteadFast
    }
];

/**
 * Flattened array of all allowed email addresses
 * Used for authentication and authorization checks
 */
export const allowedEmails: string[] = BRANDS.flatMap((brand) => brand.emails);

/**
 * Find brand by email address
 * @param email - Email to search for
 * @returns Brand if found, undefined otherwise
 */
export const findBrandByEmail = (email: string): Brand | undefined => {
    return BRANDS.find((brand) => brand.emails.includes(email));
};
