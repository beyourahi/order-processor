/**
 * Services barrel export
 * Re-exports all service modules for clean imports
 */

// Main service
export { CourierService } from "./courier-service";

// Processors
export { SteadFastProcessor, PathaoProcessor } from "./processors";

// Data processing utilities
export {
    removeDuplicatesAndExtractIndexes,
    extractInvoices,
    prepareSteadFastOrderData,
    preparePathaoOrderData,
    prepareShopifySteadFastOrderData,
    isShopifyExport
} from "./data-processing";
