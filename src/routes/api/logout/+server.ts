import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// Better Auth handles the main logout via authClient.signOut(); this is a server-side fallback.
// Cookie name must match cookiePrefix in auth.ts: "order-processor.session_token".

export const POST: RequestHandler = async ({ cookies }) => {
    try {
        cookies.delete("order-processor.session_token", { path: "/" });
        return json({ success: true });
    } catch (e) {
        return json({ success: false, error: e instanceof Error ? e.message : "Logout failed" }, { status: 500 });
    }
};

export const GET: RequestHandler = async ({ cookies }) => {
    try {
        cookies.delete("order-processor.session_token", { path: "/" });
    } catch (e) {
        console.error("[logout] Failed to delete session cookie on GET:", e);
    }

    redirect(303, "/login");
};
