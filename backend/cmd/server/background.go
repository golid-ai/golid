package main

import (
	"context"
	"log/slog"
	"time"

	"github.com/golid-ai/golid/backend/internal/logger"
	"github.com/golid-ai/golid/backend/internal/wire"
)

// startTokenCleanup runs an hourly sweep that deletes expired refresh
// tokens. Returns a done channel that main closes during shutdown so
// the goroutine exits cleanly.
func startTokenCleanup(svcs *wire.Services) chan struct{} {
	return runEvery(1*time.Hour, func(ctx context.Context) {
		if err := svcs.Auth.CleanupExpiredTokens(ctx); err != nil {
			logger.Error("failed to clean expired tokens", slog.String("error", err.Error()))
		}
	})
}

// runEvery launches fn on the given interval until the returned
// channel is closed. fn receives a fresh background context on each
// tick so individual sweeps cannot be cancelled by the bootstrap ctx
// (the goroutine itself is stopped via the returned done channel).
func runEvery(interval time.Duration, fn func(context.Context)) chan struct{} {
	done := make(chan struct{})
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				fn(context.Background())
			case <-done:
				return
			}
		}
	}()
	return done
}
