/**
 * Brand Settings API endpoint
 *
 * GET - Fetch settings for current user's brand
 * POST - Create or update brand settings
 *
 * Settings are shared across all users of the same brand.
 */

import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { brandSettings } from "$lib/server/schema";
import type { BrandSettingsPayload } from "$lib/types";

/**
 * Fetch brand settings for the current user's brand
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
    // Check authentication
    if (!locals.user) {
        error(401, { message: "Not authenticated" });
    }

    // Check authorization (must have currentUser from brand config)
    if (!locals.currentUser) {
        error(403, { message: "Not authorized" });
    }

    const brandName = locals.currentUser.name;
    const db = drizzle(platform!.env.DB);

    // Query brand settings
    const settings = await db.select().from(brandSettings).where(eq(brandSettings.brandName, brandName)).get();

    // Return settings or empty defaults
    return json({
        success: true,
        data: settings ?? {
            brandName,
            contactName: null,
            contactPhone: null,
            merchantId: null
        }
    });
};

/**
 * Create or update brand settings
 */
export const POST: RequestHandler = async ({ locals, platform, request }) => {
    // Check authentication
    if (!locals.user) {
        error(401, { message: "Not authenticated" });
    }

    // Check authorization
    if (!locals.currentUser) {
        error(403, { message: "Not authorized" });
    }

    const brandName = locals.currentUser.name;
    const db = drizzle(platform!.env.DB);

    // Parse and validate request body
    let body: BrandSettingsPayload;
    try {
        body = await request.json();
    } catch {
        error(400, { message: "Invalid JSON body" });
    }

    // Validate required fields
    if (!body.merchantId || body.merchantId.trim().length === 0) {
        error(400, { message: "Merchant ID is required" });
    }

    // Check if settings exist
    const existing = await db.select().from(brandSettings).where(eq(brandSettings.brandName, brandName)).get();

    const now = new Date();

    if (existing) {
        // Update existing
        await db
            .update(brandSettings)
            .set({
                contactName: body.contactName ?? null,
                contactPhone: body.contactPhone ?? null,
                merchantId: body.merchantId ?? null,
                updatedAt: now
            })
            .where(eq(brandSettings.brandName, brandName));
    } else {
        // Insert new
        await db.insert(brandSettings).values({
            id: crypto.randomUUID(),
            brandName,
            contactName: body.contactName ?? null,
            contactPhone: body.contactPhone ?? null,
            merchantId: body.merchantId ?? null,
            createdAt: now,
            updatedAt: now
        });
    }

    // Fetch updated settings
    const updated = await db.select().from(brandSettings).where(eq(brandSettings.brandName, brandName)).get();

    return json({
        success: true,
        data: updated
    });
};
