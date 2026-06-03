import { Courier, type CourierProcessor, type OrderType, type UserInfo } from "$lib/types";
import { prepareSteadFastOrderData, prepareShopifySteadFastOrderData, isShopifyExport } from "./data-processing";
import { SteadFastProcessor } from "./processors";

/**
 * Pipeline orchestrator: detect format → prepare rows → map to courier schema.
 * The `processors` registry is keyed by `Courier`; a new courier just
 * implements the generic `CourierProcessor<T>` interface and is added here.
 * All methods are static (no per-instance state).
 */
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

    // Throws on an unregistered courier — callers should only pass a Courier
    // that has a processor in the map above. Branches on auto-detected format:
    // Shopify exports take the dedup-by-order path, everything else the legacy
    // header+trailing-trim path (see data-processing.ts).
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
