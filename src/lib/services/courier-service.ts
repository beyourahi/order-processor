/**
 * Main courier service orchestrator
 * Coordinates between different courier processors and data preparation functions
 */

import { Courier, type CourierProcessor, type OrderType, type UserInfo } from "$lib/types";
import {
    prepareSteadFastOrderData,
    preparePathaoOrderData,
    prepareShopifySteadFastOrderData,
    isShopifyExport
} from "./data-processing";
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
     * Detect if the CSV is a Shopify export based on header columns
     */
    static isShopifyExport(rawData: string[][]): boolean {
        if (rawData.length === 0) return false;

        const header = rawData[0];
        if (!header) return false;

        return isShopifyExport(header);
    }

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

        let preparedData: string[][];

        if (courierType === Courier.SteadFast) {
            // Check if it's a Shopify export and use appropriate processing
            preparedData = this.isShopifyExport(rawData)
                ? prepareShopifySteadFastOrderData(rawData)
                : prepareSteadFastOrderData(rawData);
        } else {
            preparedData = preparePathaoOrderData(rawData);
        }

        return processor.processOrders(preparedData, user);
    }
}
