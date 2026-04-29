import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

/**
 * Main page server load function.
 *
 * Provides authentication and authorization data to the page component.
 * Redirects unauthenticated users to login page to prevent any flash of content.
 *
 * Data flow:
 * 1. hooks.server.ts populates locals with session/user/currentUser
 * 2. This load function checks authentication and redirects if needed
 * 3. Authenticated users get passed data to the page component
 */
export const load: PageServerLoad = async ({ locals }) => {
    // Redirect unauthenticated users to login page
    if (!locals.user) {
        redirect(303, "/login");
    }

    return {
        user: locals.user,
        currentUser: locals.currentUser
    };
};
