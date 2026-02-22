package handler

import (
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/logger"
	"github.com/golid-ai/golid/backend/internal/service"
)

// SSEHandler handles Server-Sent Events endpoints.
type SSEHandler struct {
	hub               sseHubber
	keepaliveInterval time.Duration
}

// NewSSEHandler creates a new SSE handler.
func NewSSEHandler(hub *service.SSEHub, keepaliveInterval time.Duration) *SSEHandler {
	return &SSEHandler{hub: hub, keepaliveInterval: keepaliveInterval}
}

// Ticket handles POST /api/v1/events/ticket
// Requires JWT auth. Returns a one-time ticket for SSE stream connection.
func (h *SSEHandler) Ticket(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	ticket, err := h.hub.CreateTicket(userID)
	if err != nil {
		return apperror.Internal(fmt.Errorf("create SSE ticket: %w", err))
	}

	return c.JSON(http.StatusOK, map[string]string{
		"ticket": ticket,
	})
}

// Stream handles GET /api/v1/events/stream?ticket=...
// Uses one-time ticket auth (not JWT — EventSource can't set headers).
func (h *SSEHandler) Stream(c echo.Context) error {
	ticket := c.QueryParam("ticket")
	if ticket == "" {
		return apperror.Unauthorized("ticket is required")
	}

	userID, err := h.hub.ValidateTicket(ticket)
	if err != nil {
		return apperror.Unauthorized("invalid or expired ticket")
	}

	ch, err := h.hub.Subscribe(userID)
	if err != nil {
		return apperror.BadRequest("unable to subscribe to events")
	}
	defer h.hub.Unsubscribe(userID, ch)

	logger.Info("SSE connected",
		slog.String("user_id", userID),
		slog.String("remote_ip", c.RealIP()),
	)

	w := c.Response()
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)

	flusher, ok := w.Writer.(http.Flusher)
	if !ok {
		return apperror.Internal(fmt.Errorf("streaming not supported"))
	}

	ticker := time.NewTicker(h.keepaliveInterval)
	defer ticker.Stop()

	ctx := c.Request().Context()

	for {
		select {
		case event, open := <-ch:
			if !open {
				return nil
			}
			data, err := event.MarshalData()
			if err != nil {
				logger.Error("SSE marshal error",
					slog.String("user_id", userID),
					slog.String("error", err.Error()),
				)
				continue
			}
			_, _ = fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event.Event, data) //nolint:errcheck // SSE write to flushed stream
			flusher.Flush()

		case <-ticker.C:
			_, _ = fmt.Fprint(w, ": keepalive\n\n") //nolint:errcheck // SSE keepalive
			flusher.Flush()

		case <-ctx.Done():
			logger.Info("SSE disconnected",
				slog.String("user_id", userID),
				slog.String("remote_ip", c.RealIP()),
			)
			return nil
		}
	}
}

// Demo handles POST /api/v1/events/demo
// Requires JWT auth. Sends a demo notification event to the calling user's SSE stream.
func (h *SSEHandler) Demo(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	h.hub.Send(userID, service.SSEEvent{
		Event: "notification",
		Data: map[string]any{
			"message":   "This is a demo notification",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		},
	})

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Demo event sent",
	})
}
