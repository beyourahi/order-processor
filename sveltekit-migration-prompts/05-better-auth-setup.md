# 05 - Better Auth Setup

## Prerequisites

- `01-project-setup.md` completed
- `02-cloudflare-configuration.md` completed
- `03-tailwind-setup.md` completed
- `04-shadcn-ui-setup.md` completed

## Next Prompt

- `06-types-migration.md`

---

## MCP Servers to Use

Before implementing this prompt, use these MCP servers for accurate documentation:

| MCP Server          | Usage                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **better-auth**     | **PRIMARY** - Use `search` or `chat` for Better Auth setup, D1 adapter, Google OAuth, SvelteKit integration, and hooks configuration |
| **cloudflare-docs** | Use `search_cloudflare_documentation` for D1 database operations, SQL schema, and Workers environment                                |
| **svelte**          | Use `get-documentation` for hooks.server.ts patterns and server-side data loading                                                    |

### Recommended MCP Queries

```
better-auth MCP:
- search: "SvelteKit integration"
- search: "D1 adapter Cloudflare"
- search: "Google OAuth provider setup"
- search: "svelteKitHandler hooks"
- search: "auth client createAuthClient"
- chat: Ask about session handling and cookie configuration

cloudflare-docs MCP:
- search: "D1 database schema SQL"
- search: "D1 execute migration"
- search: "D1 local development"

svelte MCP:
- get-documentation: "hooks", "server hooks"
- get-documentation: "load functions", "locals"
```

**Critical**: Better Auth documentation is essential for correct auth setup. Always verify API usage against the better-auth MCP before implementing.

---

## Objective

Set up Better Auth with Cloudflare D1 database and Google OAuth. This replaces Kinde Auth while maintaining the same authentication flow from the user's perspective.

---

## Instructions

### Step 1: Install Better Auth D1 Adapter

```bash
bun add @better-auth/d1
```

### Step 2: Create Server Auth Configuration

**src/lib/server/auth.ts:**

```typescript
import { betterAuth } from "better-auth";
import { d1Adapter } from "@better-auth/d1";

// This will be called with the platform context in hooks.server.ts
export const createAuth = (db: D1Database) => {
    return betterAuth({
        database: d1Adapter(db, {
            usePlural: true // Better Auth expects plural table names
        }),
        baseURL: process.env.BETTER_AUTH_URL,
        secret: process.env.BETTER_AUTH_SECRET,
        emailAndPassword: {
            enabled: false // We only use Google OAuth
        },
        socialProviders: {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID as string,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
            }
        },
        session: {
            cookieCache: {
                enabled: true,
                maxAge: 60 * 5 // 5 minutes
            }
        },
        trustedOrigins: [
            "http://localhost:5173",
            "http://localhost:3000"
            // Add production URL here
        ]
    });
};

// Type export for the auth instance
export type Auth = ReturnType<typeof createAuth>;
```

### Step 3: Create Auth Client

**src/lib/auth-client.ts:**

```typescript
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:5173"
});

// Export commonly used methods
export const { signIn, signOut, useSession } = authClient;
```

### Step 4: Update hooks.server.ts

**src/hooks.server.ts:**

```typescript
import type { Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { createAuth } from "$lib/server/auth";

export const handle: Handle = async ({ event, resolve }) => {
    // Skip during build
    if (building) {
        return resolve(event);
    }

    // Get D1 database from platform
    const db = event.platform?.env?.DB;

    if (!db) {
        console.warn("D1 database not available");
        return resolve(event);
    }

    // Create auth instance with the D1 database
    const auth = createAuth(db);

    // Fetch session and populate locals
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    if (session) {
        event.locals.session = session.session;
        event.locals.user = session.user;
    } else {
        event.locals.session = null;
        event.locals.user = null;
    }

    // Handle auth routes
    return svelteKitHandler({ event, resolve, auth, building });
};
```

### Step 5: Update app.d.ts

**src/app.d.ts:**

