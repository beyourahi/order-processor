import { writable } from "svelte/store";

/**
 * Selected courier service store
 * Pre-selected to SteadFast as it's the only available courier
 *
 * Usage in components:
 * - Read: $courierService (auto-subscribes)
 * - Write: courierService.set("value")
 */
export const courierService = writable<string>("SteadFast");

/**
 * Tracks whether SteadFast merchant ID is configured
 * Controls whether file upload is enabled for SteadFast courier
 *
 * Updated by: steadfast-settings.svelte
 * Read by: order-processor.svelte
 */
export const hasMerchantId = writable<boolean>(false);
