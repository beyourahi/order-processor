/**
 * Main courier service orchestrator
 * Coordinates between different courier processors and data preparation functions
 */

import { Courier, type CourierProcessor, type OrderType, type UserInfo } from "@/types";
import { prepareSteadFastOrderData, preparePathaoOrderData } from "./data-processing";
import { PathaoProcessor, SteadFastProcessor } from "./processors";

// ================== COURIER SERVICE ==================

/**
 * Main courier service class
 * Handles routing orders to appropriate processors and coordinating the processing workflow
 */
export class CourierService {
    private static readonly processors = new Map<Courier, CourierProcessor<OrderType>>([
        [Courier.SteadFast, new SteadFastProcessor()],
        [Courier.Pathao, new PathaoProcessor()]
    ]);

    /**
     * Process orders for a specific courier type
     * @param courierType - The courier service to process orders for
     * @param rawData - Raw CSV data from the uploaded file
     * @param user - User information for order processing
     * @returns Processed orders ready for export
     */
    static processOrders(courierType: Courier, rawData: string[][], user: UserInfo): OrderType[] {
        const processor = this.processors.get(courierType);
        if (!processor) {
            throw new Error(`No processor found for courier: ${courierType}`);
        }

        const preparedData =
            courierType === Courier.SteadFast ? prepareSteadFastOrderData(rawData) : preparePathaoOrderData(rawData);

        return processor.processOrders(preparedData, user);
    }
}