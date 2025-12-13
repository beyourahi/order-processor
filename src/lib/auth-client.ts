import { createAuthClient } from "better-auth/svelte";

/**
 * Better Auth client for Svelte/SvelteKit.
 *
 * This client provides:
 * - `signIn.social()` for OAuth sign-in
 * - `signOut()` for logging out
 * - `useSession()` for reactive session state (Svelte store)
 *
 * The baseURL should match your BETTER_AUTH_URL environment variable.
 * In development, this is typically http://localhost:5173.
 */
export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:5173"
});

/**
 * Convenience exports for commonly used auth methods.
 *
 * Usage in Svelte components:
 * ```svelte
 * <script>
 *   import { signIn, signOut, useSession } from "$lib/auth-client";
 *   const session = useSession();
 * </script>
 *
 * {#if $session.data}
 *   <p>Logged in as {$session.data.user.name}</p>
 *   <button onclick={() => signOut()}>Log out</button>
 * {:else}
 *   <button onclick={() => signIn.social({ provider: "google" })}>
 *     Sign in with Google
 *   </button>
 * {/if}
 * ```
 */
export const { signIn, signOut, useSession } = authClient;
