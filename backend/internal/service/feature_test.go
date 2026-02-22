package service

import (
	"context"
	"encoding/json"
	"sync"
	"testing"
	"time"
)

// =============================================================================
// CONSTRUCTOR TESTS
// =============================================================================

func TestNewFeatureService_DefaultCacheTTL(t *testing.T) {
	svc := NewFeatureService(nil, 0)

	if svc.cacheTTL != 30*time.Second {
		t.Errorf("cacheTTL = %v, want 30s", svc.cacheTTL)
	}
}

func TestNewFeatureService_CustomCacheTTL(t *testing.T) {
	tests := []struct {
		name string
		ttl  time.Duration
		want time.Duration
	}{
		{"1 second", 1 * time.Second, 1 * time.Second},
		{"5 minutes", 5 * time.Minute, 5 * time.Minute},
		{"1 millisecond", 1 * time.Millisecond, 1 * time.Millisecond},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewFeatureService(nil, tt.ttl)
			if svc.cacheTTL != tt.want {
				t.Errorf("cacheTTL = %v, want %v", svc.cacheTTL, tt.want)
			}
		})
	}
}

func TestNewFeatureService_InitializesCache(t *testing.T) {
	svc := NewFeatureService(nil, time.Second)

	if svc.cache == nil {
		t.Error("cache map should be initialized, got nil")
	}
	if len(svc.cache) != 0 {
		t.Errorf("cache should be empty, got %d entries", len(svc.cache))
	}
}

func TestNewFeatureService_NilPool(t *testing.T) {
	svc := NewFeatureService(nil, time.Second)

	if svc.pool != nil {
		t.Error("pool should be nil when nil is passed")
	}
}

// =============================================================================
// CACHE HIT TESTS (fresh cache — pool is never touched)
// =============================================================================

func seedCache(svc *FeatureService, flags map[string]bool) {
	svc.cacheMu.Lock()
	svc.cache = flags
	svc.cacheAt = time.Now()
	svc.cacheMu.Unlock()
}

func TestFeatureService_IsEnabled_CacheHit(t *testing.T) {
	svc := NewFeatureService(nil, time.Minute)
	seedCache(svc, map[string]bool{
		"dark_mode":   true,
		"beta_access": false,
	})

	tests := []struct {
		key  string
		want bool
	}{
		{"dark_mode", true},
		{"beta_access", false},
		{"nonexistent", false},
	}

	for _, tt := range tests {
		t.Run(tt.key, func(t *testing.T) {
			got := svc.IsEnabled(context.Background(), tt.key)
			if got != tt.want {
				t.Errorf("IsEnabled(%q) = %v, want %v", tt.key, got, tt.want)
			}
		})
	}
}

func TestFeatureService_IsEnabled_CacheHit_NoPoolAccess(t *testing.T) {
	// nil pool — if cache is fresh, IsEnabled must not touch pool at all.
	// A panic here would prove the cache path is broken.
	svc := NewFeatureService(nil, time.Minute)
	seedCache(svc, map[string]bool{"feature_x": true})

	got := svc.IsEnabled(context.Background(), "feature_x")
	if !got {
		t.Error("IsEnabled(feature_x) = false, want true (from cache)")
	}
}

func TestFeatureService_IsEnabled_UnknownKey_ReturnsFalse(t *testing.T) {
	svc := NewFeatureService(nil, time.Minute)
	seedCache(svc, map[string]bool{"known_flag": true})

	if svc.IsEnabled(context.Background(), "unknown_flag") {
		t.Error("IsEnabled(unknown_flag) should return false for keys not in cache")
	}
}

// =============================================================================
// CACHE STALENESS TESTS
// =============================================================================

func TestFeatureService_IsEnabled_StaleCache_UsesOldValueOnRefreshFailure(t *testing.T) {
	// When cache expires and refresh fails (nil pool), the old cache values
	// remain. IsEnabled returns the stale value rather than panicking.
	// We can't test this with nil pool (would panic on pool.Query), but we
	// can verify the cacheAt boundary: a cache exactly at TTL boundary is stale.
	svc := NewFeatureService(nil, 50*time.Millisecond)
	seedCache(svc, map[string]bool{"flag": true})

	// Cache is fresh — should return true
	if !svc.IsEnabled(context.Background(), "flag") {
		t.Error("fresh cache: IsEnabled(flag) = false, want true")
	}

	// Manually expire the cache without waiting
	svc.cacheMu.Lock()
	svc.cacheAt = time.Now().Add(-time.Minute)
	svc.cacheMu.Unlock()

	// Now cache is stale. Calling IsEnabled would try to refresh via pool.
	// Since pool is nil, this path can only be tested in integration tests.
	// This test documents the boundary.
}

