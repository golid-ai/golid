package wire

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/config"
	"github.com/golid-ai/golid/backend/internal/queue"
)

const testJWTSecret = "wire-test-jwt-secret-at-least-32-chars-long!"

func testWireConfig() *config.Config {
	return &config.Config{
		Environment:           "development",
		JWTSecret:             testJWTSecret,
		JWTAccessDuration:     15 * time.Minute,
		JWTRefreshDuration:    7 * 24 * time.Hour,
		RateLimitRequests:     1000,
		RateLimitWindow:       time.Minute,
		AuthRateLimitRequests: 100,
		CSRFEnforce:           false,
		AppName:               "golid-wire-test",
		FeatureCacheTTL:       30 * time.Second,
		SSETicketTTL:          30 * time.Second,
		SSEKeepaliveInterval:  30 * time.Second,
		RetryAttempts:         3,
		RetryDelay:            time.Second,
		PasswordResetTTL:      time.Hour,
		EmailTimeout:          30 * time.Second,
		FrontendURL:           "http://localhost:3000",
	}
}

func newTestPool(t *testing.T) *pgxpool.Pool {
	t.Helper()

	pool, err := pgxpool.New(context.Background(), "postgres://localhost:59999/wire_test?sslmode=disable")
	if err != nil {
		t.Fatalf("create test pool: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

func stubJWTMW() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return next
	}
}

func buildWireStack(t *testing.T) (*Handlers, *Services, *config.Config) {
	t.Helper()

	cfg := testWireConfig()
	pool := newTestPool(t)
	svcs := BuildServices(context.Background(), cfg, pool)
	jobQueue := queue.New("")
	h := BuildHandlers(svcs, cfg, jobQueue)
	return h, svcs, cfg
}
