import type { Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { createAuth } from "$lib/server/auth";
import { getCurrentUser } from "$lib/hooks";

/**
 * SvelteKit server hook for Better Auth integration.
 *
 * This hook:
 * 1. Creates the auth instance with the D1 database from platform context
 * 2. Fetches the current session and populates event.locals
 * 3. Delegates auth route handling to svelteKitHandler
 *
 * The `building` check is critical - during SvelteKit build phase,
 * platform bindings (D1) are not available, so we skip auth logic.
 */
export const handle: Handle = async ({ event, resolve }) => {
    // Skip auth during SvelteKit build phase (prerendering, etc.)
    if (building) {
        return resolve(event);
    }

    // Get D1 database from Cloudflare platform context
    const db = event.platform?.env?.DB;

    if (!db) {
        // D1 not available - likely running in dev mode without wrangler
        // or during initial project setup
        console.warn("D1 database not available - auth disabled");
        event.locals.user = null;
        event.locals.session = null;
        event.locals.currentUser = null;
        return resolve(event);
    }

    // Get environment variables from Cloudflare
    const env = {
        BETTER_AUTH_SECRET: event.platform?.env?.BETTER_AUTH_SECRET ?? "",
        BETTER_AUTH_URL: event.platform?.env?.BETTER_AUTH_URL ?? "http://localhost:5173",
        GOOGLE_CLIENT_ID: event.platform?.env?.GOOGLE_CLIENT_ID ?? "",
        GOOGLE_CLIENT_SECRET: event.platform?.env?.GOOGLE_CLIENT_SECRET ?? ""
    };

    // Create auth instance with the D1 database
    const auth = createAuth(db, env);

    // Fetch current session from cookies
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    // Populate locals for use in load functions and endpoints
    if (session) {
        event.locals.session = session.session;
        event.locals.user = session.user;
        // Derive currentUser from authenticated email and brand config
        event.locals.currentUser = getCurrentUser(session.user.email);
    } else {
        event.locals.session = null;
        event.locals.user = null;
        event.locals.currentUser = null;
    }

    // Let svelteKitHandler process auth routes (/api/auth/*)
    return svelteKitHandler({ event, resolve, auth, building });
};
