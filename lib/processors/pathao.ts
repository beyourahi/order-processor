export class PathaoProcessor implements CourierProcessor<PathaoOrder> {
    processOrders(data: string[][]): PathaoOrder[] {
        return data.map(entry => ({
            "Order No": entry[0],
            Name: entry[1],
            Product: entry[2],
            Price: entry[5],
            Address: entry[3],
            City: entry[4],
            "Phone No": entry[6]
        }));
    }
}
