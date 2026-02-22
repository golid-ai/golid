package service

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/golid-ai/golid/backend/internal/logger"
)

// EmailConfig holds Mailgun configuration.
type EmailConfig struct {
	APIKey           string        // Mailgun API key
	Domain           string        // Mailgun domain (e.g., sandbox...mailgun.org)
	BaseURL          string        // Mailgun API URL (https://api.mailgun.net)
	FromEmail        string        // Sender email address
	FromName         string        // Sender name
	FrontendURL      string        // Frontend URL for generating links
	DevEmailOverride string        // If set, all outbound emails go to this address (dev/testing)
	AppName          string        // Application name used in emails (default: "Golid")
	Timeout          time.Duration // HTTP client timeout (default: 30s)
	PasswordResetTTL time.Duration // Password reset link expiry (used in email copy)
}

// EmailService handles sending emails via Mailgun.
type EmailService struct {
	config     EmailConfig
	httpClient *http.Client
}

// NewEmailService creates a new email service with Mailgun.
func NewEmailService(config EmailConfig) *EmailService {
	// Set defaults
	if config.BaseURL == "" {
		config.BaseURL = "https://api.mailgun.net"
	}
	if config.AppName == "" {
		config.AppName = "Golid"
	}
	if config.FromName == "" {
		config.FromName = config.AppName
	}
	if config.FromEmail == "" {
		config.FromEmail = "noreply@" + config.Domain
	}

	timeout := config.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	return &EmailService{
		config: config,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// IsConfigured returns true if Mailgun credentials are set.
func (s *EmailService) IsConfigured() bool {
	return s.config.APIKey != "" && s.config.Domain != ""
}

// SendVerificationEmail sends an email verification link.
func (s *EmailService) SendVerificationEmail(toEmail, token string) error {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", s.config.FrontendURL, token)

	subject := fmt.Sprintf("Verify your %s email", s.config.AppName)
	textBody := fmt.Sprintf(`Welcome to %s!

Please verify your email address by clicking the link below:

%s

If you didn't create an account, you can safely ignore this email.

Thanks,
The %s team`, s.config.AppName, verifyURL, s.config.AppName)

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0d9488;">Welcome to %s!</h1>
  <p>Please verify your email address by clicking the button below:</p>
  <p style="margin: 30px 0;">
    <a href="%s" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
  </p>
  <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">Thanks,<br>The %s team</p>
</body>
</html>`, s.config.AppName, verifyURL, s.config.AppName)

	return s.sendEmail(toEmail, subject, textBody, htmlBody)
}

// SendPasswordResetEmail sends a password reset link.
func (s *EmailService) SendPasswordResetEmail(toEmail, token string) error {
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", s.config.FrontendURL, token)
	expiry := formatDuration(s.config.PasswordResetTTL)

	subject := fmt.Sprintf("Reset your %s password", s.config.AppName)
	textBody := fmt.Sprintf(`Hi there,

We received a request to reset your password. Click the link below to choose a new one:

%s

This link expires in %s.

If you didn't request a password reset, you can safely ignore this email.

Thanks,
The %s team`, resetURL, expiry, s.config.AppName)

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0d9488;">Reset Your Password</h1>
  <p>We received a request to reset your password. Click the button below to choose a new one:</p>
  <p style="margin: 30px 0;">
    <a href="%s" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
  </p>
  <p style="color: #666; font-size: 14px;">This link expires in %s.</p>
  <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">Thanks,<br>The %s team</p>
</body>
</html>`, resetURL, expiry, s.config.AppName)

	return s.sendEmail(toEmail, subject, textBody, htmlBody)
}

// SendWelcomeEmail sends a welcome email after registration.
func (s *EmailService) SendWelcomeEmail(toEmail, firstName string) error {
	dashboardURL := fmt.Sprintf("%s/dashboard", s.config.FrontendURL)

	name := firstName
	if name == "" {
		name = "there"
	}

	subject := fmt.Sprintf("Welcome to %s!", s.config.AppName)
	textBody := fmt.Sprintf(`Hi %s,

Welcome to %s! We're glad you're here.

Head to your dashboard to get started: %s

If you have any questions, just reply to this email.

Thanks,
The %s team`, name, s.config.AppName, dashboardURL, s.config.AppName)

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0d9488;">Welcome to %s, %s!</h1>
  <p>We're glad you're here.</p>
  <p>Head to your dashboard to get started.</p>
  <p style="margin: 30px 0;">
    <a href="%s" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
  </p>
  <p style="color: #666; font-size: 14px;">If you have any questions, just reply to this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">Thanks,<br>The %s team</p>
</body>
</html>`, s.config.AppName, name, dashboardURL, s.config.AppName)

	return s.sendEmail(toEmail, subject, textBody, htmlBody)
}

// sendEmail sends an email via Mailgun API.
// SendRawEmail sends a plain-text email with the given subject and body.
func (s *EmailService) SendRawEmail(to, subject, body string) error {
	return s.sendEmail(to, subject, body, "")
}

func (s *EmailService) sendEmail(to, subject, textBody, htmlBody string) error {
	// Dev email override: redirect all emails to a single address
	if s.config.DevEmailOverride != "" {
		logger.Info("📧 Email redirected (dev override)",
			slog.String("original_to", to),
			slog.String("redirected_to", s.config.DevEmailOverride),
			slog.String("subject", subject),
		)
		to = s.config.DevEmailOverride
	}

	// Log the email if not configured (development mode)
	if !s.IsConfigured() {
		logger.Info("📧 Email (not sent - Mailgun not configured)",
			slog.String("to", to),
			slog.String("subject", subject),
		)
		return nil
	}

	// Build Mailgun API URL
	apiURL := fmt.Sprintf("%s/v3/%s/messages", s.config.BaseURL, s.config.Domain)

	// Build form data
	form := url.Values{}
	form.Set("from", fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromEmail))
	form.Set("to", to)
	form.Set("subject", subject)
	form.Set("text", textBody)
	if htmlBody != "" {
		form.Set("html", htmlBody)
	}

	// Create request
	req, err := http.NewRequest("POST", apiURL, strings.NewReader(form.Encode()))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	req.SetBasicAuth("api", s.config.APIKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	// Send request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close() //nolint:errcheck // best-effort close

	// Check response
	if resp.StatusCode >= 400 {
		body, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			logger.Error("failed to read Mailgun error body", slog.String("error", readErr.Error()))
		}
		logger.Error("Mailgun API error",
			slog.Int("status", resp.StatusCode),
			slog.String("body", string(body)),
		)
		return fmt.Errorf("mailgun error: %s", resp.Status)
	}

	// Parse response
	var result struct {
		ID      string `json:"id"`
		Message string `json:"message"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		// Response parsing failed but email might have been sent
		logger.Warn("Failed to parse Mailgun response", slog.String("error", err.Error()))
	}

	logger.Info("📧 Email sent",
		slog.String("to", to),
		slog.String("subject", subject),
		slog.String("messageId", result.ID),
	)

	return nil
}

// formatDuration returns a human-readable string like "1 hour" or "30 minutes".
func formatDuration(d time.Duration) string {
	if d == 0 {
		d = time.Hour
	}
	if h := int(d.Hours()); h > 0 && d == time.Duration(h)*time.Hour {
		if h == 1 {
			return "1 hour"
		}
		return fmt.Sprintf("%d hours", h)
	}
	m := int(d.Minutes())
	if m == 1 {
		return "1 minute"
	}
	return fmt.Sprintf("%d minutes", m)
}

