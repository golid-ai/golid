package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/service"
)

// =============================================================================
// MOCK SSE HUB
// =============================================================================

type mockSSEHub struct {
	createTicketFn   func(userID string) (string, error)
	validateTicketFn func(ticket string) (string, error)
	subscribeFn      func(userID string) (chan service.SSEEvent, error)
	unsubscribeFn    func(userID string, ch chan service.SSEEvent)
	sendFn           func(userID string, event service.SSEEvent)
}

func (m *mockSSEHub) CreateTicket(userID string) (string, error) { return m.createTicketFn(userID) }
func (m *mockSSEHub) ValidateTicket(ticket string) (string, error) {
	return m.validateTicketFn(ticket)
}
func (m *mockSSEHub) Subscribe(userID string) (chan service.SSEEvent, error) {
	return m.subscribeFn(userID)
}
func (m *mockSSEHub) Unsubscribe(userID string, ch chan service.SSEEvent) {
	if m.unsubscribeFn != nil {
		m.unsubscribeFn(userID, ch)
	}
}
func (m *mockSSEHub) Send(userID string, event service.SSEEvent) {
	if m.sendFn != nil {
		m.sendFn(userID, event)
	}
}

// =============================================================================
// TICKET HANDLER TESTS
// =============================================================================

func TestTicket_Success(t *testing.T) {
	hub := &mockSSEHub{
		createTicketFn: func(userID string) (string, error) {
			return "test-ticket-abc123", nil
		},
	}
	h := &SSEHandler{hub: hub, keepaliveInterval: 30 * time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events/ticket", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "test-user-id")

	if err := h.Ticket(c); err != nil {
		t.Fatalf("Ticket() error = %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	var result map[string]string
	_ = json.Unmarshal(rec.Body.Bytes(), &result)
	if result["ticket"] != "test-ticket-abc123" {
		t.Errorf("ticket = %q, want %q", result["ticket"], "test-ticket-abc123")
	}
}

func TestTicket_NoAuth(t *testing.T) {
	h := &SSEHandler{hub: &mockSSEHub{}, keepaliveInterval: 30 * time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events/ticket", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.Ticket(c)
	if err == nil {
		t.Error("Ticket() expected error without user_id in context")
	}
}

// =============================================================================
// DEMO HANDLER TESTS
// =============================================================================

func TestDemo_Success(t *testing.T) {
	var sentEvent service.SSEEvent
	hub := &mockSSEHub{
		sendFn: func(userID string, event service.SSEEvent) {
			sentEvent = event
		},
	}
	h := &SSEHandler{hub: hub, keepaliveInterval: 30 * time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events/demo", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "test-user-id")

	if err := h.Demo(c); err != nil {
		t.Fatalf("Demo() error = %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	if sentEvent.Event != "notification" {
		t.Errorf("sent event = %q, want %q", sentEvent.Event, "notification")
	}

	var result map[string]string
	_ = json.Unmarshal(rec.Body.Bytes(), &result)
	if result["message"] != "Demo event sent" {
		t.Errorf("message = %q, want %q", result["message"], "Demo event sent")
	}
}

func TestDemo_NoAuth(t *testing.T) {
	h := &SSEHandler{hub: &mockSSEHub{}, keepaliveInterval: 30 * time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events/demo", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.Demo(c)
	if err == nil {
		t.Error("Demo() expected error without user_id in context")
	}
}

func TestStream_InvalidTicket(t *testing.T) {
	hub := &mockSSEHub{
		validateTicketFn: func(ticket string) (string, error) {
			return "", fmt.Errorf("invalid ticket")
		},
	}
	h := &SSEHandler{hub: hub, keepaliveInterval: 30 * time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/events/stream?ticket=bad", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.Stream(c)
	if err == nil {
		t.Error("Stream() expected error for invalid ticket")
	}
}

func TestStream_MissingTicket(t *testing.T) {
	h := &SSEHandler{hub: &mockSSEHub{}, keepaliveInterval: 30 * time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/events/stream", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.Stream(c)
	if err == nil {
		t.Error("Stream() expected error for missing ticket")
	}
}

func TestStream_ReceivesEvent(t *testing.T) {
	ch := make(chan service.SSEEvent, 1)
	hub := &mockSSEHub{
		validateTicketFn: func(ticket string) (string, error) { return "user-1", nil },
		subscribeFn:      func(userID string) (chan service.SSEEvent, error) { return ch, nil },
	}
	h := &SSEHandler{hub: hub, keepaliveInterval: 30 * time.Second}

	ch <- service.SSEEvent{Event: "notification", Data: map[string]string{"msg": "hello"}}
	close(ch)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/events/stream?ticket=valid", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	_ = h.Stream(c)

	body := rec.Body.String()
	if !strings.Contains(body, "event: notification") {
		t.Errorf("response should contain 'event: notification', got: %s", body)
	}
	if !strings.Contains(body, `"msg":"hello"`) {
		t.Errorf("response should contain event data, got: %s", body)
	}
}
