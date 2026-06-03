import { redirect } from "@sveltejs/kit";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { brandSettings } from "$lib/server/schema";
import { listConversations } from "$lib/server/repositories/ai-conversations";
import type { BrandSettingsState } from "$lib/types";
import type { PersistedConversationSummary } from "$lib/ai/types";
import type { PageServerLoad } from "./$types";

// The redirect below is the real access gate for the app's only authed page —
// any authenticated Google user passes (warning #7). Brand settings + Copilot
// conversation summaries are read here so +page.svelte can hydrate the stores
// synchronously on mount; messages load lazily per-conversation via the API.
// When DB is absent (e.g. `bun run dev` without wrangler bindings) we degrade to
// empty defaults rather than failing the page.
export const load: PageServerLoad = async ({ locals, platform }) => {
    if (!locals.user) {
        redirect(303, "/login");
    }

    let settings: BrandSettingsState = {
        contactName: null,
        contactPhone: null,
        merchantId: null,
        selectedCourier: null
    };
    let conversations: PersistedConversationSummary[] = [];

    if (platform?.env?.DB) {
        const db = drizzle(platform.env.DB);
        const row = await db.select().from(brandSettings).where(eq(brandSettings.userId, locals.user.id)).get();
        if (row) {
            settings = {
                contactName: row.contactName,
                contactPhone: row.contactPhone,
                merchantId: row.merchantId,
                selectedCourier: row.selectedCourier
            };
        }
        const rows = await listConversations(db, locals.user.id, 50);
        conversations = rows.map((r) => ({
            id: r.id,
            title: r.title,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString()
        }));
    }

    return {
        user: locals.user,
        currentUser: locals.currentUser,
        brandSettings: settings,
        copilotConversations: conversations
    };
};
