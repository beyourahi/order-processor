import { Courier } from "./data";
import { PathaoProcessor } from "./lib/processors/pathao";
import { SteadFastProcessor } from "./lib/processors/steadfast";
import { prepareSteadFastOrderData, preparePathaoOrderData } from "./lib";

type OrderType = PathaoOrder | SteadFastOrder;

export class CourierService {
    private static processors = new Map<Courier, CourierProcessor<OrderType>>([
        [Courier.SteadFast, new SteadFastProcessor()],
        [Courier.Pathao, new PathaoProcessor()]
    ]);

    static processOrders(
        courierType: Courier,
        rawData: string[][],
        user: { name: string; phone: string; merchant_id: string }
    ): OrderType[] {
        const processor = this.processors.get(courierType);
        if (!processor) throw new Error(`No processor found for courier: ${courierType}`);

        const preparedData =
            courierType === Courier.SteadFast ? prepareSteadFastOrderData(rawData) : preparePathaoOrderData(rawData);

        return processor.processOrders(preparedData, user);
    }
}
