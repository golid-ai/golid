package service

import (
	"sync"
	"testing"
	"time"
)

func TestSSEHub_ConcurrentSubscribeUnsubscribe(t *testing.T) {
	hub := NewSSEHub(30 * time.Second)
	const users = 50
	const connsPerUser = 3
	var wg sync.WaitGroup

	type conn struct {
		userID string
		ch     chan SSEEvent
	}
	results := make(chan conn, users*connsPerUser)

	wg.Add(users * connsPerUser)
	for u := 0; u < users; u++ {
		for c := 0; c < connsPerUser; c++ {
			go func(userIdx int) {
				defer wg.Done()
				userID := string(rune('A'+userIdx/26)) + string(rune('a'+userIdx%26))
				ch, err := hub.Subscribe(userID)
				if err != nil {
					return
				}
				results <- conn{userID: userID, ch: ch}
			}(u)
		}
	}
	wg.Wait()
	close(results)

	var conns []conn
	for c := range results {
		conns = append(conns, c)
	}

	wg.Add(len(conns))
	for _, c := range conns {
		go func(c conn) {
			defer wg.Done()
			hub.Unsubscribe(c.userID, c.ch)
		}(c)
	}
	wg.Wait()

	if hub.ConnectedUsers() != 0 {
		t.Errorf("ConnectedUsers = %d, want 0", hub.ConnectedUsers())
	}
	if hub.ConnectedClients() != 0 {
		t.Errorf("ConnectedClients = %d, want 0", hub.ConnectedClients())
	}
}

func TestSSEHub_ConcurrentSendAndSubscribe(t *testing.T) {
	hub := NewSSEHub(30 * time.Second)
	const iterations = 100
	var wg sync.WaitGroup

	ch, err := hub.Subscribe("stable-user")
	if err != nil {
		t.Fatalf("Subscribe: %v", err)
	}

	done := make(chan struct{})
	go func() {
		count := 0
		for range ch {
			count++
			if count >= iterations/2 {
				break
			}
		}
		close(done)
	}()

	wg.Add(iterations)
	for i := 0; i < iterations; i++ {
		go func(i int) {
			defer wg.Done()
		switch i % 3 {
		case 0:
			hub.Send("stable-user", SSEEvent{Event: "test", Data: i})
		case 1:
			hub.Broadcast(SSEEvent{Event: "broadcast", Data: i})
		default:
				c, err := hub.Subscribe("ephemeral")
				if err == nil {
					hub.Unsubscribe("ephemeral", c)
				}
			}
		}(i)
	}
	wg.Wait()
	hub.Unsubscribe("stable-user", ch)
}

func TestSSEHub_ConcurrentTickets(t *testing.T) {
	hub := NewSSEHub(30 * time.Second)
	const tickets = 50
	var wg sync.WaitGroup

	ticketChan := make(chan string, tickets)

	wg.Add(tickets)
	for i := 0; i < tickets; i++ {
		go func(i int) {
			defer wg.Done()
			ticket, err := hub.CreateTicket("user-1")
			if err != nil {
				t.Errorf("CreateTicket %d: %v", i, err)
				return
			}
			ticketChan <- ticket
		}(i)
	}
	wg.Wait()
	close(ticketChan)

	var allTickets []string
	for ticket := range ticketChan {
		allTickets = append(allTickets, ticket)
	}

	seen := make(map[string]bool)
	for _, ticket := range allTickets {
		if seen[ticket] {
			t.Error("duplicate ticket generated")
		}
		seen[ticket] = true
	}

	wg.Add(len(allTickets))
	for _, ticket := range allTickets {
		go func(ticket string) {
			defer wg.Done()
			userID, err := hub.ValidateTicket(ticket)
			if err != nil {
				return
			}
			if userID != "user-1" {
				t.Errorf("ticket resolved to %q, want user-1", userID)
			}
		}(ticket)
	}
	wg.Wait()
}
