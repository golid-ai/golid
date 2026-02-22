package service

import (
	"testing"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

func TestValidateRegisterInput(t *testing.T) {
	tests := []struct {
		name    string
		input   *RegisterInput
		wantErr bool
		errCode apperror.Code
	}{
		{
			name: "valid registration",
			input: &RegisterInput{
				Email:     "test@example.com",
				Password:  "password123",
				FirstName: "John",
				LastName:  "Doe",
			},
			wantErr: false,
		},
		{
			name: "missing email",
			input: &RegisterInput{
				Password:  "password123",
				FirstName: "John",
				LastName:  "Doe",
			},
			wantErr: true,
			errCode: apperror.CodeValidation,
		},
		{
			name: "empty email",
			input: &RegisterInput{
				Email:     "",
				Password:  "password123",
				FirstName: "John",
				LastName:  "Doe",
			},
			wantErr: true,
			errCode: apperror.CodeValidation,
		},
		{
			name: "password too short",
			input: &RegisterInput{
				Email:     "test@example.com",
				Password:  "short",
				FirstName: "John",
				LastName:  "Doe",
			},
			wantErr: true,
			errCode: apperror.CodeValidation,
		},
		{
			name: "password exactly 7 characters",
			input: &RegisterInput{
				Email:     "test@example.com",
				Password:  "1234567",
				FirstName: "John",
				LastName:  "Doe",
			},
			wantErr: true,
			errCode: apperror.CodeValidation,
		},
		{
			name: "password exactly 8 characters is valid",
			input: &RegisterInput{
				Email:     "test@example.com",
				Password:  "12345678",
				FirstName: "John",
				LastName:  "Doe",
			},
			wantErr: false,
		},
		{
			name: "empty password",
			input: &RegisterInput{
				Email:     "test@example.com",
				Password:  "",
				FirstName: "John",
				LastName:  "Doe",
			},
			wantErr: true,
			errCode: apperror.CodeValidation,
		},
		{
			name: "missing first name",
			input: &RegisterInput{
				Email:    "test@example.com",
				Password: "password123",
				LastName: "Doe",
			},
			wantErr: true,
			errCode: apperror.CodeValidation,
		},
		{
			name: "missing last name",
			input: &RegisterInput{
				Email:     "test@example.com",
				Password:  "password123",
				FirstName: "John",
			},
			wantErr: true,
			errCode: apperror.CodeValidation,
		},
		{
			name: "multiple validation errors",
			input: &RegisterInput{
				Email:    "",
				Password: "short",
			},
			wantErr: true,
			errCode: apperror.CodeValidation,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateRegisterInput(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateRegisterInput() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr && tt.errCode != "" {
				if !apperror.Is(err, tt.errCode) {
					t.Errorf("validateRegisterInput() error code = %v, want %v", err, tt.errCode)
				}
			}
		})
	}
}

func TestGenerateResetToken(t *testing.T) {
	tokens := make(map[string]bool)
	for i := 0; i < 10; i++ {
		selector, verifier, token, err := generateResetToken()
		if err != nil {
			t.Fatalf("generateResetToken() error = %v", err)
		}

		if token == "" {
			t.Error("generateResetToken() returned empty token")
		}
		if selector == "" {
			t.Error("generateResetToken() returned empty selector")
		}
		if verifier == "" {
			t.Error("generateResetToken() returned empty verifier")
		}

		if tokens[token] {
			t.Error("generateResetToken() returned duplicate token")
		}
		tokens[token] = true

		if len(selector) < 10 {
			t.Errorf("selector too short: %d", len(selector))
		}
		if len(verifier) < 20 {
			t.Errorf("verifier too short: %d", len(verifier))
		}
	}
}

func TestParseResetToken(t *testing.T) {
	tests := []struct {
		name      string
		token     string
		wantErr   bool
		wantSel   string
		wantVerif string
	}{
		{
			name:      "valid token",
			token:     "selector.verifier",
			wantSel:   "selector",
			wantVerif: "verifier",
		},
		{
			name:    "missing separator",
			token:   "notseparated",
			wantErr: true,
		},
		{
			name:    "empty string",
			token:   "",
			wantErr: true,
		},
		{
			name:      "multiple dots",
			token:     "part1.part2.part3",
			wantSel:   "part1",
			wantVerif: "part2.part3",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sel, verif, err := parseResetToken(tt.token)
			if (err != nil) != tt.wantErr {
				t.Errorf("parseResetToken() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if sel != tt.wantSel {
					t.Errorf("parseResetToken() selector = %v, want %v", sel, tt.wantSel)
				}
				if verif != tt.wantVerif {
					t.Errorf("parseResetToken() verifier = %v, want %v", verif, tt.wantVerif)
				}
			}
		})
	}
}

