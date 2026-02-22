package queue

import (
	"encoding/json"

	"github.com/hibiken/asynq"
)

const (
	TypeSendVerificationEmail = "email:verification"
	TypeSendPasswordReset     = "email:password_reset"

	taskMaxRetry = 3
)

type SendEmailPayload struct {
	To    string `json:"to"`
	Token string `json:"token"`
}

func NewSendVerificationEmail(to, token string) (*asynq.Task, error) {
	payload, err := json.Marshal(SendEmailPayload{To: to, Token: token})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeSendVerificationEmail, payload, asynq.MaxRetry(taskMaxRetry)), nil
}

func NewSendPasswordReset(to, token string) (*asynq.Task, error) {
	payload, err := json.Marshal(SendEmailPayload{To: to, Token: token})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeSendPasswordReset, payload, asynq.MaxRetry(taskMaxRetry)), nil
}
