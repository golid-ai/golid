package service

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/golid-ai/golid/backend/internal/logger"
	"github.com/golid-ai/golid/backend/internal/observability"
)

const (
	// Fixed internal buffer — sized for typical burst; not environment-specific.
	sseChannelBuffer = 16
	// Hard cap per user — prevents resource exhaustion; not environment-specific.
	sseMaxConnsPerUser = 5
	// Crypto entropy for one-time tickets (256 bits) — security parameter, not tunable.
	sseTicketLength = 32
)

// SSEEvent is a server-sent event with a named event type and arbitrary data.
type SSEEvent struct {
	Event string `json:"event"`
	Data  any    `json:"data"`
}

// MarshalData returns the JSON-encoded data field for writing to the SSE stream.
func (e SSEEvent) MarshalData() ([]byte, error) {
	return json.Marshal(e.Data)
}

type sseTicket struct {
	UserID    string
	ExpiresAt time.Time
}

// SSEHub manages per-user SSE client channels and one-time connection tickets.
type SSEHub struct {
	mu        sync.RWMutex
	clients   map[string]map[chan SSEEvent]struct{}
	tickets   map[string]sseTicket
	ticketTTL time.Duration
	done      chan struct{}
}

// NewSSEHub creates a new SSE hub.
func NewSSEHub(ticketTTL time.Duration) *SSEHub {
	h := &SSEHub{
		clients:   make(map[string]map[chan SSEEvent]struct{}),
		tickets:   make(map[string]sseTicket),
		ticketTTL: ticketTTL,
		done:      make(chan struct{}),
	}
	go h.ticketCleanupLoop()
	return h
}

// Subscribe registers a new SSE client channel for the given user.
// Returns an error if the user already has sseMaxConnsPerUser connections.
func (h *SSEHub) Subscribe(userID string) (chan SSEEvent, error) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[userID] == nil {
		h.clients[userID] = make(map[chan SSEEvent]struct{})
	}

	if len(h.clients[userID]) >= sseMaxConnsPerUser {
		return nil, fmt.Errorf("max SSE connections (%d) reached for user", sseMaxConnsPerUser)
	}

	ch := make(chan SSEEvent, sseChannelBuffer)
	h.clients[userID][ch] = struct{}{}
	observability.ActiveSSEConns.Inc()
	return ch, nil
}

// Unsubscribe removes a client channel and closes it.
func (h *SSEHub) Unsubscribe(userID string, ch chan SSEEvent) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if conns, ok := h.clients[userID]; ok {
		if _, exists := conns[ch]; exists {
			delete(conns, ch)
			close(ch)
			observability.ActiveSSEConns.Dec()
		}
		if len(conns) == 0 {
			delete(h.clients, userID)
		}
	}
}

// Send delivers an event to all connections for a specific user.
// Non-blocking: if a client's buffer is full, the event is dropped for that client.
func (h *SSEHub) Send(userID string, event SSEEvent) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	conns, ok := h.clients[userID]
	if !ok {
		return
	}

	for ch := range conns {
		select {
		case ch <- event:
		default:
			logger.Warn("SSE event dropped for slow client",
				slog.String("user_id", userID),
				slog.String("event", event.Event),
			)
		}
	}
}

// Broadcast delivers an event to all connected clients across all users.
// Non-blocking: slow clients have their events dropped.
func (h *SSEHub) Broadcast(event SSEEvent) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, conns := range h.clients {
		for ch := range conns {
			select {
			case ch <- event:
			default:
				logger.Warn("SSE broadcast dropped for slow client",
					slog.String("user_id", userID),
					slog.String("event", event.Event),
				)
			}
		}
	}
}

// CreateTicket generates a one-time ticket for SSE connection auth.
// The ticket is valid for sseTicketTTL and can only be used once.
func (h *SSEHub) CreateTicket(userID string) (string, error) {
	b := make([]byte, sseTicketLength)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate ticket: %w", err)
	}
	ticket := base64.URLEncoding.EncodeToString(b)

	h.mu.Lock()
	defer h.mu.Unlock()

	h.cleanExpiredTicketsLocked()

	h.tickets[ticket] = sseTicket{
		UserID:    userID,
		ExpiresAt: time.Now().Add(h.ticketTTL),
	}

	return ticket, nil
}

// ValidateTicket checks a ticket, burns it (single-use), and returns the user ID.
func (h *SSEHub) ValidateTicket(ticket string) (string, error) {
	h.mu.Lock()
	defer h.mu.Unlock()

	t, ok := h.tickets[ticket]
	if !ok {
		return "", fmt.Errorf("invalid ticket")
	}

	delete(h.tickets, ticket)

	if time.Now().After(t.ExpiresAt) {
		return "", fmt.Errorf("ticket expired")
	}

	return t.UserID, nil
}

// cleanExpiredTicketsLocked removes expired tickets. Must be called with mu held.
func (h *SSEHub) cleanExpiredTicketsLocked() {
	now := time.Now()
	for ticket, t := range h.tickets {
		if now.After(t.ExpiresAt) {
			delete(h.tickets, ticket)
		}
	}
}

// ticketCleanupLoop periodically removes expired tickets even when no new
// tickets are being created. Runs until Shutdown() closes the done channel.
func (h *SSEHub) ticketCleanupLoop() {
	ticker := time.NewTicker(h.ticketTTL)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			h.mu.Lock()
			h.cleanExpiredTicketsLocked()
			h.mu.Unlock()
		case <-h.done:
			return
		}
	}
}

// Shutdown closes all client channels. Call during graceful server shutdown.
func (h *SSEHub) Shutdown() {
	close(h.done)

	h.mu.Lock()
	defer h.mu.Unlock()

	for userID, conns := range h.clients {
		for ch := range conns {
			close(ch)
		}
		delete(h.clients, userID)
	}

	h.tickets = make(map[string]sseTicket)

	logger.Info("SSE hub shut down")
}

// ConnectedUsers returns the number of users with active SSE connections.
func (h *SSEHub) ConnectedUsers() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// ConnectedClients returns the total number of active SSE client channels.
func (h *SSEHub) ConnectedClients() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	count := 0
	for _, conns := range h.clients {
		count += len(conns)
	}
	return count
}
