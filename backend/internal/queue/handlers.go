package queue

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

// EmailSender is the subset of EmailService needed by queue handlers.
type EmailSender interface {
	SendVerificationEmail(toEmail, token string) error
	SendPasswordResetEmail(toEmail, token string) error
}

type EmailHandler struct {
	emailService EmailSender
}

func NewEmailHandler(emailService EmailSender) *EmailHandler {
	return &EmailHandler{emailService: emailService}
}

func (h *EmailHandler) HandleVerification(ctx context.Context, task *asynq.Task) error {
	var p SendEmailPayload
	if err := json.Unmarshal(task.Payload(), &p); err != nil {
		return fmt.Errorf("unmarshal verification payload: %w", err)
	}
	return h.emailService.SendVerificationEmail(p.To, p.Token)
}

func (h *EmailHandler) HandlePasswordReset(ctx context.Context, task *asynq.Task) error {
	var p SendEmailPayload
	if err := json.Unmarshal(task.Payload(), &p); err != nil {
		return fmt.Errorf("unmarshal password reset payload: %w", err)
	}
	return h.emailService.SendPasswordResetEmail(p.To, p.Token)
}
