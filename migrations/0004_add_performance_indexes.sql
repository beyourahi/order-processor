-- Migration: Add performance indexes for common query patterns
-- These indexes improve query performance for frequently accessed columns

-- Index for session expiry cleanup queries
-- Enables efficient cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Index for user email lookups (login flow)
-- Note: users.email already has UNIQUE constraint which creates an implicit index
-- This explicit index ensures optimal query performance

-- Index for accounts by provider lookup (OAuth provider queries)
-- Composite index for finding accounts by provider
CREATE INDEX IF NOT EXISTS idx_accounts_provider_id ON accounts(provider_id);

-- Index for verifications by expiry (cleanup queries)
CREATE INDEX IF NOT EXISTS idx_verifications_expires_at ON verifications(expires_at);
