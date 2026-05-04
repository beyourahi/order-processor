import { Courier, type CourierProcessor, type OrderType, type UserInfo } from "$lib/types";
import { prepareSteadFastOrderData, prepareShopifySteadFastOrderData, isShopifyExport } from "./data-processing";
import { SteadFastProcessor } from "./processors";

export class CourierService {
    private static readonly processors = new Map<Courier, CourierProcessor<OrderType>>([
        [Courier.SteadFast, new SteadFastProcessor()]
    ]);

    static isShopifyExport(rawData: string[][]): boolean {
        if (rawData.length === 0) return false;

        const header = rawData[0];
        if (!header) return false;

        return isShopifyExport(header);
    }

    static processOrders(courierType: Courier, rawData: string[][], user: UserInfo): OrderType[] {
        const processor = this.processors.get(courierType);
        if (!processor) {
            throw new Error(`No processor found for courier: ${courierType}`);
        }

        const preparedData = this.isShopifyExport(rawData)
            ? prepareShopifySteadFastOrderData(rawData)
            : prepareSteadFastOrderData(rawData);

        return processor.processOrders(preparedData, user);
    }
}
