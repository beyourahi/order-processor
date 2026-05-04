export interface BrandSettings {
    id: string;
    userId: string;
    contactName: string | null;
    contactPhone: string | null;
    merchantId: string | null;
    selectedCourier: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Subset of BrandSettings persisted in the client store and returned by
 * the page server load. `id`, `userId`, and timestamps live server-side.
 */
export interface BrandSettingsState {
    contactName: string | null;
    contactPhone: string | null;
    merchantId: string | null;
    selectedCourier: string | null;
}

/**
 * PATCH body shape for /api/brand-settings. Every field is optional; only
 * fields present in the body are updated. Empty body is accepted but a no-op.
 */
export interface BrandSettingsPatch {
    contactName?: string;
    contactPhone?: string;
    merchantId?: string;
    selectedCourier?: string;
}

export type SaveState = "idle" | "saving" | "saved" | "error";
