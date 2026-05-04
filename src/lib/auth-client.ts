import { createAuthClient } from "better-auth/svelte";

// useSession() returns a reactive Svelte store; baseURL must match BETTER_AUTH_URL env var.
export const authClient = createAuthClient({});
