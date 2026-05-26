// Courier picker options (label + logo per Courier enum entry).
// Add a new courier here AND register its processor in courier-service.ts.
import { Courier, type CourierOption } from "$lib/types";
import steadfastLogo from "$lib/assets/steadfast.png";

export const COURIER_OPTIONS: CourierOption[] = [
    {
        value: Courier.SteadFast,
        label: "SteadFast",
        logo: steadfastLogo
    }
];
