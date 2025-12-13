/**
 * Courier service configurations and UI options
 * Contains courier options with logos for available services
 */

import type { CourierOption } from "$lib/types";

/**
 * Available courier options for the picker
 * Logos are served from the static directory
 */
export const COURIER_OPTIONS: CourierOption[] = [
    {
        value: "Pathao",
        label: "Pathao",
        logo: "/pathao.png"
    },
    {
        value: "SteadFast",
        label: "SteadFast",
        logo: "/steadfast.png"
    }
];
