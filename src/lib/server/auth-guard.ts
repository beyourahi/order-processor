import { redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { isEmailAuthorized } from "$lib/hooks";

/**
 * Require authentication - redirects to login if not authenticated
 *
 * Use this in +page.server.ts load functions to protect routes:
 * ```ts
 * export const load: PageServerLoad = async (event) => {
 *   const user = requireAuth(event);
 *   // ... rest of load function
 * };
 * ```
 */
export const requireAuth = (event: RequestEvent) => {
    if (!event.locals.user) {
        const redirectTo = event.url.pathname + event.url.search;
        redirect(303, `/login?redirect=${encodeURIComponent(redirectTo)}`);
    }
    return event.locals.user;
};

/**
 * Require authorization - checks email allowlist
 *
 * Returns authorization status along with user info.
 * Use this when you need to show different UI for unauthorized users
 * rather than redirecting them.
 */
export const requireAuthorization = (event: RequestEvent) => {
    const user = requireAuth(event);

    if (!isEmailAuthorized(user.email)) {
        // User is authenticated but not authorized
        // Let the page handle showing NotAuthorized
        return { user, authorized: false };
    }

    return { user, authorized: true };
};

/**
 * Get current user with brand data
 *
 * Returns the authenticated user along with their brand configuration
 * from the allowlist. Returns authorized: false if user is not in allowlist.
 */
export const getAuthorizedUser = (event: RequestEvent) => {
    const user = requireAuth(event);

    if (!event.locals.currentUser) {
        return { user, currentUser: null, authorized: false };
    }

    return {
        user,
        currentUser: event.locals.currentUser,
        authorized: true
    };
};
