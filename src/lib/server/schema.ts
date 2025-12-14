/**
 * Drizzle ORM schema for Better Auth tables.
 *
 * These schemas match the D1 database tables created in migrations.
 * Column names use snake_case as required by Better Auth's Drizzle adapter.
 */
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Users table - stores authenticated user profiles
 */
export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    name: text("name"),
    image: text("image"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

/**
 * Sessions table - tracks active user sessions
 */
export const sessions = sqliteTable(
    "sessions",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        token: text("token").notNull().unique(),
        expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
    },
    (table) => [index("idx_sessions_user_id").on(table.userId)]
);

/**
 * Accounts table - stores OAuth provider connections
 */
export const accounts = sqliteTable(
    "accounts",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
        refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
        scope: text("scope"),
        idToken: text("id_token"),
        password: text("password"),
        createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
    },
    (table) => [
        index("idx_accounts_user_id").on(table.userId),
        uniqueIndex("idx_accounts_provider").on(table.providerId, table.accountId)
    ]
);

/**
 * Verifications table - for OAuth state and email verification tokens
 */
export const verifications = sqliteTable(
    "verifications",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
        createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
    },
    (table) => [index("idx_verifications_identifier").on(table.identifier)]
);
