import { writable } from "svelte/store";

/**
 * Selected courier service store
 * Empty string means no courier selected
 *
 * Usage in components:
 * - Read: $courierService (auto-subscribes)
 * - Write: courierService.set("value")
 */
export const courierService = writable<string>("");

/**
 * Tracks whether SteadFast merchant ID is configured
 * Controls whether file upload is enabled for SteadFast courier
 *
 * Updated by: steadfast-settings.svelte
 * Read by: order-processor.svelte
 */
export const hasMerchantId = writable<boolean>(false);
