//go:build integration

package service

import (
	"context"
	"testing"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

func TestVerifyEmail_HappyPath_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	email := "verify-email@example.com"
	_, verificationToken := registerTestUserWithToken(t, svc, email, "password123")

	selector := getVerificationSelector(t, svc, email)
	if selector == "" {
		t.Fatal("new user should have a verification selector")
	}

	err := svc.VerifyEmail(ctx, &VerifyEmailInput{Token: verificationToken})
	if err != nil {
		t.Fatalf("VerifyEmail() error = %v", err)
	}

	selectorAfter := getVerificationSelector(t, svc, email)
	if selectorAfter != "" {
		t.Error("verification selector should be cleared after verification")
	}

	var verified bool
	err = svc.pool.QueryRow(ctx, "SELECT email_verified FROM users WHERE email = $1", email).Scan(&verified)
	if err != nil {
		t.Fatalf("query email_verified: %v", err)
	}
	if !verified {
		t.Error("email_verified should be true after verification")
	}
}

func TestVerifyEmail_InvalidToken_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()

	err := svc.VerifyEmail(context.Background(), &VerifyEmailInput{Token: "nonexistent-token"})
	if err == nil {
		t.Fatal("VerifyEmail() with invalid token should fail")
	}
	if !apperror.Is(err, apperror.CodeBadRequest) {
		t.Errorf("expected CodeBadRequest, got: %v", err)
	}
}

func TestVerifyEmail_EmptyToken_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()

	err := svc.VerifyEmail(context.Background(), &VerifyEmailInput{Token: ""})
	if err == nil {
		t.Fatal("VerifyEmail() with empty token should fail")
	}
	if !apperror.Is(err, apperror.CodeBadRequest) {
		t.Errorf("expected CodeBadRequest, got: %v", err)
	}
}

func TestResendVerification_HappyPath_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	email := "resend@example.com"
	_, originalToken := registerTestUserWithToken(t, svc, email, "password123")

	originalSelector := getVerificationSelector(t, svc, email)
	if originalSelector == "" {
		t.Fatal("new user should have a verification selector")
	}

	newToken, err := svc.ResendVerification(ctx, &ResendVerificationInput{Email: email})
	if err != nil {
		t.Fatalf("ResendVerification() error = %v", err)
	}
	if newToken == "" {
		t.Fatal("expected non-empty new verification token")
	}

	newSelector := getVerificationSelector(t, svc, email)
	if newSelector == originalSelector {
		t.Error("new selector should differ from original")
	}

	err = svc.VerifyEmail(ctx, &VerifyEmailInput{Token: originalToken})
	if err == nil {
		t.Fatal("VerifyEmail with old token should fail after resend")
	}

	err = svc.VerifyEmail(ctx, &VerifyEmailInput{Token: newToken})
	if err != nil {
		t.Fatalf("VerifyEmail with new token should succeed: %v", err)
	}
}

func TestResendVerification_AlreadyVerified_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	email := "already-verified@example.com"
	registerTestUser(t, svc, email, "password123")
	setEmailVerified(t, svc, email, true)

	token, err := svc.ResendVerification(ctx, &ResendVerificationInput{Email: email})
	if err != nil {
		t.Fatalf("ResendVerification() returned unexpected error: %v", err)
	}
	if token != "" {
		t.Error("expected empty token for already-verified email")
	}
}

func TestResendVerification_NonExistentEmail_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()

	// Returns ("", nil) to prevent email enumeration
	token, err := svc.ResendVerification(context.Background(), &ResendVerificationInput{
		Email: "ghost@example.com",
	})
	if err != nil {
		t.Fatalf("ResendVerification() should not error for non-existent email: %v", err)
	}
	if token != "" {
		t.Errorf("token should be empty for non-existent email, got %q", token)
	}
}
