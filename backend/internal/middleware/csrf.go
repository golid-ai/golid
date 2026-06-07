package middleware

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

type Logger interface {
	Warn(msg string, args ...any)
}

// CSRF checks state-changing requests for the custom app header.
func CSRF(enforce bool, log Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if csrfBypass(c) || csrfHeaderValid(c) {
				return next(c)
			}

			if enforce {
				return apperror.Forbidden("CSRF check failed")
			}

			args := []any{
				slog.String("route", c.Path()),
				slog.String("method", c.Request().Method),
				slog.String("caller_ip", c.RealIP()),
			}
			// CSRF currently runs before JWTAuth, so user_id is rarely populated.
			// Keep this opportunistic for future remounts or post-auth checks.
			if userID, ok := c.Get("user_id").(string); ok && userID != "" {
				args = append(args, slog.String("user_id", userID))
			}
			log.Warn("csrf: would reject state-changing request", args...)
			return next(c)
		}
	}
}

func csrfBypass(c echo.Context) bool {
	method := c.Request().Method
	if method == http.MethodGet || method == http.MethodHead || method == http.MethodOptions {
		return true
	}

	return strings.HasPrefix(c.Path(), "/api/v1/webhooks/")
}

func csrfHeaderValid(c echo.Context) bool {
	return strings.EqualFold(c.Request().Header.Get("X-Requested-With"), "golid-app")
}
