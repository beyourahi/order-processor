/**
 * Courier service configurations and UI options
 * Contains courier options with logos for available services
 */

import type { CourierOption } from "$lib/types";
import pathaoLogo from "$lib/assets/pathao.png";
import steadfastLogo from "$lib/assets/steadfast.png";

/**
 * Available courier options for the picker
 * Logos are imported from $lib/assets and processed by Vite
 */
export const COURIER_OPTIONS: CourierOption[] = [
    {
        value: "SteadFast",
        label: "SteadFast",
        logo: steadfastLogo
    },
    {
        value: "Pathao",
        label: "Pathao",
        logo: pathaoLogo
    }
];
