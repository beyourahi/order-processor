export interface BrandSettings {
    id: string;
    userId: string;
    contactName: string | null;
    contactPhone: string | null;
    merchantId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface BrandSettingsPayload {
    contactName?: string;
    contactPhone?: string;
    merchantId: string;
}
