import { writable } from "svelte/store";
import type { BrandSettings } from "$lib/types";

type StoredBrandSettings = Pick<BrandSettings, "contactName" | "contactPhone" | "merchantId">;

const empty: StoredBrandSettings = {
    contactName: null,
    contactPhone: null,
    merchantId: null
};

export const brandSettings = writable<StoredBrandSettings>(empty);
