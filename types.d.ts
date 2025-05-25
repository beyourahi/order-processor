interface SteadFastOrder {
    Invoice: string;
    Name: string;
    "Contact Name": string;
    "Contact Phone": string;
    Address: string;
    Phone: string;
    Amount: string;
    Note: string;
}

interface PathaoOrder {
    "Item Type": string;
    "Store Name": string;
    "Merchant Order Id": string;
    "Recipient Name": string;
    "Recipient Phone": string;
    "Recipient City": string;
    "Recipient Zone": string;
    "Recipient Area": string;
    "Recipient Address": string;
    "Amount To Collect": string;
    "Item Quantity": string;
    "Item Weight": string;
    "Item Description": string;
    "Special Instruction": string;
}

interface CourierProcessor<T> {
    processOrders(data: string[][], user: { name: string; phone: string; merchant_id: string }): T[];
}
