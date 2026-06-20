/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

import type { CurrentUser } from "$lib/types";
import type { Auth } from "$lib/server/auth";

declare global {
    namespace App {
        interface Locals {
            user: Auth["$Infer"]["Session"]["user"] | null;
            session: Auth["$Infer"]["Session"]["session"] | null;
            currentUser: CurrentUser | null;
        }

        // Mirrors the bindings/vars declared in wrangler.jsonc — rerun
        // `bun run cf-typegen` after editing that file. Required bindings are
        // non-optional so a missing one is a type error, not a runtime surprise;
        // optional vars are `?`-typed (under exactOptionalPropertyTypes a `?`
        // member is genuinely absent, not `undefined`) so they may stay unset
        // everywhere they don't apply.
        interface Platform {
            env: {
                DB: D1Database;
                AI: Ai;
                VECTORIZE: VectorizeIndex;
                SEED_SECRET?: string;
                AI_GATEWAY_SLUG?: string;
                // AES-GCM key (base64, 32 bytes) encrypting each user's BYO
                // Cloudflare token in user_settings. `wrangler secret put` in prod;
                // .dev.vars locally. Optional so absence degrades gracefully.
                TOKEN_ENCRYPTION_KEY?: string;
                BETTER_AUTH_SECRET: string;
                BETTER_AUTH_URL: string;
                GOOGLE_CLIENT_ID: string;
                GOOGLE_CLIENT_SECRET: string;
                // Preview/E2E-only OAuth bypass — never set in production (warning #20).
                E2E_BYPASS_AUTH?: string;
            };
            cf: CfProperties;
            ctx: ExecutionContext;
        }

        interface PageData {
            user: Locals["user"];
            session: Locals["session"];
            currentUser: CurrentUser | null;
        }

        interface Error {
            message: string;
            /** Correlates user reports with server logs. */
            errorId?: string;
        }
    }
}

export {};
