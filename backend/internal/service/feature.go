package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/singleflight"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/logger"
)

// FeatureFlag represents a feature toggle.
type FeatureFlag struct {
	Key         string `json:"key"`
	Enabled     bool   `json:"enabled"`
	Description string `json:"description"`
}

// FeatureService provides feature flag operations with an in-memory cache.
// The cache refreshes lazily when TTL expires. Set() invalidates the cache
// immediately for the calling instance; other instances refresh within the TTL window.
type FeatureService struct {
	pool     *pgxpool.Pool
	cache    map[string]bool
	cacheMu  sync.RWMutex
	cacheAt  time.Time
	cacheTTL time.Duration
	sflight  singleflight.Group
}

func NewFeatureService(pool *pgxpool.Pool, cacheTTL time.Duration) *FeatureService {
	if cacheTTL == 0 {
		cacheTTL = 30 * time.Second
	}
	return &FeatureService{
		pool:     pool,
		cache:    make(map[string]bool),
		cacheTTL: cacheTTL,
	}
}

// IsEnabled returns whether a feature flag is enabled.
// Returns false for unknown keys (safe default).
func (s *FeatureService) IsEnabled(ctx context.Context, key string) bool {
	s.cacheMu.RLock()
	if time.Since(s.cacheAt) < s.cacheTTL {
		enabled := s.cache[key]
		s.cacheMu.RUnlock()
		return enabled
	}
	s.cacheMu.RUnlock()

	if _, _, shared := s.sflight.Do("refresh", func() (interface{}, error) {
		s.refresh(ctx)
		return nil, nil
	}); shared {
		logger.Debug("feature cache refresh was shared via singleflight")
	}

	s.cacheMu.RLock()
	defer s.cacheMu.RUnlock()
	return s.cache[key]
}

// Set creates or updates a feature flag.
// Invalidates the local cache immediately.
func (s *FeatureService) Set(ctx context.Context, key string, enabled bool) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO feature_flags (key, enabled, updated_at)
		 VALUES ($1, $2, NOW())
		 ON CONFLICT (key) DO UPDATE SET enabled = $2, updated_at = NOW()`,
		key, enabled)
	if err != nil {
		return apperror.Internal(fmt.Errorf("set feature flag: %w", err))
	}
	s.cacheMu.Lock()
	s.cache[key] = enabled
	s.cacheMu.Unlock()
	return nil
}

// List returns all feature flags with descriptions. Admin-only.
func (s *FeatureService) List(ctx context.Context) ([]FeatureFlag, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT key, enabled, description FROM feature_flags ORDER BY key`)
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("list feature flags: %w", err))
	}
	defer rows.Close()

	var flags []FeatureFlag
	for rows.Next() {
		var f FeatureFlag
		if err := rows.Scan(&f.Key, &f.Enabled, &f.Description); err != nil {
			return nil, apperror.Internal(fmt.Errorf("scan feature flag: %w", err))
		}
		flags = append(flags, f)
	}
	if err := rows.Err(); err != nil {
		return nil, apperror.Internal(fmt.Errorf("iterate feature flags: %w", err))
	}
	return flags, nil
}

// ListEnabled returns a key->bool map of all flags. Public endpoint.
func (s *FeatureService) ListEnabled(ctx context.Context) (map[string]bool, error) {
	rows, err := s.pool.Query(ctx, `SELECT key, enabled FROM feature_flags`)
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("list enabled flags: %w", err))
	}
	defer rows.Close()

	result := make(map[string]bool)
	for rows.Next() {
		var key string
		var enabled bool
		if err := rows.Scan(&key, &enabled); err != nil {
			return nil, apperror.Internal(fmt.Errorf("scan feature flag: %w", err))
		}
		result[key] = enabled
	}
	if err := rows.Err(); err != nil {
		return nil, apperror.Internal(fmt.Errorf("iterate feature flags: %w", err))
	}
	return result, nil
}

func (s *FeatureService) refresh(ctx context.Context) {
	result, err := s.ListEnabled(ctx)
	if err != nil {
		logger.Error("failed to refresh feature flags", "error", err.Error())
		return
	}
	s.cacheMu.Lock()
	s.cache = result
	s.cacheAt = time.Now()
	s.cacheMu.Unlock()
}
