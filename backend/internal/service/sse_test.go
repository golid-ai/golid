package service

import (
	"testing"
	"time"
)

func TestSSEHub_SubscribeUnsubscribe(t *testing.T) {
	hub := NewSSEHub(30 * time.Second)

	ch, err := hub.Subscribe("user-1")
	if err != nil {
		t.Fatalf("Subscribe failed: %v", err)
	}
	if ch == nil {
		t.Fatal("Subscribe returned nil channel")
	}

	if hub.ConnectedUsers() != 1 {
		t.Errorf("ConnectedUsers = %d, want 1", hub.ConnectedUsers())
	}
	if hub.ConnectedClients() != 1 {
		t.Errorf("ConnectedClients = %d, want 1", hub.ConnectedClients())
	}

	hub.Unsubscribe("user-1", ch)

	if hub.ConnectedUsers() != 0 {
		t.Errorf("ConnectedUsers after unsubscribe = %d, want 0", hub.ConnectedUsers())
	}

	// Channel should be closed after unsubscribe
	_, open := <-ch
	if open {
		t.Error("channel should be closed after unsubscribe")
	}
}

func TestSSEHub_Send(t *testing.T) {
	hub := NewSSEHub(30 * time.Second)

	ch1, _ := hub.Subscribe("user-1")
	ch2, _ := hub.Subscribe("user-2")

	event := SSEEvent{Event: "test", Data: map[string]string{"msg": "hello"}}
	hub.Send("user-1", event)

	select {
	case received := <-ch1:
		if received.Event != "test" {
			t.Errorf("event = %q, want %q", received.Event, "test")
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("user-1 did not receive event")
	}

	select {
	case <-ch2:
		t.Error("user-2 should not receive user-1's event")
	case <-time.After(50 * time.Millisecond):
		// expected
	}

	hub.Unsubscribe("user-1", ch1)
	hub.Unsubscribe("user-2", ch2)
}

func TestSSEHub_Broadcast(t *testing.T) {
	hub := NewSSEHub(30 * time.Second)

	ch1, _ := hub.Subscribe("user-1")
	ch2, _ := hub.Subscribe("user-2")

	event := SSEEvent{Event: "announcement", Data: "hello everyone"}
	hub.Broadcast(event)

	for _, tc := range []struct {
		name string
		ch   chan SSEEvent
	}{
		{"user-1", ch1},
		{"user-2", ch2},
	} {
		select {
		case received := <-tc.ch:
			if received.Event != "announcement" {
				t.Errorf("%s: event = %q, want %q", tc.name, received.Event, "announcement")
			}
		case <-time.After(100 * time.Millisecond):
			t.Errorf("%s did not receive broadcast", tc.name)
		}
	}

	hub.Unsubscribe("user-1", ch1)
	hub.Unsubscribe("user-2", ch2)
}

func TestSSEHub_MaxConnections(t *testing.T) {
	hub := NewSSEHub(30 * time.Second)
	channels := make([]chan SSEEvent, 0, sseMaxConnsPerUser)

	for i := 0; i < sseMaxConnsPerUser; i++ {
		ch, err := hub.Subscribe("user-1")
		if err != nil {
			t.Fatalf("Subscribe %d failed: %v", i, err)
		}
		channels = append(channels, ch)
	}

	// Next subscribe should fail
	_, err := hub.Subscribe("user-1")
	if err == nil {
		t.Error("expected error when exceeding max connections")
	}

	if hub.ConnectedClients() != sseMaxConnsPerUser {
		t.Errorf("ConnectedClients = %d, want %d", hub.ConnectedClients(), sseMaxConnsPerUser)
	}

	for _, ch := range channels {
		hub.Unsubscribe("user-1", ch)
	}
}

func TestSSEHub_DropOnFull(t *testing.T) {
	hub := NewSSEHub(30 * time.Second)
	ch, _ := hub.Subscribe("user-1")

	// Fill the buffer
	for i := 0; i < sseChannelBuffer; i++ {
		hub.Send("user-1", SSEEvent{Event: "fill", Data: i})
	}

	// Next send should not block (dropped)
	done := make(chan struct{})
	go func() {
		hub.Send("user-1", SSEEvent{Event: "overflow", Data: "dropped"})
		close(done)
	}()

	select {
	case <-done:
		// Send returned without blocking
	case <-time.After(time.Second):
		t.Fatal("Send blocked on full buffer — should drop instead")
	}

	hub.Unsubscribe("user-1", ch)
}

func TestSSEHub_Tickets(t *testing.T) {
	hub := NewSSEHub(30 * time.Second)

	ticket, err := hub.CreateTicket("user-1")
	if err != nil {
		t.Fatalf("CreateTicket failed: %v", err)
	}
	if ticket == "" {
		t.Fatal("CreateTicket returned empty ticket")
	}

	// Validate should succeed and return the user ID
	userID, err := hub.ValidateTicket(ticket)
	if err != nil {
		t.Fatalf("ValidateTicket failed: %v", err)
	}
	if userID != "user-1" {
		t.Errorf("userID = %q, want %q", userID, "user-1")
	}

	// Second validate should fail (ticket is burned)
	_, err = hub.ValidateTicket(ticket)
	if err == nil {
		t.Error("expected error on second ValidateTicket (ticket should be burned)")
	}

	// Invalid ticket should fail
	_, err = hub.ValidateTicket("bogus-ticket")
	if err == nil {
		t.Error("expected error on invalid ticket")
	}
}

func TestSSEHub_Shutdown(t *testing.T) {
	hub := NewSSEHub(30 * time.Second)

	ch1, _ := hub.Subscribe("user-1")
	ch2, _ := hub.Subscribe("user-2")

	hub.Shutdown()

	if hub.ConnectedUsers() != 0 {
		t.Errorf("ConnectedUsers after shutdown = %d, want 0", hub.ConnectedUsers())
	}

	// Channels should be closed
	if _, open := <-ch1; open {
		t.Error("ch1 should be closed after shutdown")
	}
	if _, open := <-ch2; open {
		t.Error("ch2 should be closed after shutdown")
	}
}

func TestSSEEvent_MarshalData(t *testing.T) {
	event := SSEEvent{
		Event: "notification",
		Data:  map[string]string{"message": "hello"},
	}

	data, err := event.MarshalData()
	if err != nil {
		t.Fatalf("MarshalData failed: %v", err)
	}

	expected := `{"message":"hello"}`
	if string(data) != expected {
		t.Errorf("MarshalData = %s, want %s", data, expected)
	}
}
