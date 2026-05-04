import type { Handle, HandleServerError } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { createAuth } from "$lib/server/auth";
import { getCurrentUser } from "$lib/hooks";

// Google Fonts is loaded in app.html; lh3.googleusercontent.com serves user avatars from Google OAuth.
// 'unsafe-inline' is required for SvelteKit's hydration bootstrap scripts and Tailwind's scoped styles.
const CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data: https://lh3.googleusercontent.com",
    "connect-src 'self'",
    "frame-ancestors 'none'"
].join("; ");

const SECURITY_HEADERS = {
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY", // kept for browsers that predate CSP frame-ancestors support
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
} as const;

// Clones immutable responses (e.g. redirects) before setting headers.
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

// `building` guard is critical: platform bindings (D1) are unavailable during SvelteKit build/prerender.
export const handle: Handle = async ({ event, resolve }) => {
    if (building) {
        return resolve(event);
    }

    const db = event.platform?.env?.DB;

    if (!db) {
        // D1 not available — likely running in dev mode without wrangler or during initial project setup
        console.warn("D1 database not available - auth disabled");
        event.locals.user = null;
        event.locals.session = null;
        event.locals.currentUser = null;
        return resolve(event);
    }

    const env = {
        BETTER_AUTH_SECRET: event.platform?.env?.BETTER_AUTH_SECRET ?? "",
        BETTER_AUTH_URL: event.platform?.env?.BETTER_AUTH_URL ?? "http://localhost:5173",
        GOOGLE_CLIENT_ID: event.platform?.env?.GOOGLE_CLIENT_ID ?? "",
        GOOGLE_CLIENT_SECRET: event.platform?.env?.GOOGLE_CLIENT_SECRET ?? ""
    };

    // Warn if BETTER_AUTH_SECRET is missing — auth will fail in production
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

    // /api/auth/* routes go through svelteKitHandler
    const response = await svelteKitHandler({ event, resolve, auth, building });
    return applySecurityHeaders(response);
};

// errorId correlates user reports with server logs.
export const handleError: HandleServerError = async ({ error, event, status, message }) => {
    const errorId = crypto.randomUUID();

    // Log the full error (visible in Cloudflare logs)
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
