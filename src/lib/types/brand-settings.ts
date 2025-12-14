/**
 * Brand settings types for editable contact information
 * Data is shared across all users of the same brand
 */

/**
 * Brand settings stored in database
 */
export interface BrandSettings {
    id: string;
    brandName: string;
    contactName: string | null;
    contactPhone: string | null;
    merchantId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Payload for creating/updating brand settings
 */
export interface BrandSettingsPayload {
    contactName?: string;
    contactPhone?: string;
    merchantId?: string;
}

/**
 * API response for brand settings
 */
export interface BrandSettingsResponse {
    success: boolean;
    data?: BrandSettings | BrandSettingsDefaults;
    error?: string;
}

/**
 * Default values returned when no settings exist
 */
export interface BrandSettingsDefaults {
    brandName: string;
    contactName: null;
    contactPhone: null;
    merchantId: null;
}
