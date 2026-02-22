-- Reverse: restore plaintext verification_token column
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_verification_token
  ON users(verification_token) WHERE verification_token IS NOT NULL;

DROP INDEX IF EXISTS idx_users_verification_selector;
ALTER TABLE users DROP COLUMN IF EXISTS verification_selector;
ALTER TABLE users DROP COLUMN IF EXISTS verification_verifier_hash;
