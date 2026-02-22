package logger

import (
	"context"
	"log/slog"
	"os"

	"github.com/labstack/echo/v4"
)

// contextKey is used for storing values in context.
type contextKey string

const (
	requestIDKey contextKey = "request_id"
	userIDKey    contextKey = "user_id"
)

var defaultLogger *slog.Logger

// Init initializes the global logger based on environment.
func Init(env string) {
	var handler slog.Handler

	opts := &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}

	if env == "development" {
		// Human-readable format for development
		opts.Level = slog.LevelDebug
		handler = slog.NewTextHandler(os.Stdout, opts)
	} else {
		// JSON format for production (Cloud Logging compatible)
		handler = slog.NewJSONHandler(os.Stdout, opts)
	}

	defaultLogger = slog.New(handler)
	slog.SetDefault(defaultLogger)
}

// Logger returns the default logger.
func Logger() *slog.Logger {
	if defaultLogger == nil {
		Init("development")
	}
	return defaultLogger
}

// WithContext returns a logger with context values (request_id, user_id).
func WithContext(ctx context.Context) *slog.Logger {
	l := Logger()

	if requestID, ok := ctx.Value(requestIDKey).(string); ok {
		l = l.With(slog.String("request_id", requestID))
	}

	if userID, ok := ctx.Value(userIDKey).(string); ok {
		l = l.With(slog.String("user_id", userID))
	}

	return l
}

// FromEcho returns a logger with Echo context values.
func FromEcho(c echo.Context) *slog.Logger {
	l := Logger()

	// Add request ID if present
	if requestID := c.Request().Header.Get(echo.HeaderXRequestID); requestID != "" {
		l = l.With(slog.String("request_id", requestID))
	} else if requestID := c.Response().Header().Get(echo.HeaderXRequestID); requestID != "" {
		l = l.With(slog.String("request_id", requestID))
	}

	// Add user ID if authenticated
	if userID, ok := c.Get("user_id").(string); ok {
		l = l.With(slog.String("user_id", userID))
	}

	// Add request metadata
	l = l.With(
		slog.String("method", c.Request().Method),
		slog.String("path", c.Request().URL.Path),
		slog.String("remote_ip", c.RealIP()),
	)

	return l
}

// Info logs at INFO level.
func Info(msg string, args ...any) {
	Logger().Info(msg, args...)
}

// Error logs at ERROR level.
func Error(msg string, args ...any) {
	Logger().Error(msg, args...)
}

// Debug logs at DEBUG level.
func Debug(msg string, args ...any) {
	Logger().Debug(msg, args...)
}

// Warn logs at WARN level.
func Warn(msg string, args ...any) {
	Logger().Warn(msg, args...)
}
