package middleware

import (
	"errors"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/redis/go-redis/v9"
	"golang.org/x/time/rate"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/config"
	"github.com/golid-ai/golid/backend/internal/logger"
)

// Setup configures all middleware for the Echo server.
func Setup(e *echo.Echo, cfg *config.Config) {
	// Request ID (first, so it's available for logging)
	e.Use(middleware.RequestID())

	// Panic recovery (early, so panics in later middleware are caught)
	e.Use(middleware.RecoverWithConfig(middleware.RecoverConfig{
		LogErrorFunc: func(c echo.Context, err error, stack []byte) error {
			logger.FromEcho(c).Error("panic recovered",
				slog.String("error", err.Error()),
				slog.String("stack", string(stack)),
			)
			return nil
		},
	}))

	e.Use(Timeout(cfg.RequestTimeout))

	// Custom structured logger
	e.Use(RequestLogger())

	// Security headers
	e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		XSSProtection:         "1; mode=block",
		ContentTypeNosniff:    "nosniff",
		XFrameOptions:         "DENY",
		HSTSMaxAge:            31536000, // 1 year
		ContentSecurityPolicy: cfg.CSPPolicy,
	}))

	// CORS — use AllowOriginFunc instead of AllowOrigins to prevent Echo v4
	// from replacing an empty slice with ["*"] (allow-all). This ensures
	// deny-by-default when ALLOWED_ORIGINS is unset in production.
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOriginFunc: func(origin string) (bool, error) {
			for _, o := range cfg.AllowedOrigins {
				if o == origin {
					return true, nil
				}
			}
			return false, nil
		},
		AllowMethods:     []string{echo.GET, echo.POST, echo.PUT, echo.PATCH, echo.DELETE, echo.OPTIONS},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: true,
		MaxAge:           86400, // 24 hours
	}))

	// Request body size limit (prevents memory exhaustion from oversized payloads)
	e.Use(middleware.BodyLimit("1M"))

	// Gzip compression (skip for SSE streams — long-lived connections)
	e.Use(middleware.GzipWithConfig(middleware.GzipConfig{
		Level: 5,
		Skipper: func(c echo.Context) bool {
			return strings.HasPrefix(c.Path(), "/api/v1/events/stream")
		},
	}))

	// Custom error handler
	e.HTTPErrorHandler = ErrorHandler
}

var (
	redisClient *redis.Client
	redisOnce   sync.Once
)

// SetRedisClient configures the shared Redis client for rate limiting.
// Safe for concurrent use. Only the first call takes effect.
func SetRedisClient(client *redis.Client) {
	redisOnce.Do(func() {
		redisClient = client
	})
}

// RateLimiter returns a rate limiting middleware.
// Uses Redis when configured (persistent across instances), falls back to in-memory.
func RateLimiter(requests int, window time.Duration) echo.MiddlewareFunc {
	var store middleware.RateLimiterStore
	if redisClient != nil {
		store = NewRedisRateLimiterStore(redisClient, requests, window)
	} else {
		ratePerSecond := rate.Limit(float64(requests) / window.Seconds())
		store = middleware.NewRateLimiterMemoryStoreWithConfig(middleware.RateLimiterMemoryStoreConfig{
			Rate: ratePerSecond, Burst: requests, ExpiresIn: window,
		})
	}
	return middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
		Skipper: middleware.DefaultSkipper,
		Store:   store,
		IdentifierExtractor: func(c echo.Context) (string, error) {
			return c.RealIP(), nil
		},
		ErrorHandler: func(c echo.Context, err error) error {
			return c.JSON(apperror.HTTPStatus(apperror.RateLimited()), apperror.RateLimited())
		},
		DenyHandler: func(c echo.Context, identifier string, err error) error {
			logger.FromEcho(c).Warn("rate limit exceeded",
				slog.String("ip", identifier),
			)
			return c.JSON(apperror.HTTPStatus(apperror.RateLimited()), apperror.RateLimited())
		},
	})
}

// StrictRateLimiter returns a stricter rate limiter for auth endpoints.
// Callers pass cfg.AuthRateLimitRequests (from AUTH_RATE_LIMIT env var).
func StrictRateLimiter(requestsPerMinute int) echo.MiddlewareFunc {
	return RateLimiter(requestsPerMinute, time.Minute)
}

// Timeout returns a middleware that aborts the request after a duration.
//nolint:staticcheck // TimeoutWithConfig is deprecated but ContextTimeoutWithConfig requires handler-level context checks — migration tracked separately.
func Timeout(duration time.Duration) echo.MiddlewareFunc {
	return middleware.TimeoutWithConfig(middleware.TimeoutConfig{
		Timeout:      duration,
		ErrorMessage: "Request timeout exceeded",
		Skipper: func(c echo.Context) bool {
			return strings.HasPrefix(c.Path(), "/api/v1/events/stream")
		},
	})
}

// RequestLogger logs each request with structured logging.
func RequestLogger() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()

			err := next(c)
			if err != nil {
				c.Error(err)
			}

			latency := time.Since(start)

			logger.FromEcho(c).Info("request",
				slog.Int("status", c.Response().Status),
				slog.Duration("latency", latency),
				slog.Int64("bytes", c.Response().Size),
			)

			return nil
		}
	}
}

// ErrorHandler is a custom error handler that returns structured errors.
func ErrorHandler(err error, c echo.Context) {
	if c.Response().Committed {
		return
	}

	var appErr *apperror.AppError
	if errors.As(err, &appErr) {
		if appErr.Code == apperror.CodeInternal {
			logger.FromEcho(c).Error("internal error",
				slog.String("error", appErr.Error()),
			)
			if err := c.JSON(appErr.HTTPStatus, map[string]interface{}{
				"code":    appErr.Code,
				"message": "An internal error occurred",
			}); err != nil {
				logger.FromEcho(c).Error("failed to write error response", slog.String("error", err.Error()))
			}
			return
		}

		if err := c.JSON(appErr.HTTPStatus, appErr); err != nil {
			logger.FromEcho(c).Error("failed to write error response", slog.String("error", err.Error()))
		}
		return
	}

	var echoErr *echo.HTTPError
	if errors.As(err, &echoErr) {
		msg := "An error occurred"
		if m, ok := echoErr.Message.(string); ok {
			msg = m
		}
		if err := c.JSON(echoErr.Code, map[string]interface{}{
			"code":    "HTTP_ERROR",
			"message": msg,
		}); err != nil {
			logger.FromEcho(c).Error("failed to write error response", slog.String("error", err.Error()))
		}
		return
	}

	logger.FromEcho(c).Error("unhandled error",
		slog.String("error", err.Error()),
	)
	if err := c.JSON(500, map[string]interface{}{
		"code":    apperror.CodeInternal,
		"message": "An internal error occurred",
	}); err != nil {
		logger.FromEcho(c).Error("failed to write error response", slog.String("error", err.Error()))
	}
}