```typescript
/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

declare global {
    namespace App {
        interface Locals {
            user: {
                id: string;
                email: string;
                name: string;
                image?: string | null;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            session: {
                id: string;
                userId: string;
                expiresAt: Date;
                token: string;
                createdAt: Date;
                updatedAt: Date;
                ipAddress?: string | null;
                userAgent?: string | null;
            } | null;
        }
        interface Platform {
            env: {
                DB: D1Database;
                BETTER_AUTH_SECRET: string;
                BETTER_AUTH_URL: string;
                GOOGLE_CLIENT_ID: string;
                GOOGLE_CLIENT_SECRET: string;
            };
            cf: CfProperties;
            ctx: ExecutionContext;
        }
    }
}

export {};
```

### Step 6: Create Layout Server Load

**src/routes/+layout.server.ts:**

```typescript
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
    return {
        user: locals.user,
        session: locals.session
    };
};
```

### Step 7: Update .dev.vars

**.dev.vars:**

```env
BETTER_AUTH_SECRET=your-32-character-secret-key-here
BETTER_AUTH_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 8: Initialize D1 Tables

Better Auth will auto-create tables, but you can manually create them:

```bash
# Run the migration to create auth tables
wrangler d1 execute order_processor --command "
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    emailVerified INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    ipAddress TEXT,
    userAgent TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    accessTokenExpiresAt TEXT,
    refreshTokenExpiresAt TEXT,
    scope TEXT,
    idToken TEXT,
    password TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
"
```

### Step 9: Create Login Page

**src/routes/login/+page.svelte:**

```svelte
<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";

    let isLoading = $state(false);
    let error = $state<string | null>(null);

    const handleGoogleLogin = async () => {
        isLoading = true;
        error = null;

        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/"
            });
        } catch (e) {
            error = "Failed to sign in with Google";
            console.error(e);
        } finally {
            isLoading = false;
        }
    };
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
    <div class="flex flex-col items-center gap-4">
        <h1 class="text-4xl font-bold">Shopify Order Processor</h1>
        <p class="text-zinc-400">Sign in to continue</p>
    </div>

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
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
            </svg>
        {/if}
        Continue with Google
    </button>
</div>
```

### Step 10: Test Auth Setup

**src/routes/+page.svelte:**

```svelte
<script lang="ts">
    import { page } from "$app/state";
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";

    const session = authClient.useSession();

    const handleLogout = async () => {
        await authClient.signOut();
        goto("/login");
    };
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
    <h1 class="text-4xl font-bold">Auth Test</h1>

    {#if $session.data}
        <div class="flex flex-col items-center gap-4">
            <p class="text-zinc-400">Logged in as:</p>
            <p class="font-bold">{$session.data.user.name}</p>
            <p class="text-zinc-400">{$session.data.user.email}</p>

            <button
                onclick={handleLogout}
                class="sleek rounded-xl bg-red-500 px-12 py-3 text-sm font-bold text-white uppercase active:scale-95 active:bg-red-700 xl:hover:bg-red-700"
            >
                Log Out
            </button>
        </div>
    {:else if $session.isPending}
        <div class="loader"></div>
    {:else}
        <a
            href="/login"
            class="sleek rounded-xl bg-white px-8 py-3 text-sm font-medium text-black active:scale-95 xl:hover:bg-white/90"
        >
            Sign In
        </a>
    {/if}
</div>
```

---

## Verification

```bash
# Run type check
bun run check

# Start with wrangler (for D1 access)
bun run preview
```

Test flow:

1. Visit http://localhost:8787/login
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. Should redirect to home page with user info
5. Click "Log Out" to sign out

---

## Files Created/Modified

- `src/lib/server/auth.ts` (created)
- `src/lib/auth-client.ts` (created)
- `src/hooks.server.ts` (modified)
- `src/app.d.ts` (modified)
- `src/routes/+layout.server.ts` (created)
- `src/routes/login/+page.svelte` (created)
- `src/routes/+page.svelte` (modified)
- `.dev.vars` (modified)

---

## Google OAuth Setup

If you don't have Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Authorized JavaScript origins: `http://localhost:5173`, `http://localhost:8787`
7. Authorized redirect URIs: `http://localhost:5173/api/auth/callback/google`, `http://localhost:8787/api/auth/callback/google`
8. Copy Client ID and Client Secret to `.dev.vars`

---

## Notes

- Better Auth uses D1 for session storage (persistent across restarts)
- The session is automatically refreshed via cookie cache
- Google OAuth is the only enabled provider (matching Kinde setup)
- Email allowlist authorization will be added in prompt 13
- Better Auth creates tables automatically on first use
