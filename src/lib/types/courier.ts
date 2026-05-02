import type { UserInfo } from "./user";

export enum Courier {
    SteadFast = "SteadFast"
}

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

export type OrderType = SteadFastOrder;

export interface CourierProcessor<T> {
    processOrders(data: string[][], user: UserInfo): T[];
}

export interface CourierOption {
    value: Courier;
    label: string;
    logo: string;
}
