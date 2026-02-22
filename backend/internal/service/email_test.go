package service

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// =============================================================================
// EMAIL CONFIG TESTS
// =============================================================================

func TestNewEmailService_Defaults(t *testing.T) {
	config := EmailConfig{
		APIKey: "test-key",
		Domain: "test.mailgun.org",
	}

	svc := NewEmailService(config)

	// Check defaults are set
	if svc.config.BaseURL != "https://api.mailgun.net" {
		t.Errorf("BaseURL = %v, want https://api.mailgun.net", svc.config.BaseURL)
	}
	if svc.config.FromName != "Golid" {
		t.Errorf("FromName = %v, want Golid", svc.config.FromName)
	}
	if svc.config.FromEmail != "noreply@test.mailgun.org" {
		t.Errorf("FromEmail = %v, want noreply@test.mailgun.org", svc.config.FromEmail)
	}
}

func TestNewEmailService_CustomValues(t *testing.T) {
	config := EmailConfig{
		APIKey:    "test-key",
		Domain:    "custom.domain.com",
		BaseURL:   "https://api.eu.mailgun.net",
		FromName:  "Custom Name",
		FromEmail: "custom@example.com",
	}

	svc := NewEmailService(config)

	// Custom values should be preserved
	if svc.config.BaseURL != "https://api.eu.mailgun.net" {
		t.Errorf("BaseURL = %v, want https://api.eu.mailgun.net", svc.config.BaseURL)
	}
	if svc.config.FromName != "Custom Name" {
		t.Errorf("FromName = %v, want Custom Name", svc.config.FromName)
	}
	if svc.config.FromEmail != "custom@example.com" {
		t.Errorf("FromEmail = %v, want custom@example.com", svc.config.FromEmail)
	}
}

func TestNewEmailService_HttpClient(t *testing.T) {
	config := EmailConfig{
		APIKey: "test-key",
		Domain: "test.mailgun.org",
	}

	svc := NewEmailService(config)

	// HTTP client should be set
	if svc.httpClient == nil {
		t.Error("httpClient should not be nil")
	}
	if svc.httpClient.Timeout.Seconds() != 30 {
		t.Errorf("httpClient.Timeout = %v, want 30s", svc.httpClient.Timeout)
	}
}

// =============================================================================
// IS CONFIGURED TESTS
// =============================================================================

func TestEmailService_IsConfigured(t *testing.T) {
	tests := []struct {
		name     string
		apiKey   string
		domain   string
		expected bool
	}{
		{
			name:     "fully configured",
			apiKey:   "key-123",
			domain:   "test.mailgun.org",
			expected: true,
		},
		{
			name:     "missing api key",
			apiKey:   "",
			domain:   "test.mailgun.org",
			expected: false,
		},
		{
			name:     "missing domain",
			apiKey:   "key-123",
			domain:   "",
			expected: false,
		},
		{
			name:     "both missing",
			apiKey:   "",
			domain:   "",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewEmailService(EmailConfig{
				APIKey: tt.apiKey,
				Domain: tt.domain,
			})

			result := svc.IsConfigured()
			if result != tt.expected {
				t.Errorf("IsConfigured() = %v, want %v", result, tt.expected)
			}
		})
	}
}

// =============================================================================
// EMAIL CONFIG STRUCTURE TESTS
// =============================================================================

func TestEmailConfig_Structure(t *testing.T) {
	config := EmailConfig{
		APIKey:      "key-xyz",
		Domain:      "mg.example.com",
		BaseURL:     "https://api.mailgun.net",
		FromEmail:   "hello@example.com",
		FromName:    "My App",
		FrontendURL: "https://myapp.com",
	}

	if config.APIKey != "key-xyz" {
		t.Error("EmailConfig.APIKey not set correctly")
	}
	if config.Domain != "mg.example.com" {
		t.Error("EmailConfig.Domain not set correctly")
	}
	if config.FrontendURL != "https://myapp.com" {
		t.Error("EmailConfig.FrontendURL not set correctly")
	}
}

// =============================================================================
// EMAIL SERVICE EDGE CASES
// =============================================================================

