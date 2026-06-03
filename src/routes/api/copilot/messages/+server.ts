import { json, error } from "@sveltejs/kit";
import { drizzle } from "drizzle-orm/d1";
import { getConversation } from "$lib/server/repositories/ai-conversations";
import { listMessages } from "$lib/server/repositories/ai-messages";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, platform, url }) => {
    if (!locals.user) error(401, { message: "Not authenticated" });
    if (!platform?.env?.DB) error(503, { message: "Database unavailable" });

    const conversationId = url.searchParams.get("conversationId");
    if (!conversationId) error(400, { message: "Missing conversationId" });

    // Ownership check before reading messages: getConversation scopes by user id,
    // so a foreign/unknown id 404s rather than leaking another user's history.
    const db = drizzle(platform.env.DB);
    const conversation = await getConversation(db, locals.user.id, conversationId);
    if (!conversation) error(404, { message: "Conversation not found" });

    const rows = await listMessages(db, conversationId, 500);
    return json(
        rows.map((r) => ({
            id: r.id,
            role: r.role,
            content: r.content,
            toolCalls: r.toolCalls,
            createdAt: r.createdAt.toISOString()
        }))
    );
};
