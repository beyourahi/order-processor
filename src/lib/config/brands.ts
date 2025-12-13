/**
 * Brand configurations and authorized users
 * Contains all brand-specific settings and email allowlists
 */

import { Courier } from "$lib/types";
import type { Brand } from "$lib/types";

/**
 * Configuration for all supported brands
 * Each brand has specific settings for order processing
 */
export const BRANDS: Brand[] = [
    {
        name: "Rahi Khan",
        phone: "1873146332",
        emails: ["beyourahi@gmail.com", "rahikhan360@gmail.com"],
        url: "https://beyourahi.com",
        courier: Courier.SteadFast,
        merchant_id: "69420"
    },
    {
        name: "EnScented",
        phone: "1948880753",
        emails: [
            "enscented.bd@gmail.com",
            "enscentedfragrance@gmail.com",
            "tasnimulhossain1410@gmail.com",
            "enscentedexecutives@gmail.com"
        ],
        url: "https://enscented.shop",
        courier: Courier.SteadFast,
        merchant_id: "330097"
    },
    {
        name: "Aetheria",
        phone: "1948880753",
        emails: ["aetheriaselfcare@gmail.com", "team@aetheriaselfcare.com"],
        url: "https://aetheriaselfcare.com",
        courier: Courier.SteadFast,
        merchant_id: "1436762"
    },
    {
        name: "Corvien",
        phone: "1312592710",
        emails: ["corvienco@gmail.com", "arifulashfi321@gmail.com"],
        url: "https://corvien.co",
        courier: Courier.SteadFast,
        merchant_id: "1618727"
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
