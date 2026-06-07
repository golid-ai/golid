package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/golid-ai/golid/backend/internal/config"
	"github.com/golid-ai/golid/backend/internal/db"
	"github.com/golid-ai/golid/backend/internal/logger"
	"github.com/golid-ai/golid/backend/internal/middleware"
	"github.com/golid-ai/golid/backend/internal/observability"
	"github.com/golid-ai/golid/backend/internal/queue"
	"github.com/golid-ai/golid/backend/internal/wire"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", slog.String("error", err.Error()))
		os.Exit(1)
	}

	logger.Init(cfg.Environment)
	logger.Info("starting API",
		slog.String("env", cfg.Environment),
		slog.String("port", cfg.Port),
	)

	ctx := context.Background()
	dbCfg := db.DefaultConfig(cfg.DatabaseURL)
	dbCfg.MaxConns = cfg.DBMaxConns
	dbCfg.MinConns = cfg.DBMinConns
	if err := db.Init(ctx, dbCfg); err != nil {
		logger.Error("failed to initialize database", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer db.Close()

	tracerShutdown := initTracing(cfg)
	defer func() {
		if err := tracerShutdown(context.Background()); err != nil {
			logger.Error("tracer shutdown failed", slog.String("error", err.Error()))
		}
	}()

	initRateLimiterRedis(ctx, cfg.RedisURL)

	jobQueue := queue.New(cfg.RedisURL)
	defer jobQueue.Close() //nolint:errcheck // best-effort cleanup
	if jobQueue.IsConfigured() {
		logger.Info("job queue: using Redis")
	} else {
		logger.Info("job queue: using goroutines (REDIS_URL not set)")
	}

	svcs := wire.BuildServices(ctx, cfg, db.Pool())
	handlers := wire.BuildHandlers(svcs, cfg, jobQueue)

	tokenCleanupDone := startTokenCleanup(svcs)

	e := newEcho(cfg)
	wire.RegisterRoutes(e, handlers, svcs, cfg, middleware.JWTAuth(cfg.JWTSecret))

	go func() {
		logger.Info("server listening", slog.String("port", cfg.Port))
		if err := e.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := e.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown error", slog.String("error", err.Error()))
	}

	svcs.SSEHub.Shutdown()
	close(tokenCleanupDone)

	logger.Info("server stopped")
}

// initTracing wires the OTLP tracer if OTEL_ENDPOINT is set. Returns
// the shutdown function regardless (no-op when tracing is disabled)
// so main can defer it without a nil check.
func initTracing(cfg *config.Config) func(context.Context) error {
	shutdown, err := observability.InitTracer(cfg.OTELEndpoint, cfg.OTELServiceName, cfg.Environment, cfg.OTELSampleRatio)
	if err != nil {
		logger.Error("tracer init failed", slog.String("error", err.Error()))
	}
	if cfg.OTELEndpoint != "" {
		logger.Info("tracing: exporting to OTLP", slog.String("endpoint", cfg.OTELEndpoint))
	}
	return shutdown
}
