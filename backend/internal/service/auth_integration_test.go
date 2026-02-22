//go:build integration

package service

import (
	"context"
	"testing"
	"time"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/testutil"
)

const testJWTSecret = "test-jwt-secret-that-is-at-least-32-characters-long!"

func newTestAuthService(t *testing.T) (*AuthService, func()) {
	t.Helper()
	db := testutil.SetupTestDB()
	svc := NewAuthService(db.Pool, testJWTSecret, "test-issuer", 15*time.Minute, 7*24*time.Hour, 1*time.Hour)
	return svc, func() {
		ctx := context.Background()
		db.CleanAllTables(ctx)
		db.Close()
	}
}

func TestRegister_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()

	result, err := svc.Register(context.Background(), &RegisterInput{
		Email:     "new@example.com",
		Password:  "password123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}
	if result.AccessToken == "" {
		t.Error("expected non-empty access token")
	}
	if result.RefreshToken == "" {
		t.Error("expected non-empty refresh token")
	}
	if result.User == nil {
		t.Fatal("expected non-nil user")
	}
	if result.User.Email != "new@example.com" {
		t.Errorf("user email = %q, want %q", result.User.Email, "new@example.com")
	}
}

func TestRegister_DuplicateEmail_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()

	input := &RegisterInput{
		Email:     "dupe@example.com",
		Password:  "password123",
		FirstName: "Test",
		LastName:  "User",
	}

	_, err := svc.Register(context.Background(), input)
	if err != nil {
		t.Fatalf("first Register() error = %v", err)
	}

	_, err = svc.Register(context.Background(), input)
	if err == nil {
		t.Fatal("second Register() expected conflict error")
	}
	if !apperror.Is(err, apperror.CodeConflict) {
		t.Errorf("expected CodeConflict, got: %v", err)
	}
}

func TestLogin_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()

	_, err := svc.Register(context.Background(), &RegisterInput{
		Email:     "login@example.com",
		Password:  "password123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	result, err := svc.Login(context.Background(), &LoginInput{
		Email:    "login@example.com",
		Password: "password123",
	})
	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}
	if result.AccessToken == "" {
		t.Error("expected non-empty access token")
	}
}

func TestLogin_WrongPassword_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()

	_, err := svc.Register(context.Background(), &RegisterInput{
		Email:     "wrongpw@example.com",
		Password:  "correctpassword",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	_, err = svc.Login(context.Background(), &LoginInput{
		Email:    "wrongpw@example.com",
		Password: "wrongpassword",
	})
	if err == nil {
		t.Fatal("Login() with wrong password expected error")
	}
	if !apperror.Is(err, apperror.CodeUnauthorized) {
		t.Errorf("expected CodeUnauthorized, got: %v", err)
	}
}

func TestChangePassword_WrongCurrent_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()

	result, err := svc.Register(context.Background(), &RegisterInput{
		Email:     "changepw@example.com",
		Password:  "oldpassword123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	err = svc.ChangePassword(context.Background(), &ChangePasswordInput{
		UserID:          result.User.ID,
		CurrentPassword: "wrongcurrentpw",
		NewPassword:     "newpassword123",
	})
	if err == nil {
		t.Fatal("ChangePassword() with wrong current expected error")
	}
	if !apperror.Is(err, apperror.CodeBadRequest) {
		t.Errorf("expected CodeBadRequest, got: %v", err)
	}
}

func TestChangePassword_HappyPath_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	result, err := svc.Register(ctx, &RegisterInput{
		Email:     "changepw-ok@example.com",
		Password:  "oldpassword123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	err = svc.ChangePassword(ctx, &ChangePasswordInput{
		UserID:          result.User.ID,
		CurrentPassword: "oldpassword123",
		NewPassword:     "newpassword123",
	})
	if err != nil {
		t.Fatalf("ChangePassword() error = %v", err)
	}

	// Old password should no longer work
	_, err = svc.Login(ctx, &LoginInput{
		Email:    "changepw-ok@example.com",
		Password: "oldpassword123",
	})
	if err == nil {
		t.Fatal("Login with old password should fail after change")
	}

	// New password should work
	_, err = svc.Login(ctx, &LoginInput{
		Email:    "changepw-ok@example.com",
		Password: "newpassword123",
	})
	if err != nil {
		t.Fatalf("Login with new password should succeed: %v", err)
	}
}

func TestChangePassword_ShortPassword_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	result, err := svc.Register(ctx, &RegisterInput{
		Email:     "changepw-short@example.com",
		Password:  "password123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	err = svc.ChangePassword(ctx, &ChangePasswordInput{
		UserID:          result.User.ID,
		CurrentPassword: "password123",
		NewPassword:     "short",
	})
	if err == nil {
		t.Fatal("ChangePassword() with short password should fail")
	}
	if !apperror.Is(err, apperror.CodeValidation) {
		t.Errorf("expected CodeValidation, got: %v", err)
	}
}

