/**
 * Drizzle Kit config for the D1 (SQLite) auth + brand_settings database.
 *
 * - `db:generate` works without credentials (offline schema diff → SQL).
 * - `db:push` / `db:studio` / `db:pull` require CLOUDFLARE_ACCOUNT_ID,
 *   CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN via .env. We omit `driver`
 *   and `dbCredentials` when those are missing so `db:generate` doesn't fail.
 *
 * Schema source of truth: src/lib/server/schema.ts.
 * Generated SQL goes to ./migrations (commit alongside schema changes).
 */
import { defineConfig } from "drizzle-kit";

const hasD1Credentials =
    process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_DATABASE_ID && process.env.CLOUDFLARE_D1_TOKEN;

const baseConfig = {
    out: "./migrations",
    schema: "./src/lib/server/schema.ts",
    dialect: "sqlite" as const,
    verbose: true,
    strict: true,
    breakpoints: true
};

export default defineConfig(
    hasD1Credentials
        ? {
              ...baseConfig,
              driver: "d1-http",
              dbCredentials: {
                  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
                  databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
                  token: process.env.CLOUDFLARE_D1_TOKEN!
              }
          }
        : baseConfig
);
