import type { UserInfo } from "./user";

export enum Courier {
    SteadFast = "SteadFast"
}

// Keys map 1:1 to SteadFast's xlsx import column headers (spaces included), so
// each row object serialises directly to a worksheet row via SheetJS. All
// values are strings — the courier sheet has no typed cells.
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

// Extension seam: each courier implements this to map raw CSV rows to its own
// order shape. Register new implementations in courier-service.ts.
export interface CourierProcessor<T> {
    processOrders(data: string[][], user: UserInfo): T[];
}

export interface CourierOption {
    value: Courier;
    label: string;
    logo: string;
}
