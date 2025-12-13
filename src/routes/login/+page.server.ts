import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    // If already logged in, redirect to home
    if (locals.user) {
        redirect(303, "/");
    }

    return {};
};
