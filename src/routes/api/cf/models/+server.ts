import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { drizzle } from "drizzle-orm/d1";
import { loadCloudflareConfig, resolveCloudflareCreds } from "$lib/server/ai/cloudflare-config";
import { listChatModels, type CfModel } from "$lib/server/ai/run-rest";
import { describeCloudflareError } from "$lib/server/ai/errors";

/**
 * GET /api/cf/models — the function-calling chat models on the user's connected
 * Cloudflare account, for the settings model picker. This tool has NO KV binding,
 * so the list is fetched LIVE on every call (no cache). `?refresh=1` is accepted
 * for parity with the settings UI but is a no-op here. Always the USER's models.
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
    if (!locals.user) {
        error(401, { message: "Not authenticated" });
    }
    if (!platform?.env?.DB) {
        error(503, { message: "Database unavailable" });
    }

    const db = drizzle(platform.env.DB);
    const cfg = await loadCloudflareConfig(db, locals.user.id);
    if (!cfg.accountId) {
        return json({ models: [] as CfModel[], connected: false });
    }

    const key = platform.env.TOKEN_ENCRYPTION_KEY;
    if (!key) {
        return json({ models: [] as CfModel[], connected: false });
    }

    const resolved = await resolveCloudflareCreds(key, cfg).catch(() => null);
    if (!resolved) {
        return json({ models: [] as CfModel[], connected: false });
    }

    try {
        const models = await listChatModels(resolved.creds);
        return json({ models, connected: true, cached: false });
    } catch (e) {
        return json({ models: [] as CfModel[], connected: true, error: describeCloudflareError(e) });
    }
};
