package handler

import (
	"context"

	"github.com/hibiken/asynq"

	"github.com/golid-ai/golid/backend/internal/service/auth"
	"github.com/golid-ai/golid/backend/internal/service/feature"
	"github.com/golid-ai/golid/backend/internal/service/sse"
	"github.com/golid-ai/golid/backend/internal/service/user"
)

type authServicer interface {
	Register(ctx context.Context, input *auth.RegisterInput) (*auth.AuthResult, error)
	Login(ctx context.Context, input *auth.LoginInput) (*auth.AuthResult, error)
	Logout(ctx context.Context, userID string) error
	Refresh(ctx context.Context, input *auth.RefreshInput) (*auth.AuthResult, error)
	ChangePassword(ctx context.Context, input *auth.ChangePasswordInput) error
	ForgotPassword(ctx context.Context, input *auth.ForgotPasswordInput) (string, error)
	VerifyResetToken(ctx context.Context, input *auth.VerifyResetTokenInput) (*auth.VerifyResetTokenResult, error)
	ResetPassword(ctx context.Context, input *auth.ResetPasswordInput) error
	VerifyEmail(ctx context.Context, input *auth.VerifyEmailInput) error
	ResendVerification(ctx context.Context, input *auth.ResendVerificationInput) (string, error)
}

type userServicer interface {
	GetByID(ctx context.Context, userID string) (*user.UserProfile, error)
	UpdateProfile(ctx context.Context, userID string, update *user.ProfileUpdate) (*user.UserProfile, error)
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
	List(ctx context.Context) ([]feature.FeatureFlag, error)
	ListEnabled(ctx context.Context) (map[string]bool, error)
	Set(ctx context.Context, key string, enabled bool) error
}

type sseHubber interface {
	CreateTicket(userID string) (string, error)
	ValidateTicket(ticket string) (string, error)
	Subscribe(userID string) (chan sse.SSEEvent, error)
	Unsubscribe(userID string, ch chan sse.SSEEvent)
	Send(userID string, event sse.SSEEvent)
}
