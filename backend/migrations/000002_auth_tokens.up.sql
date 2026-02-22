-- Migration: 000002_auth_tokens
-- Add password reset and email verification fields to users table
-- Uses selector.verifier pattern for O(1) lookup on password reset
-- ============================================================================

-- Add verification token for email verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT UNIQUE;

-- Add password reset fields using selector.verifier pattern
-- selector: random string for O(1) database lookup (indexed)
-- verifier_hash: hashed verifier for security (not indexed, compared in app)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_selector TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_verifier_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_reset_selector ON users(password_reset_selector) WHERE password_reset_selector IS NOT NULL;
