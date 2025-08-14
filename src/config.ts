import pathao from "@/public/pathao.png";
import steadFast from "@/public/steadfast.png";
import redx from "@/public/redx.png";
import sheba from "@/public/sheba.jpg";
import ecourier from "@/public/ecourier.webp";
import dhl from "@/public/dhl.png";
import fedex from "@/public/fedex.jpeg";

import {
    Courier,
    type Brand,
    type CourierOption,
    type AppConfig
} from "@/types";

// Re-export types for backward compatibility
export * from "@/types";

// ================== CONSTANTS ==================

export const COURIER_OPTIONS: CourierOption[] = [
    { value: "Pathao", label: "Pathao", logo: pathao },
    { value: "SteadFast", label: "SteadFast", logo: steadFast },
    { value: "REDX", label: "REDX", logo: redx, coming_soon: true },
    { value: "Sheba", label: "Sheba", logo: sheba, coming_soon: true },
    { value: "eCourier", label: "eCourier", logo: ecourier, coming_soon: true },
    { value: "FedX", label: "FedX", logo: fedex, coming_soon: true },
    { value: "DHL", label: "DHL", logo: dhl, coming_soon: true }
];

// Data processing constants (deprecated - use from types.ts instead)
export const STEADFAST_INDEXES = [34, 36, 39, 43, 11, 44];
export const PATHAO_INDEXES = [0, 34, 17, 36, 39, 11, 43];

// File naming constants
export const FILE_PREFIX = "formatted-orders";
export const FILE_EXTENSION = ".xlsx";

// ================== BRANDS ==================

export const brands: Brand[] = [
    {
        name: "Rahi Khan",
        emails: ["beyourahi@gmail.com", "rahikhan360@gmail.com"],
        url: "https://beyourahi.com",
        courier: Courier.SteadFast,
        merchant_id: "69420"
    },
    {
        name: "ENSCENTED",
        phone: "01948880753",
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
        name: "AETHERIA",
        phone: "01948880753",
        emails: ["aetheriaselfcare@gmail.com", "team@aetheriaselfcare.com"],
        url: "https://aetheriaselfcare.com",
        courier: Courier.SteadFast,
        merchant_id: "1436762"
    },
    {
        name: "DOHORA",
        emails: ["dohoras3@gmail.com"],
        url: "https://dohoralifestyle.com",
        courier: Courier.Pathao
    }
];

export const allowedEmails = brands.flatMap(brand => brand.emails);

// ================== APP CONFIG ==================

export const appConfig: AppConfig = {
    name: "Order Processor",
    description: "Process and format orders for multiple courier services",
    url: "https://order-processor.vercel.app",
    repository: {
        url: "https://github.com/beyourahi/order-processor",
        type: "git"
    },
    author: {
        name: "Rahi Khan",
        email: "beyourahi@gmail.com",
        url: "https://beyourahi.com"
    }
};
