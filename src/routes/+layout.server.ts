import type { LayoutServerLoad } from "./$types";

/**
 * Root layout server load function.
 *
 * This runs on every page request and passes the user/session
 * from hooks.server.ts (event.locals) down to all pages and layouts.
 *
 * The data is available in:
 * - +layout.svelte via `data` prop
 * - +page.svelte via `data` prop
 * - Child layouts via `data` prop
 */
export const load: LayoutServerLoad = async ({ locals }) => {
    return {
        user: locals.user,
        session: locals.session,
        currentUser: locals.currentUser
    };
};
