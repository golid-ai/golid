package main

import (
	"context"
	"log/slog"

	"github.com/labstack/echo/v4"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"

	"github.com/golid-ai/golid/backend/internal/config"
	"github.com/golid-ai/golid/backend/internal/logger"
	"github.com/golid-ai/golid/backend/internal/middleware"
)

// initRateLimiterRedis wires a Redis client into the rate-limiter
// middleware when REDIS_URL is set. Failures are logged and the
// middleware silently falls back to in-memory limits — never fatal.
//
// Stays in cmd/server (not internal/wire) because it is process
// bootstrap, not service wiring: it mutates the middleware package's
// global state during startup.
func initRateLimiterRedis(ctx context.Context, redisURL string) {
	if redisURL == "" {
		return
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		logger.Error("invalid REDIS_URL", slog.String("error", err.Error()))
		return
	}

	client := redis.NewClient(opt)
	if err := client.Ping(ctx).Err(); err != nil {
		logger.Warn("Redis not reachable, falling back to in-memory",
			slog.String("error", err.Error()))
		return
	}

	middleware.SetRedisClient(client)
	logger.Info("rate limiter: using Redis")
}

// newEcho builds the Echo instance with all bootstrap-level middleware
// (recovery, logging, tracing, metrics) plus the /health and /ready
// endpoints. Per-API-version groups and routes are mounted by
// wire.RegisterRoutes; this function only sets up the surface that
// exists outside /api/v1.
func newEcho(cfg *config.Config) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	middleware.Setup(e, cfg)

	if cfg.OTELEndpoint != "" {
		e.Use(otelecho.Middleware(cfg.OTELServiceName))
	}

	if cfg.MetricsEnabled {
		e.Use(middleware.Metrics())
		e.GET("/metrics", echo.WrapHandler(promhttp.Handler()))
		logger.Info("metrics: Prometheus /metrics endpoint enabled")
	}

	e.GET("/health", healthHandler)
	e.HEAD("/health", healthHandler)
	e.GET("/ready", readyHandler)
	e.HEAD("/ready", readyHandler)

	return e
}
