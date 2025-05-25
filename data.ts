export enum Courier {
    SteadFast = "SteadFast",
    Pathao = "Pathao"
}

interface Brand {
    name: string;
    phone?: string;
    emails: string[];
    url: string;
    courier: Courier | null;
    merchant_id: string;
}

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
        emails: ["aetheriaselfcare@gmail.com"],
        url: "https://aetheriaselfcare.com",
        courier: Courier.SteadFast,
        merchant_id: "1436762"
    }
];

export const allowedEmails = [...brands.flatMap(brand => brand.emails)];
