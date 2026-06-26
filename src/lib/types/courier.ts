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
