import { derived, writable } from "svelte/store";
import { brandSettings } from "./brand-settings";

export const courierService = writable<string>("SteadFast");

export const hasMerchantId = derived(brandSettings, ($s) => Boolean($s.merchantId && $s.merchantId.trim().length > 0));