func TestHashVerifier(t *testing.T) {
	hash1 := hashVerifier("test-verifier")
	hash2 := hashVerifier("test-verifier")
	if hash1 != hash2 {
		t.Error("hashVerifier() should produce consistent hashes")
	}

	hash3 := hashVerifier("different-verifier")
	if hash1 == hash3 {
		t.Error("hashVerifier() should produce different hashes for different inputs")
	}

	if len(hash1) != 64 {
		t.Errorf("hashVerifier() hash length = %d, want 64", len(hash1))
	}
}

func TestVerifyHash(t *testing.T) {
	verifier := "my-secret-verifier"
	hash := hashVerifier(verifier)

	tests := []struct {
		name     string
		verifier string
		hash     string
		want     bool
	}{
		{"correct verifier", verifier, hash, true},
		{"wrong verifier", "wrong-verifier", hash, false},
		{"empty verifier", "", hash, false},
		{"empty hash", verifier, "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := verifyHash(tt.verifier, tt.hash)
			if result != tt.want {
				t.Errorf("verifyHash() = %v, want %v", result, tt.want)
			}
		})
	}
}

func TestGenerateVerificationToken(t *testing.T) {
	tokens := make(map[string]bool)
	for i := 0; i < 10; i++ {
		selector, verifier, token, err := generateVerificationToken()
		if err != nil {
			t.Fatalf("generateVerificationToken() error = %v", err)
		}

		if selector == "" || verifier == "" || token == "" {
			t.Error("generateVerificationToken() returned empty value")
		}

		if tokens[token] {
			t.Error("generateVerificationToken() returned duplicate token")
		}
		tokens[token] = true

		if len(token) < 40 {
			t.Errorf("generateVerificationToken() token too short: %d", len(token))
		}

		if token != selector+"."+verifier {
			t.Error("token should be selector.verifier")
		}
	}
}

func TestResetTokenRoundtrip(t *testing.T) {
	originalSelector, originalVerifier, token, err := generateResetToken()
	if err != nil {
		t.Fatalf("generateResetToken() error = %v", err)
	}

	parsedSelector, parsedVerifier, err := parseResetToken(token)
	if err != nil {
		t.Fatalf("parseResetToken() error = %v", err)
	}

	if parsedSelector != originalSelector {
		t.Errorf("selector mismatch: got %v, want %v", parsedSelector, originalSelector)
	}
	if parsedVerifier != originalVerifier {
		t.Errorf("verifier mismatch: got %v, want %v", parsedVerifier, originalVerifier)
	}

	hash := hashVerifier(originalVerifier)
	if !verifyHash(parsedVerifier, hash) {
		t.Error("verifyHash failed for valid verifier")
	}
}

func TestAuthResultStructure(t *testing.T) {
	result := AuthResult{
		AccessToken:  "access",
		RefreshToken: "refresh",
		ExpiresIn:    3600,
		User: &User{
			ID:    "123",
			Email: "test@example.com",
			Type:  "user",
		},
	}

	if result.AccessToken != "access" {
		t.Error("AuthResult.AccessToken not set correctly")
	}
	if result.User == nil {
		t.Error("AuthResult.User should not be nil")
	}
	if result.User.Type != "user" {
		t.Error("AuthResult.User.Type not set correctly")
	}
}

func TestRegisterInputStructure(t *testing.T) {
	input := RegisterInput{
		Email:     "test@example.com",
		Password:  "password123",
		FirstName: "John",
		LastName:  "Doe",
	}

	if input.Email != "test@example.com" {
		t.Error("RegisterInput.Email not set correctly")
	}
	if input.FirstName != "John" {
		t.Error("RegisterInput.FirstName not set correctly")
	}
}
