package middleware

import (
	"strconv"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/observability"
)

// Metrics returns middleware that records Prometheus metrics for each request.
// Uses c.Path() (route pattern) instead of c.Request().URL.Path to prevent
// label cardinality explosion from path parameters.
func Metrics() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()

			err := next(c)

			duration := time.Since(start).Seconds()
			status := strconv.Itoa(c.Response().Status)
			path := c.Path()

			observability.RequestsTotal.WithLabelValues(c.Request().Method, path, status).Inc()
			observability.RequestDuration.WithLabelValues(c.Request().Method, path).Observe(duration)

			return err
		}
	}
}
