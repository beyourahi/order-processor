// MUST be snake_case columns — Better Auth's Drizzle adapter (usePlural: true)
// rejects camelCase silently (see CLAUDE.md warning #3).
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    name: text("name"),
    image: text("image"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

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

// Better Auth's D1 rate limiter table. lastRequest is Unix-ms (integer), NOT a
// Date — adapter expects raw numeric epoch.
export const rateLimits = sqliteTable(
    "rate_limits",
    {
        id: text("id").primaryKey(),
        key: text("key").notNull(),
        count: integer("count").notNull(),
        lastRequest: integer("last_request").notNull()
    },
    (table) => [index("idx_rate_limits_key").on(table.key)]
);

export const brandSettings = sqliteTable(
    "brand_settings",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .unique()
            .references(() => users.id, { onDelete: "cascade" }),
        contactName: text("contact_name"),
        contactPhone: text("contact_phone"),
        merchantId: text("merchant_id"),
        selectedCourier: text("selected_courier"),
        createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
    },
    (table) => [index("idx_brand_settings_user_id").on(table.userId)]
);

export const aiConversations = sqliteTable(
    "ai_conversations",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date()),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date())
    },
    (table) => [index("idx_ai_conversations_user_updated").on(table.userId, table.updatedAt)]
);

export const aiMessages = sqliteTable(
    "ai_messages",
    {
        id: text("id").primaryKey(),
        conversationId: text("conversation_id")
            .notNull()
            .references(() => aiConversations.id, { onDelete: "cascade" }),
        role: text("role").$type<"user" | "assistant">().notNull(),
        content: text("content").notNull(),
        toolCalls: text("tool_calls", { mode: "json" }).$type<Array<{ id: string; name: string; args: unknown }>>(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date())
    },
    (table) => [index("idx_ai_messages_conversation_created").on(table.conversationId, table.createdAt)]
);