func TestChangePassword_RevokesRefreshTokens_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	result, err := svc.Register(ctx, &RegisterInput{
		Email:     "changepw-revoke@example.com",
		Password:  "password123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	oldRefreshToken := result.RefreshToken

	err = svc.ChangePassword(ctx, &ChangePasswordInput{
		UserID:          result.User.ID,
		CurrentPassword: "password123",
		NewPassword:     "newpassword123",
	})
	if err != nil {
		t.Fatalf("ChangePassword() error = %v", err)
	}

	// Old refresh token should be revoked
	_, err = svc.Refresh(ctx, &RefreshInput{RefreshToken: oldRefreshToken})
	if err == nil {
		t.Fatal("Refresh with old token should fail after password change")
	}
	if !apperror.Is(err, apperror.CodeUnauthorized) {
		t.Errorf("expected CodeUnauthorized, got: %v", err)
	}
}

func TestRefresh_HappyPath_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	result, err := svc.Register(ctx, &RegisterInput{
		Email:     "refresh@example.com",
		Password:  "password123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	refreshed, err := svc.Refresh(ctx, &RefreshInput{RefreshToken: result.RefreshToken})
	if err != nil {
		t.Fatalf("Refresh() error = %v", err)
	}
	if refreshed.AccessToken == "" {
		t.Error("expected non-empty access token after refresh")
	}
	if refreshed.RefreshToken == "" {
		t.Error("expected non-empty refresh token after refresh")
	}
	if refreshed.RefreshToken == result.RefreshToken {
		t.Error("refreshed token should be different from original (old token is rotated)")
	}
}

func TestRefresh_RevokedToken_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	result, err := svc.Register(ctx, &RegisterInput{
		Email:     "refresh-revoked@example.com",
		Password:  "password123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	// Logout revokes all tokens
	if err := svc.Logout(ctx, result.User.ID); err != nil {
		t.Fatalf("Logout() error = %v", err)
	}

	_, err = svc.Refresh(ctx, &RefreshInput{RefreshToken: result.RefreshToken})
	if err == nil {
		t.Fatal("Refresh() with revoked token should fail")
	}
	if !apperror.Is(err, apperror.CodeUnauthorized) {
		t.Errorf("expected CodeUnauthorized, got: %v", err)
	}
}

func TestLogout_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	result, err := svc.Register(ctx, &RegisterInput{
		Email:     "logout@example.com",
		Password:  "password123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	if err := svc.Logout(ctx, result.User.ID); err != nil {
		t.Fatalf("Logout() error = %v", err)
	}

	// Verify refresh token is revoked
	var revoked bool
	err = svc.pool.QueryRow(ctx,
		"SELECT revoked FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
		result.User.ID,
	).Scan(&revoked)
	if err != nil {
		t.Fatalf("query refresh_tokens: %v", err)
	}
	if !revoked {
		t.Error("refresh token should be revoked after logout")
	}
}

func TestForgotPassword_ResetFlow_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	_, err := svc.Register(ctx, &RegisterInput{
		Email:     "reset-flow@example.com",
		Password:  "oldpassword123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	// Step 1: Request password reset
	token, err := svc.ForgotPassword(ctx, &ForgotPasswordInput{
		Email: "reset-flow@example.com",
	})
	if err != nil {
		t.Fatalf("ForgotPassword() error = %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty reset token")
	}

	// Step 2: Verify the token is valid
	verifyResult, err := svc.VerifyResetToken(ctx, &VerifyResetTokenInput{Token: token})
	if err != nil {
		t.Fatalf("VerifyResetToken() error = %v", err)
	}
	if !verifyResult.Valid {
		t.Fatal("reset token should be valid")
	}
	if verifyResult.Email != "reset-flow@example.com" {
		t.Errorf("email = %q, want %q", verifyResult.Email, "reset-flow@example.com")
	}

	// Step 3: Reset the password
	err = svc.ResetPassword(ctx, &ResetPasswordInput{
		Token:       token,
		NewPassword: "brandnewpassword",
	})
	if err != nil {
		t.Fatalf("ResetPassword() error = %v", err)
	}

	// Step 4: Verify old password no longer works
	_, err = svc.Login(ctx, &LoginInput{
		Email:    "reset-flow@example.com",
		Password: "oldpassword123",
	})
	if err == nil {
		t.Fatal("Login with old password should fail after reset")
	}

	// Step 5: Verify new password works
	_, err = svc.Login(ctx, &LoginInput{
		Email:    "reset-flow@example.com",
		Password: "brandnewpassword",
	})
	if err != nil {
		t.Fatalf("Login with new password should succeed: %v", err)
	}
}

func TestResetPassword_AntiReplay_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	_, err := svc.Register(ctx, &RegisterInput{
		Email:     "reset-replay@example.com",
		Password:  "password123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	token, err := svc.ForgotPassword(ctx, &ForgotPasswordInput{Email: "reset-replay@example.com"})
	if err != nil {
		t.Fatalf("ForgotPassword() error = %v", err)
	}

	// First reset should succeed
	err = svc.ResetPassword(ctx, &ResetPasswordInput{Token: token, NewPassword: "newpassword1"})
	if err != nil {
		t.Fatalf("first ResetPassword() error = %v", err)
	}

	// Second reset with same token should fail (token consumed)
	err = svc.ResetPassword(ctx, &ResetPasswordInput{Token: token, NewPassword: "newpassword2"})
	if err == nil {
		t.Fatal("second ResetPassword() with same token should fail (anti-replay)")
	}
	if !apperror.Is(err, apperror.CodeBadRequest) {
		t.Errorf("expected CodeBadRequest, got: %v", err)
	}
}

func TestResetPassword_InvalidToken_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	err := svc.ResetPassword(ctx, &ResetPasswordInput{
		Token:       "invalid.token",
		NewPassword: "newpassword123",
	})
	if err == nil {
		t.Fatal("ResetPassword() with invalid token should fail")
	}
	if !apperror.Is(err, apperror.CodeBadRequest) {
		t.Errorf("expected CodeBadRequest, got: %v", err)
	}
}

func TestResetPassword_ExpiredToken_Integration(t *testing.T) {
	svc, cleanup := newTestAuthService(t)
	defer cleanup()
	ctx := context.Background()

	_, err := svc.Register(ctx, &RegisterInput{
		Email:     "reset-expired@example.com",
		Password:  "password123",
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	token, err := svc.ForgotPassword(ctx, &ForgotPasswordInput{Email: "reset-expired@example.com"})
	if err != nil {
		t.Fatalf("ForgotPassword() error = %v", err)
	}

	// Manually expire the token
	_, err = svc.pool.Exec(ctx,
		"UPDATE users SET password_reset_expires = $1 WHERE email = $2",
		time.Now().Add(-1*time.Hour), "reset-expired@example.com",
	)
	if err != nil {
		t.Fatalf("expire token: %v", err)
	}

	err = svc.ResetPassword(ctx, &ResetPasswordInput{Token: token, NewPassword: "newpassword123"})
	if err == nil {
		t.Fatal("ResetPassword() with expired token should fail")
	}
	if !apperror.Is(err, apperror.CodeBadRequest) {
		t.Errorf("expected CodeBadRequest, got: %v", err)
	}
}

// registerTestUser is a helper that registers a user and returns the ID.
func registerTestUser(t *testing.T, svc *AuthService, email, password string) string {
	t.Helper()
	result, err := svc.Register(context.Background(), &RegisterInput{
		Email:     email,
		Password:  password,
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("registerTestUser(%s) error = %v", email, err)
	}
	return result.User.ID
}

func registerTestUserWithToken(t *testing.T, svc *AuthService, email, password string) (string, string) {
	t.Helper()
	result, err := svc.Register(context.Background(), &RegisterInput{
		Email:     email,
		Password:  password,
		FirstName: "Test",
		LastName:  "User",
	})
	if err != nil {
		t.Fatalf("registerTestUserWithToken(%s) error = %v", email, err)
	}
	return result.User.ID, result.VerificationToken
}

// getVerificationSelector reads the verification selector directly from the DB.
func getVerificationSelector(t *testing.T, svc *AuthService, email string) string {
	t.Helper()
	var selector *string
	err := svc.pool.QueryRow(context.Background(),
		"SELECT verification_selector FROM users WHERE email = $1", email,
	).Scan(&selector)
	if err != nil {
		t.Fatalf("getVerificationSelector(%s) error = %v", email, err)
	}
	if selector == nil {
		return ""
	}
	return *selector
}

func setEmailVerified(t *testing.T, svc *AuthService, email string, verified bool) {
	t.Helper()
	_, err := svc.pool.Exec(context.Background(),
		"UPDATE users SET email_verified = $2, verification_selector = CASE WHEN $2 THEN NULL ELSE verification_selector END, verification_verifier_hash = CASE WHEN $2 THEN NULL ELSE verification_verifier_hash END WHERE email = $1",
		email, verified,
	)
	if err != nil {
		t.Fatalf("setEmailVerified(%s, %t): %v", email, verified, err)
	}
}
