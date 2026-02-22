-- Migration: 000005_verification_token_hash
-- Apply selector.verifier pattern to email verification tokens
-- Mirrors the password reset pattern from 000002_auth_tokens
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_selector TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_verifier_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_users_verification_selector
  ON users(verification_selector) WHERE verification_selector IS NOT NULL;

-- Drop the old plaintext column and its index
DROP INDEX IF EXISTS idx_users_verification_token;
ALTER TABLE users DROP COLUMN IF EXISTS verification_token;
