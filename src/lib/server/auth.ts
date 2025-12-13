import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Environment variables required for Better Auth.
 * These are provided by Cloudflare Workers environment.
 */
interface AuthEnv {
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
}

/**
 * Creates a Better Auth instance configured for Cloudflare D1.
 *
 * This factory pattern is required because Cloudflare Workers
 * provide the D1 binding per-request via `event.platform.env.DB`.
 * We cannot create a singleton auth instance at module scope.
 *
 * @param d1 - The D1 database binding from the request context
 * @param env - Environment variables containing auth secrets
 */
export function createAuth(d1: D1Database, env: AuthEnv) {
    // Initialize Drizzle ORM with the D1 binding and schema
    const db = drizzle(d1, { schema });

    return betterAuth({
        // Use Drizzle adapter with SQLite provider (D1 is SQLite-based)
        // Pass schema explicitly for proper table mapping
        database: drizzleAdapter(db, {
            provider: "sqlite",
            usePlural: true, // Better Auth expects plural table names (users, sessions, etc.)
            schema
        }),

        // Base URL for auth callbacks - must match OAuth redirect URIs
        baseURL: env.BETTER_AUTH_URL,

        // Secret for signing cookies and tokens
        secret: env.BETTER_AUTH_SECRET,

        // Disable email/password auth - we only use Google OAuth
        emailAndPassword: {
            enabled: false
        },

        // Configure Google OAuth provider
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET
            }
        },

        // Session configuration
        session: {
            // Enable cookie caching for performance
            cookieCache: {
                enabled: true,
                maxAge: 60 * 5 // 5 minutes
            }
        },

        // Trusted origins for CORS and OAuth callbacks
        trustedOrigins: [
            "http://localhost:5173", // Vite dev server
            "http://localhost:8787", // Wrangler preview
            "https://order-processor.beyourahi.workers.dev" // Production
        ]
    });
}

/**
 * Type export for the auth instance.
 * Used for typing session and user in app.d.ts
 */
export type Auth = ReturnType<typeof createAuth>;
