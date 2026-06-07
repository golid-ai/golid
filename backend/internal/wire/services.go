package wire

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/golid-ai/golid/backend/internal/config"
	"github.com/golid-ai/golid/backend/internal/service/auth"
	"github.com/golid-ai/golid/backend/internal/service/email"
	"github.com/golid-ai/golid/backend/internal/service/feature"
	"github.com/golid-ai/golid/backend/internal/service/sse"
	"github.com/golid-ai/golid/backend/internal/service/user"
)

// Services bundles every service the API needs. Constructed once at
// startup by BuildServices; held by BuildHandlers so each handler can
// reach across modules without re-injecting individual deps.
//
// SSEHub and Auth are exposed back to main.go for shutdown sequencing
// (sseHub.Shutdown) and the periodic token cleanup goroutine.
type Services struct {
	SSEHub  *sse.SSEHub
	Auth    *auth.AuthService
	Users   *user.UserService
	Email   *email.EmailService
	Feature *feature.FeatureService
}

// BuildServices constructs every service in dependency order.
func BuildServices(_ context.Context, cfg *config.Config, pool *pgxpool.Pool) *Services {
	sseHub := sse.NewSSEHub(cfg.SSETicketTTL)
	authService := auth.NewAuthService(pool, cfg.JWTSecret, cfg.AppName, cfg.JWTAccessDuration, cfg.JWTRefreshDuration, cfg.PasswordResetTTL)
	userService := user.NewUserService(pool)
	emailService := email.NewEmailService(email.EmailConfig{
		APIKey:           cfg.MailgunAPIKey,
		Domain:           cfg.MailgunDomain,
		BaseURL:          cfg.MailgunBaseURL,
		FrontendURL:      cfg.FrontendURL,
		DevEmailOverride: cfg.DevEmailOverride,
		AppName:          cfg.AppName,
		Timeout:          cfg.EmailTimeout,
		PasswordResetTTL: cfg.PasswordResetTTL,
	})
	featureService := feature.NewFeatureService(pool, cfg.FeatureCacheTTL)

	return &Services{
		SSEHub:  sseHub,
		Auth:    authService,
		Users:   userService,
		Email:   emailService,
		Feature: featureService,
	}
}
