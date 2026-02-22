package handler

import (
	"context"

	"github.com/hibiken/asynq"

	"github.com/golid-ai/golid/backend/internal/service"
)

type authServicer interface {
	Register(ctx context.Context, input *service.RegisterInput) (*service.AuthResult, error)
	Login(ctx context.Context, input *service.LoginInput) (*service.AuthResult, error)
	Logout(ctx context.Context, userID string) error
	Refresh(ctx context.Context, input *service.RefreshInput) (*service.AuthResult, error)
	ChangePassword(ctx context.Context, input *service.ChangePasswordInput) error
	ForgotPassword(ctx context.Context, input *service.ForgotPasswordInput) (string, error)
	VerifyResetToken(ctx context.Context, input *service.VerifyResetTokenInput) (*service.VerifyResetTokenResult, error)
	ResetPassword(ctx context.Context, input *service.ResetPasswordInput) error
	VerifyEmail(ctx context.Context, input *service.VerifyEmailInput) error
	ResendVerification(ctx context.Context, input *service.ResendVerificationInput) (string, error)
}

type userServicer interface {
	GetByID(ctx context.Context, userID string) (*service.UserProfile, error)
	UpdateProfile(ctx context.Context, userID string, update *service.ProfileUpdate) (*service.UserProfile, error)
}

type emailServicer interface {
	IsConfigured() bool
	SendVerificationEmail(toEmail, token string) error
	SendPasswordResetEmail(toEmail, token string) error
}

type queuer interface {
	IsConfigured() bool
	Enqueue(task *asynq.Task, opts ...asynq.Option) error
}

type featureServicer interface {
	List(ctx context.Context) ([]service.FeatureFlag, error)
	ListEnabled(ctx context.Context) (map[string]bool, error)
	Set(ctx context.Context, key string, enabled bool) error
}

type sseHubber interface {
	CreateTicket(userID string) (string, error)
	ValidateTicket(ticket string) (string, error)
	Subscribe(userID string) (chan service.SSEEvent, error)
	Unsubscribe(userID string, ch chan service.SSEEvent)
	Send(userID string, event service.SSEEvent)
}
