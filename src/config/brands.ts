/**
 * Brand configurations and authorized users
 * Contains all brand-specific settings and email allowlists
 */

import { Courier, type Brand } from "@/types";

/**
 * Configuration for all supported brands
 * Each brand has specific settings for order processing
 */
export const brands: Brand[] = [
    {
        name: "Rahi Khan",
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
export const allowedEmails = brands.flatMap(brand => brand.emails);
