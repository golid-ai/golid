package wire

import (
	"github.com/golid-ai/golid/backend/internal/config"
	"github.com/golid-ai/golid/backend/internal/handler"
	"github.com/golid-ai/golid/backend/internal/queue"
)

// Handlers bundles every constructed handler. Returned by BuildHandlers
// and consumed by RegisterRoutes.
type Handlers struct {
	Auth    *handler.AuthHandler
	User    *handler.UserHandler
	Feature *handler.FeatureHandler
	SSE     *handler.SSEHandler
}

// BuildHandlers constructs every HTTP handler from the already-built
// services. jobQueue is opt-in (Redis-backed); handlers that take it
// fall back to inline goroutines when queue.IsConfigured() is false.
func BuildHandlers(svcs *Services, cfg *config.Config, jobQueue *queue.Queue) *Handlers {
	return &Handlers{
		Auth:    handler.NewAuthHandler(svcs.Auth, svcs.Email, jobQueue, cfg.RetryAttempts, cfg.RetryDelay),
		User:    handler.NewUserHandler(svcs.Users),
		Feature: handler.NewFeatureHandler(svcs.Feature),
		SSE:     handler.NewSSEHandler(svcs.SSEHub, cfg.SSEKeepaliveInterval),
	}
}
