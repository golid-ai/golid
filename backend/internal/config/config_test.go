package config_test

import (
	"os"
	"testing"

	"github.com/golid-ai/golid/backend/internal/config"
)

func TestLoad_RequiredFields(t *testing.T) {
	// Clear environment
	os.Clearenv()

	_, err := config.Load()
	if err == nil {
		t.Error("expected error when DATABASE_URL is missing")
	}
}

func TestLoad_JWTSecretTooShort(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "short"); err != nil { // Less than 32 chars
		t.Fatal(err)
	}

	_, err := config.Load()
	if err == nil {
		t.Error("expected error when JWT_SECRET is too short")
	}
}

func TestLoad_Success(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "this-is-a-very-long-secret-key-for-testing-purposes"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("PORT", "9000"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("ENVIRONMENT", "production"); err != nil {
		t.Fatal(err)
	}

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.Port != "9000" {
		t.Errorf("expected port 9000, got %s", cfg.Port)
	}

	if cfg.Environment != "production" {
		t.Errorf("expected production environment, got %s", cfg.Environment)
	}

	if !cfg.IsProduction() {
		t.Error("expected IsProduction to return true")
	}
}

func TestLoad_Defaults(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "this-is-a-very-long-secret-key-for-testing-purposes"); err != nil {
		t.Fatal(err)
	}

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.Port != "8080" {
		t.Errorf("expected default port 8080, got %s", cfg.Port)
	}

	if cfg.Environment != "development" {
		t.Errorf("expected default environment development, got %s", cfg.Environment)
	}

	if !cfg.IsDevelopment() {
		t.Error("expected IsDevelopment to return true")
	}
}

func TestLoad_InvalidPort(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "this-is-a-very-long-secret-key-for-testing-purposes"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("PORT", "not-a-number"); err != nil {
		t.Fatal(err)
	}

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.Port != "not-a-number" {
		t.Errorf("expected PORT to pass through as string, got %s", cfg.Port)
	}
}

func TestLoad_CustomAuthRateLimit(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "this-is-a-very-long-secret-key-for-testing-purposes"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("AUTH_RATE_LIMIT", "20"); err != nil {
		t.Fatal(err)
	}

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.AuthRateLimitRequests != 20 {
		t.Errorf("expected AuthRateLimitRequests 20, got %d", cfg.AuthRateLimitRequests)
	}
}

func TestLoad_InvalidAuthRateLimit(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "this-is-a-very-long-secret-key-for-testing-purposes"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("AUTH_RATE_LIMIT", "abc"); err != nil {
		t.Fatal(err)
	}

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.AuthRateLimitRequests != 5 {
		t.Errorf("expected default AuthRateLimitRequests 5 for invalid value, got %d", cfg.AuthRateLimitRequests)
	}
}

func TestLoad_AllowedOrigins_Production(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "this-is-a-very-long-secret-key-for-testing-purposes"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("ENVIRONMENT", "production"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("ALLOWED_ORIGINS", "https://example.com, https://app.example.com"); err != nil {
		t.Fatal(err)
	}

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cfg.AllowedOrigins) != 2 {
		t.Fatalf("expected 2 origins, got %d: %v", len(cfg.AllowedOrigins), cfg.AllowedOrigins)
	}
	if cfg.AllowedOrigins[0] != "https://example.com" {
		t.Errorf("expected first origin https://example.com, got %s", cfg.AllowedOrigins[0])
	}
	if cfg.AllowedOrigins[1] != "https://app.example.com" {
		t.Errorf("expected second origin https://app.example.com, got %s", cfg.AllowedOrigins[1])
	}
}

func TestLoad_AllowedOrigins_NoEnvInProduction(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "this-is-a-very-long-secret-key-for-testing-purposes"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("ENVIRONMENT", "production"); err != nil {
		t.Fatal(err)
	}

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cfg.AllowedOrigins) != 0 {
		t.Errorf("expected empty origins when not set in production, got %v", cfg.AllowedOrigins)
	}
}

func TestLoad_AllowedOrigins_Development(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "this-is-a-very-long-secret-key-for-testing-purposes"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("ENVIRONMENT", "development"); err != nil {
		t.Fatal(err)
	}

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cfg.AllowedOrigins) < 2 {
		t.Errorf("expected dev origins (localhost), got %v", cfg.AllowedOrigins)
	}
}

func TestLoad_InvalidDuration(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "this-is-a-very-long-secret-key-for-testing-purposes"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_ACCESS_DURATION", "not-a-duration"); err != nil {
		t.Fatal(err)
	}

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.JWTAccessDuration == 0 {
		t.Error("expected non-zero default duration for invalid value")
	}
}

func TestLoad_CustomDuration(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "this-is-a-very-long-secret-key-for-testing-purposes"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_ACCESS_DURATION", "30m"); err != nil {
		t.Fatal(err)
	}

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.JWTAccessDuration.Minutes() != 30 {
		t.Errorf("expected 30m duration, got %v", cfg.JWTAccessDuration)
	}
}

func TestLoad_OptionalFields(t *testing.T) {
	os.Clearenv()
	if err := os.Setenv("DATABASE_URL", "postgres://localhost/test"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("JWT_SECRET", "this-is-a-very-long-secret-key-for-testing-purposes"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("REDIS_URL", "redis://localhost:6379"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("MAILGUN_API_KEY", "key-abc123"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("MAILGUN_DOMAIN", "mail.example.com"); err != nil {
		t.Fatal(err)
	}
	if err := os.Setenv("FRONTEND_URL", "https://app.example.com"); err != nil {
		t.Fatal(err)
	}

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.RedisURL != "redis://localhost:6379" {
		t.Errorf("expected RedisURL, got %s", cfg.RedisURL)
	}
	if cfg.MailgunAPIKey != "key-abc123" {
		t.Errorf("expected MailgunAPIKey, got %s", cfg.MailgunAPIKey)
	}
	if cfg.FrontendURL != "https://app.example.com" {
		t.Errorf("expected FrontendURL, got %s", cfg.FrontendURL)
	}
}
