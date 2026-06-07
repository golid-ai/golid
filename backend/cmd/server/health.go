package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/db"
	"github.com/golid-ai/golid/backend/internal/logger"
)

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
