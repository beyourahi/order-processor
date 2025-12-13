import { writable } from "svelte/store";

/**
 * App-level stores for shared state management
 *
 * These stores replace React Context and provide reactive state
 * that can be accessed from any component via the $ prefix.
 *
 * Usage in components:
 * - Read: $courierService (auto-subscribes)
 * - Write: courierService.set("value")
 * - Update: courierService.update(v => newValue)
 */

/**
 * Selected courier service
 * Empty string means no courier selected
 */
export const courierService = writable<string>("");

/**
 * Drag-drop zone hover state
 * Used to show visual feedback during file drag
 */
export const zoneHover = writable<boolean>(false);

/**
 * Currently accepted/uploaded file
 * Set when a valid CSV file is dropped or selected
 */
export const acceptedFile = writable<File | null>(null);

/**
 * Reset all app state to initial values
 * Call this when user logs out or needs a fresh start
 */
export const resetAppState = (): void => {
    courierService.set("");
    zoneHover.set(false);
    acceptedFile.set(null);
};
