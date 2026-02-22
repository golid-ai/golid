-- Migration: 000004_feature_flags
-- Feature flag toggles with in-memory cache (TTL-based).
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    key         TEXT PRIMARY KEY,
    enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER feature_flags_updated_at BEFORE
UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at();
