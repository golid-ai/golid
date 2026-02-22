package queue

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/hibiken/asynq"
)

type mockEmailSender struct {
	verificationCalled bool
	resetCalled        bool
	lastTo             string
	lastToken          string
}

func (m *mockEmailSender) SendVerificationEmail(toEmail, token string) error {
	m.verificationCalled = true
	m.lastTo = toEmail
	m.lastToken = token
	return nil
}

func (m *mockEmailSender) SendPasswordResetEmail(toEmail, token string) error {
	m.resetCalled = true
	m.lastTo = toEmail
	m.lastToken = token
	return nil
}

func TestEmailHandler_HandleVerification(t *testing.T) {
	mock := &mockEmailSender{}
	h := NewEmailHandler(mock)

	payload, _ := json.Marshal(SendEmailPayload{To: "test@example.com", Token: "abc123"})
	task := asynq.NewTask(TypeSendVerificationEmail, payload)

	err := h.HandleVerification(context.Background(), task)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !mock.verificationCalled {
		t.Error("expected SendVerificationEmail to be called")
	}
	if mock.lastTo != "test@example.com" {
		t.Errorf("expected to = test@example.com, got %s", mock.lastTo)
	}
	if mock.lastToken != "abc123" {
		t.Errorf("expected token = abc123, got %s", mock.lastToken)
	}
}

func TestEmailHandler_HandlePasswordReset(t *testing.T) {
	mock := &mockEmailSender{}
	h := NewEmailHandler(mock)

	payload, _ := json.Marshal(SendEmailPayload{To: "user@example.com", Token: "reset789"})
	task := asynq.NewTask(TypeSendPasswordReset, payload)

	err := h.HandlePasswordReset(context.Background(), task)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !mock.resetCalled {
		t.Error("expected SendPasswordResetEmail to be called")
	}
	if mock.lastTo != "user@example.com" {
		t.Errorf("expected to = user@example.com, got %s", mock.lastTo)
	}
}

func TestEmailHandler_HandleVerification_InvalidPayload(t *testing.T) {
	mock := &mockEmailSender{}
	h := NewEmailHandler(mock)

	task := asynq.NewTask(TypeSendVerificationEmail, []byte("invalid json"))
	err := h.HandleVerification(context.Background(), task)
	if err == nil {
		t.Error("expected error for invalid payload")
	}
	if mock.verificationCalled {
		t.Error("expected SendVerificationEmail NOT to be called on invalid payload")
	}
}
