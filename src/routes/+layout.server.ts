import type { LayoutServerLoad } from "./$types";

// Surfaces the session resolved in hooks.server.ts to every page via App.PageData.
// This is the only auth state the client sees — it is NOT a gate: route guards
// (e.g. the redirect in +page.server.ts) enforce access.
export const load: LayoutServerLoad = async ({ locals }) => {
    return {
        user: locals.user,
        session: locals.session,
        currentUser: locals.currentUser
    };
};
