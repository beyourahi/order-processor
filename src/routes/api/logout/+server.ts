import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/**
 * Logout API endpoint.
 *
 * POST - Clear session cookie and return success JSON
 * GET - Clear session cookie and redirect to login page
 *
 * Note: Better Auth handles the main logout via authClient.signOut(),
 * but this endpoint provides a fallback for programmatic logout
 * or cases where you need a server-side redirect.
 */

export const POST: RequestHandler = async ({ cookies }) => {
    // Clear session cookie
    cookies.delete("better-auth.session_token", { path: "/" });

    return json({ success: true });
};

export const GET: RequestHandler = async ({ cookies }) => {
    // Clear session cookie
    cookies.delete("better-auth.session_token", { path: "/" });

    // Redirect to login after logout
    redirect(303, "/login");
};
