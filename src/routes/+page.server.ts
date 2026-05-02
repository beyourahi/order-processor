import { redirect } from "@sveltejs/kit";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { brandSettings } from "$lib/server/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, platform }) => {
    if (!locals.user) {
        redirect(303, "/login");
    }

    let settings: { contactName: string | null; contactPhone: string | null; merchantId: string | null } = {
        contactName: null,
        contactPhone: null,
        merchantId: null
    };

    if (platform?.env?.DB) {
        const db = drizzle(platform.env.DB);
        const row = await db.select().from(brandSettings).where(eq(brandSettings.userId, locals.user.id)).get();
        if (row) {
            settings = {
                contactName: row.contactName,
                contactPhone: row.contactPhone,
                merchantId: row.merchantId
            };
        }
    }

    return {
        user: locals.user,
        currentUser: locals.currentUser,
        brandSettings: settings
    };
};
