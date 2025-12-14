/**
 * Drizzle Kit Configuration for Cloudflare D1
 *
 * This configuration enables schema-driven migrations for the D1 database.
 *
 * Commands:
 * - bun run db:generate - Generate SQL migration from schema changes (no credentials needed)
 * - bun run db:push - Push schema changes directly to D1 (requires credentials)
 * - bun run db:studio - Open Drizzle Studio for database inspection (requires credentials)
 *
 * For push/pull/studio commands, set these environment variables:
 * - CLOUDFLARE_ACCOUNT_ID
 * - CLOUDFLARE_DATABASE_ID
 * - CLOUDFLARE_D1_TOKEN
 */
import { defineConfig } from "drizzle-kit";

// Check if D1 credentials are available
const hasD1Credentials =
    process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_DATABASE_ID && process.env.CLOUDFLARE_D1_TOKEN;

// Base configuration for generate command (no database connection needed)
const baseConfig = {
    // Output directory for generated migration files
    out: "./migrations",

    // Path to Drizzle ORM schema file
    schema: "./src/lib/server/schema.ts",

    // SQLite dialect for Cloudflare D1
    dialect: "sqlite" as const,

    // Verbose output for debugging
    verbose: true,

    // Strict mode for safer migrations
    strict: true,

    // Enable breakpoints between statements in migrations
    breakpoints: true
};

// Export config with or without D1 driver based on credentials availability
export default defineConfig(
    hasD1Credentials
        ? {
              ...baseConfig,
              // Cloudflare D1 HTTP driver for remote operations
              driver: "d1-http",
              // D1 credentials from environment variables
              dbCredentials: {
                  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
                  databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
                  token: process.env.CLOUDFLARE_D1_TOKEN!
              }
          }
        : baseConfig
);
