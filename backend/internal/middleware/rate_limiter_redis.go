package middleware

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/golid-ai/golid/backend/internal/logger"
)

// RedisRateLimiterStore implements Echo's RateLimiterStore using Redis.
// Uses a fixed-window counter (INCR + EXPIRE). Allows up to 2x burst
// at window boundaries — acceptable tradeoff for simplicity. Matches
// how most production rate limiters work (including GitHub's API).
type RedisRateLimiterStore struct {
	client *redis.Client
	burst  int
	window time.Duration
}

func NewRedisRateLimiterStore(client *redis.Client, burst int, window time.Duration) *RedisRateLimiterStore {
	return &RedisRateLimiterStore{client: client, burst: burst, window: window}
}

func (s *RedisRateLimiterStore) Allow(identifier string) (bool, error) {
	ctx := context.Background()
	key := fmt.Sprintf("rl:%s", identifier)

	pipe := s.client.TxPipeline()
	incr := pipe.Incr(ctx, key)
	pipe.Expire(ctx, key, s.window)
	_, err := pipe.Exec(ctx)
	if err != nil {
		logger.Error("redis rate limiter error, failing open",
			slog.String("identifier", identifier),
			slog.String("error", err.Error()),
		)
		return true, err
	}
	return incr.Val() <= int64(s.burst), nil
}
