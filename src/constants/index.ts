import type { CourierOption } from "../types";
import pathao from "../../public/pathao.png";
import steadFast from "../../public/steadfast.png";
import redx from "../../public/redx.png";
import sheba from "../../public/sheba.jpg";
import ecourier from "../../public/ecourier.webp";
import dhl from "../../public/dhl.png";
import fedex from "../../public/fedex.jpeg";

export const COURIER_OPTIONS: CourierOption[] = [
  { value: "Pathao", label: "Pathao", logo: pathao },
  { value: "SteadFast", label: "SteadFast", logo: steadFast },
  { value: "REDX", label: "REDX", logo: redx, coming_soon: true },
  { value: "Sheba", label: "Sheba", logo: sheba, coming_soon: true },
  { value: "eCourier", label: "eCourier", logo: ecourier, coming_soon: true },
  { value: "FedX", label: "FedX", logo: fedex, coming_soon: true },
  { value: "DHL", label: "DHL", logo: dhl, coming_soon: true }
];

// Data processing constants
export const STEADFAST_INDEXES = [34, 36, 39, 43, 11, 44];
export const PATHAO_INDEXES = [0, 34, 17, 36, 39, 11, 43];

// File naming constants
export const FILE_PREFIX = "formatted-orders";
export const FILE_EXTENSION = ".xlsx";