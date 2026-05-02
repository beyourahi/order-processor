import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { brandSettings } from "$lib/server/schema";
import type { BrandSettingsPayload } from "$lib/types";

/**
 * Asserts that the current request is authenticated.
 * Returns the user object if authenticated, otherwise throws a 401 error.
 */
function requireAuth(locals: App.Locals) {
    if (!locals.user) {
        error(401, { message: "Not authenticated" });
    }
    return locals.user;
}

/**
 * Fetch settings for the current authenticated user
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
    const user = requireAuth(locals);

    if (!platform?.env?.DB) {
        error(503, { message: "Database unavailable" });
    }

    const db = drizzle(platform.env.DB);
    const settings = await db.select().from(brandSettings).where(eq(brandSettings.userId, user.id)).get();

    return json({
        success: true,
        data: settings ?? {
            userId: user.id,
            contactName: null,
            contactPhone: null,
            merchantId: null
        }
    });
};

const ALLOWED_BODY_KEYS = new Set<string>(["contactName", "contactPhone", "merchantId"]);

/**
 * Create or update settings for the current authenticated user
 */
export const POST: RequestHandler = async ({ locals, platform, request }) => {
    const user = requireAuth(locals);

    if (!platform?.env?.DB) {
        error(503, { message: "Database unavailable" });
    }

    const db = drizzle(platform.env.DB);

    let rawBody: unknown;
    try {
        rawBody = await request.json();
    } catch {
        error(400, { message: "Invalid JSON body" });
    }

    // Validate body shape: must be a plain object with only expected string fields
    if (typeof rawBody !== "object" || rawBody === null || Array.isArray(rawBody)) {
        error(400, { message: "Invalid request body" });
    }

    const bodyObj = rawBody as Record<string, unknown>;
    for (const key of Object.keys(bodyObj)) {
        if (!ALLOWED_BODY_KEYS.has(key)) {
            error(400, { message: "Invalid request body" });
        }
        if (bodyObj[key] !== undefined && typeof bodyObj[key] !== "string") {
            error(400, { message: "Invalid request body" });
        }
    }

    const body = rawBody as BrandSettingsPayload;

    if (!body.merchantId || body.merchantId.trim().length === 0) {
        error(400, { message: "Merchant ID is required" });
    }

    const userId = user.id;
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
