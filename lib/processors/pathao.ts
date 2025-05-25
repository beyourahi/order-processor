export class PathaoProcessor implements CourierProcessor<PathaoOrder> {
    processOrders(data: string[][], user: { name: string; phone: string; merchant_id: string }): PathaoOrder[] {
        return data.map(entry => ({
            "Item Type": "parcel",
            "Store Name": user.name,
            "Merchant Order Id": entry[0],
            "Recipient Name": entry[0],
            "Recipient Phone": entry[3],
            "Recipient City": entry[2],
            "Recipient Zone": "",
            "Recipient Area": "",
            "Recipient Address": entry[1],
            "Amount To Collect": entry[4],
            "Item Quantity": "",
            "Item Weight": "",
            "Item Description": "",
            "Special Instruction": entry[5] || ""
        }));
    }
}
