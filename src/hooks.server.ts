import type { Handle, HandleServerError } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { drizzle } from "drizzle-orm/d1";
import { createAuth } from "$lib/server/auth";
import { users } from "$lib/server/schema";
import { getCurrentUser } from "$lib/hooks";

// 'unsafe-inline' is REQUIRED for SvelteKit hydration scripts and Tailwind
// scoped styles — do not tighten without testing. lh3.googleusercontent.com
// serves Google OAuth avatars; fonts.* serves Google Fonts loaded in app.html.
// Google One Tap loads the GSI script + renders a FedCM iframe from
// accounts.google.com, so script-src/style-src/frame-src must allow it.
// Passkey/WebAuthn needs no CSP change.
const CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data: https://lh3.googleusercontent.com",
    "connect-src 'self' https://accounts.google.com/gsi/",
    "frame-src https://accounts.google.com/gsi/",
    "frame-ancestors 'none'"
].join("; ");

const SECURITY_HEADERS = {
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY", // legacy fallback for browsers without CSP frame-ancestors
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // `identity-credentials-get` is required for the modern FedCM-based Google One Tap prompt.
    "Permissions-Policy":
        'camera=(), microphone=(), geolocation=(), identity-credentials-get=(self "https://accounts.google.com")'
} as const;

// SvelteKit redirect responses have immutable headers; catch and clone.
function applySecurityHeaders(response: Response): Response {
    try {
        for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
            response.headers.set(key, value);
        }
        return response;
    } catch {
        const newResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers)
        });
        for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
            newResponse.headers.set(key, value);
        }
        return newResponse;
    }
}

// `building` guard is critical: D1 binding is absent during prerender.
// Removing this crashes the build.
export const handle: Handle = async ({ event, resolve }) => {
    if (building) {
        return resolve(event);
    }

    const db = event.platform?.env?.DB;

    if (!db) {
        // Happens in `bun run dev` (no wrangler bindings) or during initial setup.
        console.warn("D1 database not available - auth disabled");
        event.locals.user = null;
        event.locals.session = null;
        event.locals.currentUser = null;
        return resolve(event);
    }

    // E2E auth bypass for Wrangler preview / E2E runs only. Synthesizes a session
    // and upserts the user into D1. Inert unless `.dev.vars` sets E2E_BYPASS_AUTH=true.
    // NEVER set in wrangler.jsonc, CI secrets, or production.
    if (event.platform?.env?.E2E_BYPASS_AUTH === "true") {
        const now = new Date();
        const userId = "e2e-test-user";
        const dz = drizzle(db);
        await dz
            .insert(users)
            .values({
                id: userId,
                email: "e2e@test.local",
                emailVerified: true,
                name: "E2E Test User",
                image: null,
                createdAt: now,
                updatedAt: now
            })
            .onConflictDoNothing();
        event.locals.user = {
            id: userId,
            email: "e2e@test.local",
            emailVerified: true,
            name: "E2E Test User",
            image: null,
            createdAt: now,
            updatedAt: now
        } as App.Locals["user"];
        event.locals.session = {
            id: "e2e-test-session",
            userId,
            token: "e2e-test-token",
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            ipAddress: null,
            userAgent: null,
            createdAt: now,
            updatedAt: now
        } as App.Locals["session"];
        event.locals.currentUser = getCurrentUser(event.locals.user);
        return applySecurityHeaders(await resolve(event));
    }

    const env = {
        BETTER_AUTH_SECRET: event.platform?.env?.BETTER_AUTH_SECRET ?? "",
        BETTER_AUTH_URL: event.platform?.env?.BETTER_AUTH_URL ?? "http://localhost:5173",
        GOOGLE_CLIENT_ID: event.platform?.env?.GOOGLE_CLIENT_ID ?? "",
        GOOGLE_CLIENT_SECRET: event.platform?.env?.GOOGLE_CLIENT_SECRET ?? ""
    };

    if (!env.BETTER_AUTH_SECRET) {
        console.error("[auth] BETTER_AUTH_SECRET is not set — auth will fail in production");
    }

    const auth = createAuth(db, env);

    let session;
    try {
        session = await auth.api.getSession({
            headers: event.request.headers
        });
    } catch {
        session = null;
    }

    if (session) {
        event.locals.session = session.session;
        event.locals.user = session.user;
        event.locals.currentUser = getCurrentUser(session.user);
    } else {
        event.locals.session = null;
        event.locals.user = null;
        event.locals.currentUser = null;
    }

    // svelteKitHandler dispatches /api/auth/* to Better Auth; other routes pass through.
    const response = await svelteKitHandler({ event, resolve, auth, building });
    return applySecurityHeaders(response);
};

// errorId is returned to the client and logged here so user reports map back to a Cloudflare log entry.
export const handleError: HandleServerError = async ({ error, event, status, message }) => {
    const errorId = crypto.randomUUID();

    console.error(`[${errorId}] Unhandled error:`, {
        status,
        message,
        url: event.url.pathname,
        method: event.request.method,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
    });

    return {
        message: status >= 500 ? "An unexpected error occurred" : message,
        errorId
    };
};
