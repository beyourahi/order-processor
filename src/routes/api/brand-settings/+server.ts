import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { brandSettings } from "$lib/server/schema";
import type { BrandSettingsPayload } from "$lib/types";

/**
 * Fetch settings for the current authenticated user
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
    if (!locals.user) {
        error(401, { message: "Not authenticated" });
    }

    const userId = locals.user.id;
    const db = drizzle(platform!.env.DB);

    const settings = await db.select().from(brandSettings).where(eq(brandSettings.userId, userId)).get();

    return json({
        success: true,
        data: settings ?? {
            userId,
            contactName: null,
            contactPhone: null,
            merchantId: null
        }
    });
};

/**
 * Create or update settings for the current authenticated user
 */
export const POST: RequestHandler = async ({ locals, platform, request }) => {
    if (!locals.user) {
        error(401, { message: "Not authenticated" });
    }

    const userId = locals.user.id;
    const db = drizzle(platform!.env.DB);

    let body: BrandSettingsPayload;
    try {
        body = await request.json();
    } catch {
        error(400, { message: "Invalid JSON body" });
    }

    if (!body.merchantId || body.merchantId.trim().length === 0) {
        error(400, { message: "Merchant ID is required" });
    }

    const existing = await db.select().from(brandSettings).where(eq(brandSettings.userId, userId)).get();

    const now = new Date();

    if (existing) {
        await db
            .update(brandSettings)
            .set({
                contactName: body.contactName ?? null,
                contactPhone: body.contactPhone ?? null,
                merchantId: body.merchantId ?? null,
                updatedAt: now
            })
            .where(eq(brandSettings.userId, userId));
    } else {
        await db.insert(brandSettings).values({
            id: crypto.randomUUID(),
            userId,
            contactName: body.contactName ?? null,
            contactPhone: body.contactPhone ?? null,
            merchantId: body.merchantId ?? null,
            createdAt: now,
            updatedAt: now
        });
    }

    const updated = await db.select().from(brandSettings).where(eq(brandSettings.userId, userId)).get();

    return json({
        success: true,
        data: updated
    });
};
