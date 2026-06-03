import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

// Inverse of the +page.server.ts gate: an already-authenticated user has no
// reason to see the login page, so bounce them home.
export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) {
        redirect(303, "/");
    }

    return {};
};
