import type { PageServerLoad } from "./$types";

/**
 * Main page server load function.
 *
 * Provides authentication and authorization data to the page component.
 * The page handles auth states client-side for better UX (showing
 * appropriate UI for loading, not logged in, not authorized, etc.)
 *
 * Data flow:
 * 1. hooks.server.ts populates locals with session/user/currentUser
 * 2. This load function passes that data to the page
 * 3. Page component uses $derived to reactively access the data
 */
export const load: PageServerLoad = async ({ locals }) => {
    return {
        user: locals.user,
        currentUser: locals.currentUser,
        isAuthorized: locals.currentUser !== null
    };
};