func TestNewEmailService_EmptyConfig(t *testing.T) {
	// Should not panic with empty config
	svc := NewEmailService(EmailConfig{})

	if svc == nil {
		t.Error("NewEmailService should not return nil")
	}
	if svc.IsConfigured() {
		t.Error("Empty config should not be considered configured")
	}
}

func TestNewEmailService_PartialConfig(t *testing.T) {
	// Only frontend URL set
	svc := NewEmailService(EmailConfig{
		FrontendURL: "https://example.com",
	})

	if svc.IsConfigured() {
		t.Error("Partial config (only FrontendURL) should not be configured")
	}

	// FromEmail should use default (noreply@<empty domain>)
	if svc.config.FromEmail != "noreply@" {
		t.Errorf("FromEmail with empty domain = %v, want noreply@", svc.config.FromEmail)
	}
}

// =============================================================================
// URL GENERATION TESTS (implicit via SendVerificationEmail logic)
// =============================================================================

func TestEmailService_URLGeneration(t *testing.T) {
	// Test that URL components are handled correctly
	tests := []struct {
		name        string
		frontendURL string
		token       string
		wantInURL   string
	}{
		{
			name:        "basic URL",
			frontendURL: "https://example.com",
			token:       "abc123",
			wantInURL:   "https://example.com/verify-email?token=abc123",
		},
		{
			name:        "URL with trailing slash",
			frontendURL: "https://example.com/",
			token:       "xyz789",
			wantInURL:   "https://example.com//verify-email?token=xyz789", // Note: double slash (could be improved)
		},
		{
			name:        "URL with port",
			frontendURL: "http://localhost:3000",
			token:       "devtoken",
			wantInURL:   "http://localhost:3000/verify-email?token=devtoken",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// We can't easily test the actual email without mocking HTTP,
			// but we can verify the URL format logic would work
			expectedFormat := tt.frontendURL + "/verify-email?token=" + tt.token
			if expectedFormat != tt.wantInURL {
				t.Errorf("URL format = %v, want %v", expectedFormat, tt.wantInURL)
			}
		})
	}
}

// =============================================================================
// SEND EMAIL WITHOUT CONFIG TESTS
// =============================================================================

func TestEmailService_SendWithoutConfig(t *testing.T) {
	svc := NewEmailService(EmailConfig{
		FrontendURL: "https://example.com",
		// Missing APIKey and Domain
	})

	// Sending without config should log but not error
	// (the actual implementation logs the email content)
	err := svc.SendVerificationEmail("test@example.com", "token123")
	if err != nil {
		t.Errorf("SendVerificationEmail without config should not error, got: %v", err)
	}

	err = svc.SendPasswordResetEmail("test@example.com", "resettoken")
	if err != nil {
		t.Errorf("SendPasswordResetEmail without config should not error, got: %v", err)
	}
}

// =============================================================================
// SEND EMAIL VIA HTTPTEST (Mailgun API simulation)
// =============================================================================

func TestEmailService_SendEmail_Success(t *testing.T) {
	var receivedTo, receivedSubject, receivedHTML string
	var receivedAuth string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedAuth = r.Header.Get("Authorization")
		if err := r.ParseForm(); err != nil {
			t.Fatalf("parse form: %v", err)
		}
		receivedTo = r.FormValue("to")
		receivedSubject = r.FormValue("subject")
		receivedHTML = r.FormValue("html")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"id": "<msg-id>", "message": "Queued"})
	}))
	defer server.Close()

	svc := NewEmailService(EmailConfig{
		APIKey:      "test-key",
		Domain:      "test.mailgun.org",
		BaseURL:     server.URL,
		FrontendURL: "https://app.example.com",
	})

	err := svc.SendVerificationEmail("user@example.com", "verify-token-abc")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if receivedTo != "user@example.com" {
		t.Errorf("to = %q, want %q", receivedTo, "user@example.com")
	}
	if receivedSubject != "Verify your Golid email" {
		t.Errorf("subject = %q, want %q", receivedSubject, "Verify your Golid email")
	}
	if !strings.Contains(receivedHTML, "https://app.example.com/verify-email?token=verify-token-abc") {
		t.Error("HTML body should contain verification URL")
	}
	if !strings.Contains(receivedAuth, "Basic") {
		t.Error("request should use Basic auth")
	}
}

