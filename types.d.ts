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
    "Order No": string;
    Name: string;
    Product: string;
    Price: string;
    Address: string;
    City: string;
    "Phone No": string;
}

interface CourierProcessor<T> {
    processOrders(data: string[][], user: { name: string; phone: string; merchant_id: string }): T[];
}
