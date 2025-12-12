# 13 - Auth Flows Migration

## Prerequisites
- `01-project-setup.md` through `12-routes-migration.md` completed

## Next Prompt
- `14-csv-excel-integration.md`

---

## Objective

Finalize authentication flows including protected routes, email allowlist validation, and session handling. This ensures the auth experience matches the original Kinde implementation.

---

## Instructions

### Step 1: Create Auth Guard Hook

Create a reusable hook for protecting routes:

**src/lib/server/auth-guard.ts:**
```typescript
import { redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { isEmailAuthorized } from "$lib/hooks";

/**
 * Require authentication - redirects to login if not authenticated
 */
export const requireAuth = (event: RequestEvent) => {
    if (!event.locals.user) {
        const redirectTo = event.url.pathname + event.url.search;
        throw redirect(303, `/login?redirect=${encodeURIComponent(redirectTo)}`);
    }
    return event.locals.user;
};

/**
 * Require authorization - checks email allowlist
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
```

### Step 2: Update Main Page Server Load

**src/routes/+page.server.ts:**
```typescript
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    // Page handles auth states client-side for better UX
    // Server just provides the data
    return {
        user: locals.user,
        currentUser: locals.currentUser,
        isAuthorized: locals.currentUser !== null
    };
};
```

### Step 3: Update Login Page with Redirect Support

**src/routes/login/+page.svelte:**
```svelte
<!--
  Login Page
  Google OAuth sign-in with redirect support
-->
<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { Heading } from "$lib/components";

    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Get redirect URL from query params
    const redirectUrl = $derived(
        $page.url.searchParams.get("redirect") || "/"
    );

    // Redirect if already logged in
    const session = authClient.useSession();
    $effect(() => {
        if ($session.data?.user) {
            goto(redirectUrl);
        }
    });

    const handleGoogleLogin = async () => {
        isLoading = true;
        error = null;

        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: redirectUrl
            });
        } catch (e) {
            error = "Failed to sign in with Google. Please try again.";
            console.error(e);
        } finally {
            isLoading = false;
        }
    };
</script>

<svelte:head>
    <title>Sign In - Shopify Order Processor</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-12 p-4">
    <Heading />

    {#if error}
        <div class="rounded-lg bg-red-500/10 px-4 py-2 text-red-500">
            {error}
        </div>
    {/if}

    <button
        onclick={handleGoogleLogin}
        disabled={isLoading}
        class="sleek flex items-center gap-3 rounded-xl bg-white px-8 py-3 text-sm font-medium text-black active:scale-95 disabled:opacity-50 xl:hover:bg-white/90"
    >
        {#if isLoading}
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
        {:else}
            <svg class="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
        {/if}
        Continue with Google
    </button>

    <p class="text-sm text-zinc-500">
        Only authorized accounts can access this application
    </p>
</div>
```

### Step 4: Create Session Refresh Component

**src/lib/components/features/session-provider.svelte:**
```svelte
<!--
  Session Provider
  Handles session refresh and provides session context
-->
<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { onMount } from "svelte";

    let { children } = $props();

    // Refresh session periodically
    onMount(() => {
        // Refresh every 4 minutes (session cache is 5 minutes)
        const interval = setInterval(() => {
            authClient.useSession();
        }, 4 * 60 * 1000);

        return () => clearInterval(interval);
    });
</script>

{@render children()}
```

### Step 5: Update NotAuthorized with Better Messaging

**src/lib/components/ui/not-authorized/not-authorized.svelte:**
```svelte
<!--
  NotAuthorized Component
  Shows when user is authenticated but not in allowlist
-->
<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";

    const user = $derived($page.data.user);

    let isLoggingOut = $state(false);

    const handleLogout = async () => {
        isLoggingOut = true;
        try {
            await authClient.signOut();
            goto("/login");
        } finally {
            isLoggingOut = false;
        }
    };
</script>

<div class="flex flex-col items-center gap-8 text-center">
    <div class="flex flex-col gap-4">
        <h2 class="text-3xl font-bold text-red-500">Access Denied</h2>
        <p class="max-w-md text-zinc-400">
            The email address <span class="font-medium text-zinc-300">{user?.email}</span>
            is not authorized to access this application.
        </p>
        <p class="text-sm text-zinc-500">
            Please contact the administrator if you believe this is an error.
        </p>
    </div>

    <button
        onclick={handleLogout}
        disabled={isLoggingOut}
        class="sleek rounded-xl bg-zinc-800 px-8 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
    >
        {isLoggingOut ? "Signing out..." : "Sign in with a different account"}
    </button>
</div>
```