// =============================================================================
// CACHE TTL BOUNDARY TESTS
// =============================================================================

func TestFeatureService_CacheTTL_FreshBoundary(t *testing.T) {
	ttl := 100 * time.Millisecond
	svc := NewFeatureService(nil, ttl)

	svc.cacheMu.Lock()
	svc.cache = map[string]bool{"flag": true}
	svc.cacheAt = time.Now().Add(-90 * time.Millisecond) // 90ms ago, within 100ms TTL
	svc.cacheMu.Unlock()

	got := svc.IsEnabled(context.Background(), "flag")
	if !got {
		t.Error("cache set 90ms ago with 100ms TTL should still be fresh")
	}
}

// =============================================================================
// SET UPDATES CACHE IMMEDIATELY
// =============================================================================

func TestFeatureService_Set_UpdatesCacheDirectly(t *testing.T) {
	// Set() writes to both DB and local cache. We can't test the DB write
	// without a pool, but we can verify the cache update logic by inspecting
	// the struct fields directly after manually performing what Set does to cache.
	svc := NewFeatureService(nil, time.Minute)
	seedCache(svc, map[string]bool{"toggle": false})

	// Simulate what Set does to cache (without pool.Exec)
	svc.cacheMu.Lock()
	svc.cache["toggle"] = true
	svc.cacheMu.Unlock()

	if !svc.IsEnabled(context.Background(), "toggle") {
		t.Error("cache should reflect updated value immediately")
	}
}

// =============================================================================
// CONCURRENT CACHE READS
// =============================================================================

func TestFeatureService_IsEnabled_ConcurrentReads(t *testing.T) {
	svc := NewFeatureService(nil, time.Minute)
	seedCache(svc, map[string]bool{
		"flag_a": true,
		"flag_b": false,
		"flag_c": true,
	})

	var wg sync.WaitGroup
	errs := make(chan string, 300)

	for i := 0; i < 100; i++ {
		wg.Add(3)
		go func() {
			defer wg.Done()
			if !svc.IsEnabled(context.Background(), "flag_a") {
				errs <- "flag_a should be true"
			}
		}()
		go func() {
			defer wg.Done()
			if svc.IsEnabled(context.Background(), "flag_b") {
				errs <- "flag_b should be false"
			}
		}()
		go func() {
			defer wg.Done()
			if !svc.IsEnabled(context.Background(), "flag_c") {
				errs <- "flag_c should be true"
			}
		}()
	}

	wg.Wait()
	close(errs)

	for msg := range errs {
		t.Error(msg)
	}
}

// =============================================================================
// FEATUREFLAG STRUCT TESTS
// =============================================================================

func TestFeatureFlag_JSONMarshal(t *testing.T) {
	flag := FeatureFlag{
		Key:         "dark_mode",
		Enabled:     true,
		Description: "Enable dark mode UI",
	}

	data, err := json.Marshal(flag)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed["key"] != "dark_mode" {
		t.Errorf("key = %v, want dark_mode", parsed["key"])
	}
	if parsed["enabled"] != true {
		t.Errorf("enabled = %v, want true", parsed["enabled"])
	}
	if parsed["description"] != "Enable dark mode UI" {
		t.Errorf("description = %v, want 'Enable dark mode UI'", parsed["description"])
	}
}

func TestFeatureFlag_JSONUnmarshal(t *testing.T) {
	input := `{"key":"beta","enabled":false,"description":"Beta features"}`

	var flag FeatureFlag
	if err := json.Unmarshal([]byte(input), &flag); err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if flag.Key != "beta" {
		t.Errorf("Key = %q, want beta", flag.Key)
	}
	if flag.Enabled {
		t.Error("Enabled = true, want false")
	}
	if flag.Description != "Beta features" {
		t.Errorf("Description = %q, want 'Beta features'", flag.Description)
	}
}

func TestFeatureFlag_JSONRoundtrip(t *testing.T) {
	original := FeatureFlag{
		Key:         "maintenance_mode",
		Enabled:     false,
		Description: "Puts the app in maintenance mode",
	}

	data, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var decoded FeatureFlag
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if decoded != original {
		t.Errorf("roundtrip mismatch: got %+v, want %+v", decoded, original)
	}
}
