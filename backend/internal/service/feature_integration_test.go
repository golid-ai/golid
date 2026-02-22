//go:build integration

package service

import (
	"context"
	"testing"
	"time"

	"github.com/golid-ai/golid/backend/internal/testutil"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestFeatureService_SetAndIsEnabled_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		svc := NewFeatureService(pool, 30*time.Second)
		ctx := context.Background()

		if err := svc.Set(ctx, "dark_mode", true); err != nil {
			t.Fatalf("Set() error = %v", err)
		}

		if !svc.IsEnabled(ctx, "dark_mode") {
			t.Error("IsEnabled(dark_mode) = false, want true")
		}

		if err := svc.Set(ctx, "dark_mode", false); err != nil {
			t.Fatalf("Set() toggle error = %v", err)
		}

		svc.cacheMu.Lock()
		svc.cacheAt = time.Time{}
		svc.cacheMu.Unlock()

		if svc.IsEnabled(ctx, "dark_mode") {
			t.Error("IsEnabled(dark_mode) after disable = true, want false")
		}
	})
}

func TestFeatureService_IsEnabled_UnknownKey_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		svc := NewFeatureService(pool, 30*time.Second)
		ctx := context.Background()

		if svc.IsEnabled(ctx, "nonexistent_flag") {
			t.Error("IsEnabled(nonexistent_flag) = true, want false for unknown keys")
		}
	})
}

func TestFeatureService_CacheExpiry_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		svc := NewFeatureService(pool, 1*time.Millisecond)
		ctx := context.Background()

		if err := svc.Set(ctx, "cached_flag", true); err != nil {
			t.Fatalf("Set() error = %v", err)
		}

		if !svc.IsEnabled(ctx, "cached_flag") {
			t.Error("IsEnabled should return true immediately after Set")
		}

		time.Sleep(5 * time.Millisecond)

		_, err := pool.Exec(ctx, "UPDATE feature_flags SET enabled = false WHERE key = 'cached_flag'")
		if err != nil {
			t.Fatalf("direct DB update error = %v", err)
		}

		if svc.IsEnabled(ctx, "cached_flag") {
			t.Error("IsEnabled should return false after cache expiry and DB update")
		}
	})
}

func TestFeatureService_List_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		svc := NewFeatureService(pool, 30*time.Second)
		ctx := context.Background()

		if err := svc.Set(ctx, "flag_a", true); err != nil {
			t.Fatalf("Set(flag_a) error = %v", err)
		}
		if err := svc.Set(ctx, "flag_b", false); err != nil {
			t.Fatalf("Set(flag_b) error = %v", err)
		}

		flags, err := svc.List(ctx)
		if err != nil {
			t.Fatalf("List() error = %v", err)
		}

		if len(flags) < 2 {
			t.Fatalf("List() returned %d flags, want >= 2", len(flags))
		}

		found := map[string]bool{}
		for _, f := range flags {
			found[f.Key] = f.Enabled
		}
		if !found["flag_a"] {
			t.Error("flag_a should be enabled")
		}
		if found["flag_b"] {
			t.Error("flag_b should be disabled")
		}
	})
}