### Step 6: Create Logout API Route (Optional)

For programmatic logout:

**src/routes/api/logout/+server.ts:**
```typescript
import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, cookies }) => {
    // Clear session cookie
    cookies.delete("better-auth.session_token", { path: "/" });

    return json({ success: true });
};

export const GET: RequestHandler = async () => {
    // Redirect to login after logout
    throw redirect(303, "/login");
};
```

### Step 7: Test Auth Flow

Create a test component to verify all auth states:

**src/routes/auth-test/+page.svelte:**
```svelte
<!--
  Auth Test Page
  For development testing of auth states
-->
<script lang="ts">
    import { page } from "$app/state";
    import { authClient } from "$lib/auth-client";

    const session = authClient.useSession();

    const { user, currentUser } = $derived($page.data);
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
    <h1 class="text-2xl font-bold">Auth Debug</h1>

    <div class="flex flex-col gap-4 rounded-lg bg-zinc-900 p-6 font-mono text-sm">
        <div>
            <span class="text-zinc-500">Session Status:</span>
            <span class="ml-2">
                {#if $session.isPending}
                    <span class="text-yellow-500">Loading...</span>
                {:else if $session.data}
                    <span class="text-green-500">Authenticated</span>
                {:else}
                    <span class="text-red-500">Not authenticated</span>
                {/if}
            </span>
        </div>

        <div>
            <span class="text-zinc-500">Server User:</span>
            <span class="ml-2 text-zinc-300">{user?.email || "null"}</span>
        </div>

        <div>
            <span class="text-zinc-500">Current User:</span>
            <span class="ml-2 text-zinc-300">{currentUser?.name || "null"}</span>
        </div>

        <div>
            <span class="text-zinc-500">Courier:</span>
            <span class="ml-2 text-zinc-300">{currentUser?.courier || "null"}</span>
        </div>

        <div>
            <span class="text-zinc-500">Authorized:</span>
            <span class="ml-2" class:text-green-500={currentUser} class:text-red-500={!currentUser}>
                {currentUser ? "Yes" : "No"}
            </span>
        </div>
    </div>

    <div class="flex gap-4">
        <a href="/" class="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700">
            Home
        </a>
        <a href="/login" class="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700">
            Login
        </a>
    </div>
</div>
```

**src/routes/auth-test/+page.server.ts:**
```typescript
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    return {
        user: locals.user,
        currentUser: locals.currentUser
    };
};
```

---

## Verification

```bash
# Type check
bun run check

# Start preview
bun run preview
```

Test all auth states:
1. **Unauthenticated**: Visit / → should see "Sign In" button
2. **Login flow**: Click Sign In → Google OAuth → redirect back
3. **Authorized**: Email in allowlist → see main interface
4. **Not authorized**: Email not in allowlist → see "Access Denied"
5. **Logout**: Click Log Out → redirect to login
6. **Redirect**: Login with redirect param → return to original page

---

## Files Created/Modified

- `src/lib/server/auth-guard.ts` (created)
- `src/routes/+page.server.ts` (created)
- `src/routes/login/+page.svelte` (updated)
- `src/lib/components/ui/not-authorized/not-authorized.svelte` (updated)
- `src/lib/components/features/session-provider.svelte` (created)
- `src/routes/api/logout/+server.ts` (created)
- `src/routes/auth-test/+page.svelte` (created)
- `src/routes/auth-test/+page.server.ts` (created)

---

## Auth Flow Comparison

| Kinde Flow | Better Auth Flow |
|------------|------------------|
| `useKindeBrowserClient()` | `authClient.useSession()` |
| `<LogoutLink>` | `authClient.signOut()` |
| `/api/auth/[kindeAuth]` | `/api/auth/[...all]` (auto-handled) |
| Middleware protection | hooks.server.ts + page guards |
| Email allowlist check | `isEmailAuthorized()` |

---

## Notes

- Better Auth handles the OAuth callback automatically
- Session is validated server-side in hooks.server.ts
- Email allowlist is checked using `findBrandByEmail`
- The auth-test page can be removed before production
- Logout clears the session cookie and redirects