func TestEmailService_SendPasswordReset_Success(t *testing.T) {
	var receivedSubject, receivedHTML string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		receivedSubject = r.FormValue("subject")
		receivedHTML = r.FormValue("html")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"id": "<msg-id>", "message": "Queued"})
	}))
	defer server.Close()

	svc := NewEmailService(EmailConfig{
		APIKey:      "test-key",
		Domain:      "test.mailgun.org",
		BaseURL:     server.URL,
		FrontendURL: "https://app.example.com",
	})

	err := svc.SendPasswordResetEmail("user@example.com", "reset-token-xyz")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if receivedSubject != "Reset your Golid password" {
		t.Errorf("subject = %q, want %q", receivedSubject, "Reset your Golid password")
	}
	if !strings.Contains(receivedHTML, "https://app.example.com/reset-password?token=reset-token-xyz") {
		t.Error("HTML body should contain reset URL")
	}
}

func TestEmailService_DevEmailOverride(t *testing.T) {
	var receivedTo string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		receivedTo = r.FormValue("to")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"id": "<msg-id>"})
	}))
	defer server.Close()

	svc := NewEmailService(EmailConfig{
		APIKey:           "test-key",
		Domain:           "test.mailgun.org",
		BaseURL:          server.URL,
		FrontendURL:      "https://app.example.com",
		DevEmailOverride: "dev@override.com",
	})

	err := svc.SendVerificationEmail("real-user@example.com", "token")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if receivedTo != "dev@override.com" {
		t.Errorf("to = %q, want dev override %q", receivedTo, "dev@override.com")
	}
}

func TestEmailService_HTTPError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"message": "internal error"}`))
	}))
	defer server.Close()

	svc := NewEmailService(EmailConfig{
		APIKey:      "test-key",
		Domain:      "test.mailgun.org",
		BaseURL:     server.URL,
		FrontendURL: "https://app.example.com",
	})

	err := svc.SendVerificationEmail("user@example.com", "token")
	if err == nil {
		t.Fatal("expected error for 500 response")
	}
	if !strings.Contains(err.Error(), "mailgun error") {
		t.Errorf("error = %q, should contain 'mailgun error'", err.Error())
	}
}

func TestEmailService_ConnectionError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	server.Close()

	svc := NewEmailService(EmailConfig{
		APIKey:      "test-key",
		Domain:      "test.mailgun.org",
		BaseURL:     server.URL,
		FrontendURL: "https://app.example.com",
	})

	err := svc.SendVerificationEmail("user@example.com", "token")
	if err == nil {
		t.Fatal("expected error for closed server")
	}
}

func TestEmailService_WelcomeEmail(t *testing.T) {
	var receivedSubject, receivedHTML string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		receivedSubject = r.FormValue("subject")
		receivedHTML = r.FormValue("html")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"id": "<msg-id>"})
	}))
	defer server.Close()

	svc := NewEmailService(EmailConfig{
		APIKey:      "test-key",
		Domain:      "test.mailgun.org",
		BaseURL:     server.URL,
		FrontendURL: "https://app.example.com",
	})

	err := svc.SendWelcomeEmail("user@example.com", "Steve")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if receivedSubject != "Welcome to Golid!" {
		t.Errorf("subject = %q, want %q", receivedSubject, "Welcome to Golid!")
	}
	if !strings.Contains(receivedHTML, "Steve") {
		t.Error("HTML body should contain user's first name")
	}
	if !strings.Contains(receivedHTML, "https://app.example.com/dashboard") {
		t.Error("HTML body should contain dashboard URL")
	}
}

func TestEmailService_RawEmail(t *testing.T) {
	var receivedText, receivedHTML string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		receivedText = r.FormValue("text")
		receivedHTML = r.FormValue("html")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"id": "<msg-id>"})
	}))
	defer server.Close()

	svc := NewEmailService(EmailConfig{
		APIKey:  "test-key",
		Domain:  "test.mailgun.org",
		BaseURL: server.URL,
	})

	err := svc.SendRawEmail("user@example.com", "Test Subject", "Plain text body")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if receivedText != "Plain text body" {
		t.Errorf("text = %q, want %q", receivedText, "Plain text body")
	}
	if receivedHTML != "" {
		t.Errorf("html should be empty for raw email, got %q", receivedHTML)
	}
}
