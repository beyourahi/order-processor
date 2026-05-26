import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// Fallback for non-JS clients; the primary signout path is authClient.signOut().
// Cookie name MUST mirror `cookiePrefix` in $lib/server/auth.ts.

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
