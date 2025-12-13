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
