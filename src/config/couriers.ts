/**
 * Courier service configurations and UI options
 * Contains courier options with logos and availability status
 */

import type { CourierOption } from "@/types";

// Courier logo imports
import pathao from "@/public/pathao.png";
import steadFast from "@/public/steadfast.png";
import redx from "@/public/redx.png";
import sheba from "@/public/sheba.jpg";
import ecourier from "@/public/ecourier.webp";
import dhl from "@/public/dhl.png";
import fedex from "@/public/fedex.jpeg";

/**
 * Configuration for all courier options displayed in the UI
 * Includes both active and upcoming courier services
 */
export const COURIER_OPTIONS: CourierOption[] = [
    { value: "Pathao", label: "Pathao", logo: pathao },
    { value: "SteadFast", label: "SteadFast", logo: steadFast },
    { value: "REDX", label: "REDX", logo: redx, coming_soon: true },
    { value: "Sheba", label: "Sheba", logo: sheba, coming_soon: true },
    { value: "eCourier", label: "eCourier", logo: ecourier, coming_soon: true },
    { value: "FedX", label: "FedX", logo: fedex, coming_soon: true },
    { value: "DHL", label: "DHL", logo: dhl, coming_soon: true }
];
