/**
 * Courier service configurations and UI options
 * Contains courier options with logos for available services
 */

import type { CourierOption } from "@/types";

// Courier logo imports
import pathao from "@/public/pathao.png";
import steadFast from "@/public/steadfast.png";

/**
 * Configuration for all courier options displayed in the UI
 */
export const COURIER_OPTIONS: CourierOption[] = [
    { value: "Pathao", label: "Pathao", logo: pathao },
    { value: "SteadFast", label: "SteadFast", logo: steadFast }
];
