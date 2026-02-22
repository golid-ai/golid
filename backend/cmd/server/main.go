package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"

	"github.com/golid-ai/golid/backend/internal/config"
	"github.com/golid-ai/golid/backend/internal/db"
	"github.com/golid-ai/golid/backend/internal/handler"
	"github.com/golid-ai/golid/backend/internal/logger"
	"github.com/golid-ai/golid/backend/internal/middleware"
	"github.com/golid-ai/golid/backend/internal/observability"
	"github.com/golid-ai/golid/backend/internal/queue"
	"github.com/golid-ai/golid/backend/internal/service"
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

	pool := db.Pool()

	// Observability (opt-in via OTEL_ENDPOINT + METRICS_ENABLED)
	tracerShutdown, err := observability.InitTracer(cfg.OTELEndpoint, cfg.OTELServiceName, cfg.Environment, cfg.OTELSampleRatio)
	if err != nil {
		logger.Error("tracer init failed", slog.String("error", err.Error()))
	}
	defer func() {
		if err := tracerShutdown(context.Background()); err != nil {
			logger.Error("tracer shutdown failed", slog.String("error", err.Error()))
		}
	}()
	if cfg.OTELEndpoint != "" {
		logger.Info("tracing: exporting to OTLP", slog.String("endpoint", cfg.OTELEndpoint))
	}

	// Redis (opt-in — enables job queue + persistent rate limiting)
	if cfg.RedisURL != "" {
		opt, err := redis.ParseURL(cfg.RedisURL)
		if err != nil {
			logger.Error("invalid REDIS_URL", slog.String("error", err.Error()))
		} else {
			redisClient := redis.NewClient(opt)
			if err := redisClient.Ping(ctx).Err(); err != nil {
				logger.Warn("Redis not reachable, falling back to in-memory",
					slog.String("error", err.Error()))
			} else {
				middleware.SetRedisClient(redisClient)
				logger.Info("rate limiter: using Redis")
			}
		}
	}

	// Job queue (opt-in via REDIS_URL)
	jobQueue := queue.New(cfg.RedisURL)
	defer jobQueue.Close() //nolint:errcheck // best-effort cleanup
	if jobQueue.IsConfigured() {
		logger.Info("job queue: using Redis")
	} else {
		logger.Info("job queue: using goroutines (REDIS_URL not set)")
	}

	// Services
	sseHub := service.NewSSEHub(cfg.SSETicketTTL)
	authService := service.NewAuthService(pool, cfg.JWTSecret, cfg.AppName, cfg.JWTAccessDuration, cfg.JWTRefreshDuration, cfg.PasswordResetTTL)
	userService := service.NewUserService(pool)
	emailService := service.NewEmailService(service.EmailConfig{
		APIKey:           cfg.MailgunAPIKey,
		Domain:           cfg.MailgunDomain,
		BaseURL:          cfg.MailgunBaseURL,
		FrontendURL:      cfg.FrontendURL,
		DevEmailOverride: cfg.DevEmailOverride,
		AppName:          cfg.AppName,
		Timeout:          cfg.EmailTimeout,
		PasswordResetTTL: cfg.PasswordResetTTL,
	})

	featureService := service.NewFeatureService(pool, cfg.FeatureCacheTTL)

	// Periodic cleanup of expired refresh tokens (every hour)
	tokenCleanupDone := make(chan struct{})
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := authService.CleanupExpiredTokens(context.Background()); err != nil {
					logger.Error("failed to clean expired tokens", slog.String("error", err.Error()))
				}
			case <-tokenCleanupDone:
				return
			}
		}
	}()

	// Handlers
	authHandler := handler.NewAuthHandler(authService, emailService, jobQueue, cfg.RetryAttempts, cfg.RetryDelay)
	userHandler := handler.NewUserHandler(userService)
	sseHandler := handler.NewSSEHandler(sseHub, cfg.SSEKeepaliveInterval)
	featureHandler := handler.NewFeatureHandler(featureService)

	// Echo
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	middleware.Setup(e, cfg)

	// OTel tracing middleware (opt-in)
	if cfg.OTELEndpoint != "" {
		e.Use(otelecho.Middleware(cfg.OTELServiceName))
	}

	// Prometheus metrics middleware (opt-in)
	if cfg.MetricsEnabled {
		e.Use(middleware.Metrics())
		e.GET("/metrics", echo.WrapHandler(promhttp.Handler()))
		logger.Info("metrics: Prometheus /metrics endpoint enabled")
	}

	e.GET("/health", healthHandler)
	e.GET("/ready", readyHandler)

	api := e.Group("/api/v1")
	api.Use(middleware.APIVersion("v1"))
	api.Use(middleware.RateLimiter(cfg.RateLimitRequests, cfg.RateLimitWindow))

	// Public feature flags endpoint (returns {key: bool} map, no auth required)
	api.GET("/features", featureHandler.ListEnabled)

	// Public auth routes (with strict rate limiting)
	authGroup := api.Group("/auth")
	authGroup.Use(middleware.StrictRateLimiter(cfg.AuthRateLimitRequests))
	authGroup.POST("/register", authHandler.Register)
	authGroup.POST("/login", authHandler.Login)
	authGroup.POST("/refresh", authHandler.Refresh)
	authGroup.POST("/forgot-password", authHandler.ForgotPassword)
	authGroup.GET("/verify-reset-token", authHandler.VerifyResetToken)
	authGroup.POST("/reset-password", authHandler.ResetPassword)
	authGroup.GET("/verify-email", authHandler.VerifyEmail)
	authGroup.POST("/resend-verification", authHandler.ResendVerification)

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.JWTAuth(cfg.JWTSecret))

	protected.POST("/auth/logout", authHandler.Logout)
	protected.PUT("/auth/password", authHandler.ChangePassword)
	protected.GET("/me", userHandler.Me)
	protected.PUT("/me", userHandler.UpdateProfile)

	// Feature flag admin routes
	admin := protected.Group("/admin")
	admin.Use(middleware.RequireRole("admin"))
	admin.GET("/features", featureHandler.List)
	admin.PUT("/features/:key", featureHandler.Set)

	// SSE routes
	api.GET("/events/stream", sseHandler.Stream) // ticket auth (not JWT — EventSource can't set headers)
	protected.POST("/events/ticket", sseHandler.Ticket)
	if cfg.IsDevelopment() {
		protected.POST("/events/demo", sseHandler.Demo)
	}

	// Start server
	go func() {
		logger.Info("server listening", slog.String("port", cfg.Port))
		if err := e.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := e.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown error", slog.String("error", err.Error()))
	}

	sseHub.Shutdown()
	close(tokenCleanupDone)

	logger.Info("server stopped")
}

// healthHandler returns 200 if the process is alive. No dependency checks.
// Use for liveness probes — should never fail unless the process is deadlocked.
func healthHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":  "healthy",
		"time":    time.Now().UTC().Format(time.RFC3339),
		"version": getVersion(),
	})
}

// readyHandler returns 200 if the process can serve traffic (DB reachable).
// Use for readiness/startup probes — fails when dependencies are unavailable.
func readyHandler(c echo.Context) error {
	ctx := c.Request().Context()

	if err := db.Health(ctx); err != nil {
		logger.Error("readiness check failed", slog.String("error", err.Error()))
		return c.JSON(http.StatusServiceUnavailable, map[string]interface{}{
			"status":   "not ready",
			"database": "unhealthy",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":   "ready",
		"database": "healthy",
	})
}

func getVersion() string {
	if v := os.Getenv("VERSION"); v != "" {
		return v
	}
	return "dev"
}
