-- ==============================================================================
-- DEVELOPMENT SEED DATA
-- Only runs in development environment (never in production)
-- Creates default accounts for local development & testing
--
-- Accounts:
--   admin@example.com  / Password123!  (admin)
--   user@example.com   / Password123!  (user)
--
-- Password hash = bcrypt("Password123!")
-- ==============================================================================

-- Stable UUIDs for cross-referencing
-- admin: a0000000-0000-0000-0000-000000000001
-- user:  a0000000-0000-0000-0000-000000000002

-- Admin user
INSERT INTO users (id, email, password_hash, type, email_verified, first_name, last_name, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@example.com',
  '$2a$10$lN1V3tFpe5cMX4j00HkgRey0WhpzkNparR6TrD5lyr5FftdrGms2O',
  'admin', true, 'Admin', 'User', NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  email_verified = true, type = 'admin', first_name = 'Admin', last_name = 'User';

-- Regular user
INSERT INTO users (id, email, password_hash, type, email_verified, first_name, last_name, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'user@example.com',
  '$2a$10$lN1V3tFpe5cMX4j00HkgRey0WhpzkNparR6TrD5lyr5FftdrGms2O',
  'user', true, 'Test', 'User', NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  email_verified = true, first_name = 'Test', last_name = 'User';

-- Feature flags
INSERT INTO feature_flags (key, enabled, description) VALUES
    ('maintenance_mode', false, 'Show maintenance page to all users'),
    ('new_dashboard', false, 'Enable redesigned dashboard')
ON CONFLICT (key) DO NOTHING;
