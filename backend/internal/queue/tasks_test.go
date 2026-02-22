package queue

import (
	"encoding/json"
	"testing"
)

func TestNewSendVerificationEmail_Payload(t *testing.T) {
	task, err := NewSendVerificationEmail("user@example.com", "verify-token-123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if task.Type() != TypeSendVerificationEmail {
		t.Errorf("expected type %s, got %s", TypeSendVerificationEmail, task.Type())
	}

	var p SendEmailPayload
	if err := json.Unmarshal(task.Payload(), &p); err != nil {
		t.Fatalf("failed to unmarshal payload: %v", err)
	}
	if p.To != "user@example.com" {
		t.Errorf("expected To = user@example.com, got %s", p.To)
	}
	if p.Token != "verify-token-123" {
		t.Errorf("expected Token = verify-token-123, got %s", p.Token)
	}
}

func TestNewSendPasswordReset_Payload(t *testing.T) {
	task, err := NewSendPasswordReset("user@example.com", "reset-token-456")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if task.Type() != TypeSendPasswordReset {
		t.Errorf("expected type %s, got %s", TypeSendPasswordReset, task.Type())
	}

	var p SendEmailPayload
	if err := json.Unmarshal(task.Payload(), &p); err != nil {
		t.Fatalf("failed to unmarshal payload: %v", err)
	}
	if p.To != "user@example.com" {
		t.Errorf("expected To = user@example.com, got %s", p.To)
	}
	if p.Token != "reset-token-456" {
		t.Errorf("expected Token = reset-token-456, got %s", p.Token)
	}
}
