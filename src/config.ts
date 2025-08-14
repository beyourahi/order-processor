import pathao from "@/public/pathao.png";
import steadFast from "@/public/steadfast.png";
import redx from "@/public/redx.png";
import sheba from "@/public/sheba.jpg";
import ecourier from "@/public/ecourier.webp";
import dhl from "@/public/dhl.png";
import fedex from "@/public/fedex.jpeg";

// ================== TYPES ==================

export interface SteadFastOrder {
    Invoice: string;
    Name: string;
    Address: string;
    Phone: string;
    Amount: string;
    Note: string;
    Lot: string;
    "Delivery Type": string;
    "Contact Name": string;
    "Contact Phone": string;
}

export interface PathaoOrder {
    "Order No": string;
    Name: string;
    Product: string;
    Price: string;
    Address: string;
    City: string;
    "Phone No": string;
}

export type OrderType = PathaoOrder | SteadFastOrder;

export interface CourierProcessor<T> {
    processOrders(data: string[][], user: UserInfo): T[];
}

export interface UserInfo {
    name: string;
    phone: string;
    merchant_id: string;
}

export interface CurrentUser {
    name: string;
    phone?: string;
    courier: Courier | null;
    merchant_id?: string;
    url?: string;
}

export enum Courier {
    SteadFast = "SteadFast",
    Pathao = "Pathao"
}

export interface Brand {
    name: string;
    phone?: string;
    emails: string[];
    url: string;
    courier: Courier | null;
    merchant_id?: string;
}

export interface CourierOption {
    value: string;
    label: string;
    logo: any;
    coming_soon?: boolean;
}

export interface AppContextType {
    courierService: string;
    setCourierService: (courier: string) => void;
    CSVReader: any;
    zoneHover: boolean;
    setZoneHover: (hover: boolean) => void;
}

export interface CSVReaderProps {
    getRootProps: () => Record<string, any>;
    acceptedFile: File | null;
}

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

// Data processing constants
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
        courier: Courier.Pathao,
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
        emails: ["aetheriaselfcare@gmail.com"],
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
