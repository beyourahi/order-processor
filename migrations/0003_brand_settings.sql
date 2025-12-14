-- Migration: Add brand_settings table for user-editable contact info
-- Data is shared across all users of the same brand

CREATE TABLE IF NOT EXISTS brand_settings (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL UNIQUE,
    contact_name TEXT,
    contact_phone TEXT,
    merchant_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for fast lookups by brand name
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_settings_brand_name
ON brand_settings(brand_name);
