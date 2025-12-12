# 12 - Routes Migration

## Prerequisites
- `01-project-setup.md` through `11-app-context-migration.md` completed

## Next Prompt
- `13-auth-flows-migration.md`

---

## MCP Servers to Use

Before implementing this prompt, use these MCP servers for accurate documentation:

| MCP Server | Usage |
|------------|-------|
| **svelte** | **PRIMARY** - Use `get-documentation` for SvelteKit routing, layouts, `+page.svelte`, `+layout.svelte`, `+error.svelte`, load functions, and `$app/navigation` |
| **better-auth** | Use `search` for auth client `useSession` and client-side auth patterns |

### Recommended MCP Queries
```
svelte MCP:
- list-sections → get-documentation: "routing", "layouts"
- get-documentation: "+page.svelte", "+layout.svelte"
- get-documentation: "load", "page data"
- get-documentation: "$app/navigation", "goto"
- get-documentation: "$app/state", "page"
- get-documentation: "error pages"
- svelte-autofixer: Validate all route components

better-auth MCP:
- search: "useSession client"
- search: "signIn social Google"
```

**Important**: SvelteKit routing uses file-based conventions. Validate all route components with `svelte-autofixer`.

---

## Objective

Create the SvelteKit routes that mirror the Next.js page structure. This includes the main page, layouts, and error handling.

---

## Instructions

### Step 1: Create Root Layout

**src/routes/+layout.svelte:**
```svelte
<!--
  Root Layout
  Provides the app shell with global styles and footer
-->
<script lang="ts">
    import "../app.css";
    import { Footer } from "$lib/components";

    let { children } = $props();
</script>

<svelte:head>
    <title>Shopify Order Processor</title>
    <meta name="description" content="Turn Chaos into Orders - Process Shopify exports for courier services" />
</svelte:head>

<div class="flex min-h-screen flex-col">
    <main class="flex grow flex-col">
        {@render children()}
    </main>
    <Footer />
</div>
```

### Step 2: Update Layout Server Load

**src/routes/+layout.server.ts:**
```typescript
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
    return {
        user: locals.user,
        session: locals.session,
        currentUser: locals.currentUser
    };
};
```

### Step 3: Create Main Page

**src/routes/+page.svelte:**
```svelte
<!--
  Main Page
  The primary application interface with authentication check
-->
<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { authClient } from "$lib/auth-client";
    import { courierService } from "$lib/stores";
    import {
        Heading,
        LoadingSpinner,
        NotAuthorized,
        OrderProcessor,
        CourierPicker,
        User
    } from "$lib/components";
    import { isEmailAuthorized } from "$lib/hooks";

    // Get data from layout load
    const { user, currentUser } = $derived($page.data);

    // Check authorization
    const isAuthorized = $derived(isEmailAuthorized(user?.email));

    // Session state from client
    const session = authClient.useSession();

    // Handle courier selection
    const handleCourierSelect = (courier: string) => {
        courierService.set(courier);
    };
</script>

<div class="flex w-full grow flex-col items-center justify-center gap-20 px-4 pt-4 xl:pt-8">
    <Heading />

    <!-- Three-state authentication flow -->
    {#if $session.isPending}
        <!-- Loading state -->
        <LoadingSpinner />
    {:else if !user}
        <!-- Not logged in - redirect to login -->
        <div class="flex flex-col items-center gap-4">
            <p class="text-zinc-400">Please sign in to continue</p>
            <a
                href="/login"
                class="sleek rounded-xl bg-white px-8 py-3 text-sm font-medium text-black active:scale-95 xl:hover:bg-white/90"
            >
                Sign In
            </a>
        </div>
    {:else if !isAuthorized}
        <!-- Logged in but not authorized -->
        <NotAuthorized />
    {:else if currentUser}
        <!-- Authorized user - show main interface -->
        <div class="flex w-full flex-col items-center gap-20 text-center">
            <div class="flex w-full max-w-xl flex-col-reverse items-center justify-center gap-12 lg:max-w-4xl lg:flex-row lg:gap-12 2xl:max-w-6xl">
                <OrderProcessor
                    {currentUser}
                    selectedCourier={$courierService}
                />

                <CourierPicker
                    selectedCourier={$courierService}
                    userCourier={currentUser.courier}
                    onSelect={handleCourierSelect}
                />
            </div>

            <User {user} {currentUser} />
        </div>
    {:else}
        <!-- Fallback loading -->
        <LoadingSpinner />
    {/if}
</div>
```

### Step 4: Create Error Page

**src/routes/+error.svelte:**
```svelte
<!--
  Error Page
  Displays when an error occurs during navigation or data loading
-->
<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components";

    const handleReset = () => {
        goto("/");
    };
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
    <div class="flex flex-col items-center gap-4 text-center">
        <h1 class="text-6xl font-bold text-red-500">
            {$page.status}
        </h1>
        <h2 class="text-2xl font-semibold text-zinc-300">
            {$page.error?.message || "Something went wrong"}
        </h2>
        <p class="max-w-md text-zinc-400">
            An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
    </div>

    <Button onclick={handleReset} variant="outline">
        Go back home
    </Button>
</div>
```

### Step 5: Update Login Page

**src/routes/login/+page.svelte:**
```svelte
<!--
  Login Page
  Google OAuth sign-in
-->
<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { Heading } from "$lib/components";

    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Redirect if already logged in
    const session = authClient.useSession();
    $effect(() => {
        if ($session.data?.user) {
            goto("/");
        }
    });

    const handleGoogleLogin = async () => {
        isLoading = true;
        error = null;

        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/"
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
                <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
            </svg>
        {/if}
        Continue with Google
    </button>

    <p class="text-sm text-zinc-500">
        Only authorized accounts can access this application
    </p>
</div>
```

### Step 6: Create Login Page Server Load (Optional Protection)

**src/routes/login/+page.server.ts:**
```typescript
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    // If already logged in, redirect to home
    if (locals.user) {
        throw redirect(303, "/");
    }

    return {};
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

Test flow:
1. Visit http://localhost:8787 - should show login prompt if not authenticated
2. Click "Sign In" - should go to /login
3. Click "Continue with Google" - should initiate OAuth
4. After login, should redirect to main page
5. If email not authorized, should show NotAuthorized
6. If authorized, should show full interface

---

## Files Created/Modified

- `src/routes/+layout.svelte` (updated)
- `src/routes/+layout.server.ts` (updated)
- `src/routes/+page.svelte` (replaced)
- `src/routes/+error.svelte` (created)
- `src/routes/login/+page.svelte` (updated)
- `src/routes/login/+page.server.ts` (created)

---

## Route Structure

```
src/routes/
├── +layout.svelte       # Root layout with CSS and footer
├── +layout.server.ts    # Server load for auth data
├── +page.svelte         # Main application page
├── +error.svelte        # Error boundary
└── login/
    ├── +page.svelte     # Login page with Google OAuth
    └── +page.server.ts  # Redirect if already logged in
```

---

## Notes

- The main page handles three states: loading, authorized, not authorized
- Layout server load provides user data to all pages
- Error page shows status code and message
- Login page auto-redirects if already authenticated
- The responsive layout matches the original exactly
