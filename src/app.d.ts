/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

import type { CurrentUser } from "$lib/types";
import type { Auth } from "$lib/server/auth";

/**
 * Type definitions for the SvelteKit application.
 *
 * These declarations extend SvelteKit's App namespace to provide
 * type safety for:
 * - event.locals (user and session from Better Auth)
 * - event.platform (Cloudflare Workers bindings)
 * - page.data (shared page data)
 */
declare global {
    namespace App {
        /**
         * Data available in `event.locals` throughout the request lifecycle.
         * Populated by hooks.server.ts from Better Auth session.
         *
         * Note: Optional properties include `undefined` for compatibility
         * with `exactOptionalPropertyTypes: true` in tsconfig.
         */
        interface Locals {
            user: Auth["$Infer"]["Session"]["user"] | null;
            session: Auth["$Infer"]["Session"]["session"] | null;
            /** Current user derived from auth and brand config */
            currentUser: CurrentUser | null;
        }

        /**
         * Cloudflare Workers platform context.
         * Available via `event.platform` in server-side code.
         */
        interface Platform {
            env: {
                /** D1 database binding */
                DB: D1Database;
                /** Better Auth secret for signing tokens */
                BETTER_AUTH_SECRET: string;
                /** Better Auth base URL for callbacks */
                BETTER_AUTH_URL: string;
                /** Google OAuth client ID */
                GOOGLE_CLIENT_ID: string;
                /** Google OAuth client secret */
                GOOGLE_CLIENT_SECRET: string;
            };
            /** Cloudflare request properties (country, colo, etc.) */
            cf: CfProperties;
            /** Cloudflare execution context for waitUntil, etc. */
            ctx: ExecutionContext;
        }

        /**
         * Shared page data available in all pages.
         * This shape is available in $page.data store and load functions.
         */
        interface PageData {
            user: Locals["user"];
            session: Locals["session"];
            currentUser: CurrentUser | null;
        }

        /**
         * Custom error shape for type-safe error handling.
         * - message: Required for all errors
         * - errorId: Optional, populated by handleError for unexpected errors
         *            Used to correlate user reports with server logs
         */
        interface Error {
            message: string;
            errorId?: string;
        }
    }
}

export {};
