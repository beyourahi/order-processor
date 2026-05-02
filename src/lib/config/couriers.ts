/**
 * Courier service configurations and UI options
 * Contains courier options with logos for available services
 */

import { Courier, type CourierOption } from "$lib/types";
import steadfastLogo from "$lib/assets/steadfast.png";

export const COURIER_OPTIONS: CourierOption[] = [
    {
        value: Courier.SteadFast,
        label: "SteadFast",
        logo: steadfastLogo
    }
];
