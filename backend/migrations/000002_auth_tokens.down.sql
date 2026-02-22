-- Migration: 000002_auth_tokens (down)
-- Remove password reset and email verification fields
-- ============================================================================

DROP INDEX IF EXISTS idx_users_reset_selector;
DROP INDEX IF EXISTS idx_users_verification_token;

ALTER TABLE users DROP COLUMN IF EXISTS password_reset_expires;
ALTER TABLE users DROP COLUMN IF EXISTS password_reset_verifier_hash;
ALTER TABLE users DROP COLUMN IF EXISTS password_reset_selector;
ALTER TABLE users DROP COLUMN IF EXISTS verification_token;
