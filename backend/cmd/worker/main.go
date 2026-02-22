package main

import (
	"log/slog"
	"os"

	"github.com/hibiken/asynq"

	"github.com/golid-ai/golid/backend/internal/config"
	"github.com/golid-ai/golid/backend/internal/logger"
	"github.com/golid-ai/golid/backend/internal/queue"
	"github.com/golid-ai/golid/backend/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", slog.String("error", err.Error()))
		os.Exit(1)
	}

	logger.Init(cfg.Environment)

	if cfg.RedisURL == "" {
		logger.Error("worker requires REDIS_URL to be set")
		os.Exit(1)
	}

	emailService := service.NewEmailService(service.EmailConfig{
		APIKey:           cfg.MailgunAPIKey,
		Domain:           cfg.MailgunDomain,
		BaseURL:          cfg.MailgunBaseURL,
		FrontendURL:      cfg.FrontendURL,
		DevEmailOverride: cfg.DevEmailOverride,
		AppName:          cfg.AppName,
		Timeout:          cfg.EmailTimeout,
		PasswordResetTTL: cfg.PasswordResetTTL,
	})

	emailHandler := queue.NewEmailHandler(emailService)
	mux := asynq.NewServeMux()
	mux.HandleFunc(queue.TypeSendVerificationEmail, emailHandler.HandleVerification)
	mux.HandleFunc(queue.TypeSendPasswordReset, emailHandler.HandlePasswordReset)

	opt, err := asynq.ParseRedisURI(cfg.RedisURL)
	if err != nil {
		logger.Error("invalid REDIS_URL", slog.String("error", err.Error()))
		os.Exit(1)
	}

	srv := asynq.NewServer(opt, asynq.Config{
		Concurrency: cfg.WorkerConcurrency,
	})

	logger.Info("worker starting",
		slog.String("redis", cfg.RedisURL),
		slog.Int("concurrency", cfg.WorkerConcurrency),
	)

	if err := srv.Run(mux); err != nil {
		logger.Error("worker failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
}
