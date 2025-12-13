-- Fix column names from camelCase to snake_case for Better Auth compatibility
-- Better Auth's Drizzle adapter expects snake_case column names

-- users table
ALTER TABLE users RENAME COLUMN emailVerified TO email_verified;
ALTER TABLE users RENAME COLUMN createdAt TO created_at;
ALTER TABLE users RENAME COLUMN updatedAt TO updated_at;

-- sessions table
ALTER TABLE sessions RENAME COLUMN userId TO user_id;
ALTER TABLE sessions RENAME COLUMN expiresAt TO expires_at;
ALTER TABLE sessions RENAME COLUMN ipAddress TO ip_address;
ALTER TABLE sessions RENAME COLUMN userAgent TO user_agent;
ALTER TABLE sessions RENAME COLUMN createdAt TO created_at;
ALTER TABLE sessions RENAME COLUMN updatedAt TO updated_at;

-- accounts table
ALTER TABLE accounts RENAME COLUMN userId TO user_id;
ALTER TABLE accounts RENAME COLUMN accountId TO account_id;
ALTER TABLE accounts RENAME COLUMN providerId TO provider_id;
ALTER TABLE accounts RENAME COLUMN accessToken TO access_token;
ALTER TABLE accounts RENAME COLUMN refreshToken TO refresh_token;
ALTER TABLE accounts RENAME COLUMN accessTokenExpiresAt TO access_token_expires_at;
ALTER TABLE accounts RENAME COLUMN refreshTokenExpiresAt TO refresh_token_expires_at;
ALTER TABLE accounts RENAME COLUMN idToken TO id_token;
ALTER TABLE accounts RENAME COLUMN createdAt TO created_at;
ALTER TABLE accounts RENAME COLUMN updatedAt TO updated_at;

-- verifications table
ALTER TABLE verifications RENAME COLUMN expiresAt TO expires_at;
ALTER TABLE verifications RENAME COLUMN createdAt TO created_at;
ALTER TABLE verifications RENAME COLUMN updatedAt TO updated_at;

-- Fix indexes to use new column names
DROP INDEX IF EXISTS idx_sessions_userId;
DROP INDEX IF EXISTS idx_accounts_userId;
DROP INDEX IF EXISTS idx_accounts_provider;
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider_id, account_id);
