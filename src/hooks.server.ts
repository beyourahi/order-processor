import type { Handle, HandleServerError } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { createAuth } from "$lib/server/auth";
import { getCurrentUser } from "$lib/hooks";

/**
 * Security headers applied to all responses.
 * These protect against common web vulnerabilities.
 */
const SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff", // Prevent MIME type sniffing
    "X-Frame-Options": "DENY", // Prevent clickjacking
    "Referrer-Policy": "strict-origin-when-cross-origin", // Control referrer info
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()", // Restrict browser features
    "X-XSS-Protection": "1; mode=block" // Legacy XSS protection for older browsers
} as const;

/**
 * Applies security headers to a response.
 * Safely handles immutable response objects by cloning if necessary.
 */
function applySecurityHeaders(response: Response): Response {
    // Check if headers are mutable by testing a set operation
    try {
        for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
            response.headers.set(key, value);
        }
        return response;
    } catch {
        // Headers are immutable (e.g., from redirect), clone the response
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

/**
 * SvelteKit server hook for Better Auth integration.
 *
 * This hook:
 * 1. Creates the auth instance with the D1 database from platform context
 * 2. Fetches the current session and populates event.locals
 * 3. Delegates auth route handling to svelteKitHandler
 *
 * The `building` check is critical - during SvelteKit build phase,
 * platform bindings (D1) are not available, so we skip auth logic.
 */
export const handle: Handle = async ({ event, resolve }) => {
    // Skip auth during SvelteKit build phase (prerendering, etc.)
    if (building) {
        return resolve(event);
    }

    // Get D1 database from Cloudflare platform context
    const db = event.platform?.env?.DB;

    if (!db) {
        // D1 not available - likely running in dev mode without wrangler
        // or during initial project setup
        console.warn("D1 database not available - auth disabled");
        event.locals.user = null;
        event.locals.session = null;
        event.locals.currentUser = null;
        return resolve(event);
    }

    // Get environment variables from Cloudflare
    const env = {
        BETTER_AUTH_SECRET: event.platform?.env?.BETTER_AUTH_SECRET ?? "",
        BETTER_AUTH_URL: event.platform?.env?.BETTER_AUTH_URL ?? "http://localhost:5173",
        GOOGLE_CLIENT_ID: event.platform?.env?.GOOGLE_CLIENT_ID ?? "",
        GOOGLE_CLIENT_SECRET: event.platform?.env?.GOOGLE_CLIENT_SECRET ?? ""
    };

    // Create auth instance with the D1 database
    const auth = createAuth(db, env);

    // Fetch current session from cookies
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    // Populate locals for use in load functions and endpoints
    if (session) {
        event.locals.session = session.session;
        event.locals.user = session.user;
        // Derive currentUser from authenticated email and brand config
        event.locals.currentUser = getCurrentUser(session.user.email);
    } else {
        event.locals.session = null;
        event.locals.user = null;
        event.locals.currentUser = null;
    }

    // Let svelteKitHandler process auth routes (/api/auth/*)
    // Then apply security headers to the response
    const response = await svelteKitHandler({ event, resolve, auth, building });
    return applySecurityHeaders(response);
};

/**
 * Global error handler for unexpected server errors.
 *
 * This hook:
 * 1. Generates a unique error ID for tracking
 * 2. Logs the full error for debugging
 * 3. Returns a safe error object without sensitive details
 *
 * The errorId can be used to correlate user reports with server logs.
 */
export const handleError: HandleServerError = async ({ error, event, status, message }) => {
    const errorId = crypto.randomUUID();

    // Log the full error for debugging (visible in Cloudflare logs)
    console.error(`[${errorId}] Unhandled error:`, {
        status,
        message,
        url: event.url.pathname,
        method: event.request.method,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
    });

    // Return safe error object for client (no sensitive details)
    return {
        message: status >= 500 ? "An unexpected error occurred" : message,
        errorId
    };
};
