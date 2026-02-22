package middleware

import (
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

func newTestRedisClient(t *testing.T) (*redis.Client, *miniredis.Miniredis) {
	t.Helper()
	mr := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	return client, mr
}

func TestRedisRateLimiter_AllowWithinBurst(t *testing.T) {
	client, _ := newTestRedisClient(t)
	store := NewRedisRateLimiterStore(client, 5, time.Minute)

	for i := 0; i < 5; i++ {
		allowed, err := store.Allow("test-ip")
		if err != nil {
			t.Fatalf("request %d: unexpected error: %v", i+1, err)
		}
		if !allowed {
			t.Fatalf("request %d: should be allowed (within burst of 5)", i+1)
		}
	}
}

func TestRedisRateLimiter_ExceedBurst(t *testing.T) {
	client, _ := newTestRedisClient(t)
	store := NewRedisRateLimiterStore(client, 3, time.Minute)

	for i := 0; i < 3; i++ {
		allowed, _ := store.Allow("test-ip")
		if !allowed {
			t.Fatalf("request %d: should be allowed", i+1)
		}
	}

	allowed, err := store.Allow("test-ip")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if allowed {
		t.Error("request 4: should be denied (burst limit is 3)")
	}
}

func TestRedisRateLimiter_SeparateIdentifiers(t *testing.T) {
	client, _ := newTestRedisClient(t)
	store := NewRedisRateLimiterStore(client, 1, time.Minute)

	allowed, _ := store.Allow("ip-1")
	if !allowed {
		t.Error("ip-1 first request should be allowed")
	}

	allowed, _ = store.Allow("ip-2")
	if !allowed {
		t.Error("ip-2 first request should be allowed (separate counter)")
	}

	allowed, _ = store.Allow("ip-1")
	if allowed {
		t.Error("ip-1 second request should be denied (burst=1)")
	}
}

func TestRedisRateLimiter_WindowExpiry(t *testing.T) {
	client, mr := newTestRedisClient(t)
	store := NewRedisRateLimiterStore(client, 1, time.Minute)

	allowed, _ := store.Allow("test-ip")
	if !allowed {
		t.Fatal("first request should be allowed")
	}

	allowed, _ = store.Allow("test-ip")
	if allowed {
		t.Fatal("second request should be denied")
	}

	mr.FastForward(61 * time.Second)

	allowed, _ = store.Allow("test-ip")
	if !allowed {
		t.Error("request after window expiry should be allowed")
	}
}

func TestRedisRateLimiter_FailOpen(t *testing.T) {
	client, mr := newTestRedisClient(t)
	store := NewRedisRateLimiterStore(client, 5, time.Minute)

	mr.Close()

	allowed, err := store.Allow("test-ip")
	if err == nil {
		t.Error("expected error when Redis is closed")
	}
	if !allowed {
		t.Error("should fail open (return true) when Redis is unavailable")
	}
}
