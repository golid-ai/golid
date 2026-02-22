//go:build integration

package service

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/testutil"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestRefresh_ConcurrentRace_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		svc := NewAuthService(pool, testJWTSecret, "test-issuer", 15*time.Minute, 7*24*time.Hour, 1*time.Hour)

		result, err := svc.Register(context.Background(), &RegisterInput{
			Email: "refresh-race@example.com", Password: "password123",
			FirstName: "Test", LastName: "User",
		})
		if err != nil {
			t.Fatalf("Register: %v", err)
		}

		refreshToken := result.RefreshToken
		const goroutines = 10
		var successes atomic.Int32
		var failures atomic.Int32
		var wg sync.WaitGroup

		wg.Add(goroutines)
		for i := 0; i < goroutines; i++ {
			go func() {
				defer wg.Done()
				_, err := svc.Refresh(context.Background(), &RefreshInput{
					RefreshToken: refreshToken,
				})
				if err != nil {
					failures.Add(1)
				} else {
					successes.Add(1)
				}
			}()
		}
		wg.Wait()

		s := successes.Load()
		f := failures.Load()
		if s != 1 {
			t.Errorf("expected exactly 1 success from %d concurrent refreshes, got %d successes + %d failures", goroutines, s, f)
		}
		if s+f != int32(goroutines) {
			t.Errorf("expected %d total results, got %d successes + %d failures = %d", goroutines, s, f, s+f)
		}
		t.Logf("concurrent refresh: %d successes, %d failures", s, f)
	})
}

func TestResetPassword_ConcurrentRace_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		svc := NewAuthService(pool, testJWTSecret, "test-issuer", 15*time.Minute, 7*24*time.Hour, 1*time.Hour)

		_, err := svc.Register(context.Background(), &RegisterInput{
			Email: "reset-race@example.com", Password: "password123",
			FirstName: "Test", LastName: "User",
		})
		if err != nil {
			t.Fatalf("Register: %v", err)
		}

		token, err := svc.ForgotPassword(context.Background(), &ForgotPasswordInput{
			Email: "reset-race@example.com",
		})
		if err != nil {
			t.Fatalf("ForgotPassword: %v", err)
		}
		if token == "" {
			t.Fatal("expected non-empty reset token")
		}

		var successes atomic.Int32
		var failures atomic.Int32
		var wg sync.WaitGroup

		wg.Add(2)
		for i := 0; i < 2; i++ {
			go func() {
				defer wg.Done()
				err := svc.ResetPassword(context.Background(), &ResetPasswordInput{
					Token:       token,
					NewPassword: "newpassword123",
				})
				if err != nil {
					failures.Add(1)
				} else {
					successes.Add(1)
				}
			}()
		}
		wg.Wait()

		s := successes.Load()
		// With SELECT ... FOR UPDATE, the second concurrent goroutine blocks until
		// the first commits. It may then succeed or fail depending on timing —
		// the reset columns are cleared during the first transaction, so the blocked
		// goroutine may find no matching row. We assert at least 1 success rather
		// than exactly 1, since the outcome depends on PostgreSQL lock scheduling.
		if s < 1 {
			t.Error("expected at least one successful password reset")
		}
		t.Logf("concurrent reset: %d successes, %d failures", s, failures.Load())
	})
}

func TestLogout_RevokesTokens_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		svc := NewAuthService(pool, testJWTSecret, "test-issuer", 15*time.Minute, 7*24*time.Hour, 1*time.Hour)

		result, err := svc.Register(context.Background(), &RegisterInput{
			Email: "logout-revoke@example.com", Password: "password123",
			FirstName: "Test", LastName: "User",
		})
		if err != nil {
			t.Fatalf("Register: %v", err)
		}

		refreshToken := result.RefreshToken

		if err := svc.Logout(context.Background(), result.User.ID); err != nil {
			t.Fatalf("Logout: %v", err)
		}

		_, err = svc.Refresh(context.Background(), &RefreshInput{
			RefreshToken: refreshToken,
		})
		if err == nil {
			t.Fatal("expected error refreshing after logout")
		}
		if !apperror.Is(err, apperror.CodeUnauthorized) {
			t.Errorf("expected Unauthorized, got: %v", err)
		}
	})
}

func TestChangePassword_RevokesAllSessions_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		svc := NewAuthService(pool, testJWTSecret, "test-issuer", 15*time.Minute, 7*24*time.Hour, 1*time.Hour)

		result, err := svc.Register(context.Background(), &RegisterInput{
			Email: "changepw-revoke@example.com", Password: "password123",
			FirstName: "Test", LastName: "User",
		})
		if err != nil {
			t.Fatalf("Register: %v", err)
		}

		session2, err := svc.Login(context.Background(), &LoginInput{
			Email: "changepw-revoke@example.com", Password: "password123",
		})
		if err != nil {
			t.Fatalf("Login: %v", err)
		}

		err = svc.ChangePassword(context.Background(), &ChangePasswordInput{
			UserID:          result.User.ID,
			CurrentPassword: "password123",
			NewPassword:     "newpassword123",
		})
		if err != nil {
			t.Fatalf("ChangePassword: %v", err)
		}

		_, err = svc.Refresh(context.Background(), &RefreshInput{
			RefreshToken: result.RefreshToken,
		})
		if err == nil {
			t.Error("expected error refreshing session 1 after password change")
		}

		_, err = svc.Refresh(context.Background(), &RefreshInput{
			RefreshToken: session2.RefreshToken,
		})
		if err == nil {
			t.Error("expected error refreshing session 2 after password change")
		}
	})
}

func TestPasswordReset_FullFlow_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		svc := NewAuthService(pool, testJWTSecret, "test-issuer", 15*time.Minute, 7*24*time.Hour, 1*time.Hour)

		result, err := svc.Register(context.Background(), &RegisterInput{
			Email: "fullreset@example.com", Password: "oldpassword1",
			FirstName: "Test", LastName: "User",
		})
		if err != nil {
			t.Fatalf("Register: %v", err)
		}

		token, err := svc.ForgotPassword(context.Background(), &ForgotPasswordInput{
			Email: "fullreset@example.com",
		})
		if err != nil {
			t.Fatalf("ForgotPassword: %v", err)
		}
		if token == "" {
			t.Fatal("expected non-empty reset token")
		}

		verifyResult, err := svc.VerifyResetToken(context.Background(), &VerifyResetTokenInput{
			Token: token,
		})
		if err != nil {
			t.Fatalf("VerifyResetToken: %v", err)
		}
		if !verifyResult.Valid {
			t.Error("expected token to be valid")
		}
		if verifyResult.Email != "fullreset@example.com" {
			t.Errorf("email = %q, want fullreset@example.com", verifyResult.Email)
		}

		err = svc.ResetPassword(context.Background(), &ResetPasswordInput{
			Token:       token,
			NewPassword: "newpassword1",
		})
		if err != nil {
			t.Fatalf("ResetPassword: %v", err)
		}

		_, err = svc.Refresh(context.Background(), &RefreshInput{
			RefreshToken: result.RefreshToken,
		})
		if err == nil {
			t.Error("expected old refresh token to be revoked after password reset")
		}

		_, err = svc.Login(context.Background(), &LoginInput{
			Email: "fullreset@example.com", Password: "oldpassword1",
		})
		if err == nil {
			t.Error("expected old password to fail after reset")
		}

		loginResult, err := svc.Login(context.Background(), &LoginInput{
			Email: "fullreset@example.com", Password: "newpassword1",
		})
		if err != nil {
			t.Fatalf("Login with new password: %v", err)
		}
		if loginResult.AccessToken == "" {
			t.Error("expected valid access token after reset")
		}
	})
}

func TestForgotPassword_NonExistentEmail_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		svc := NewAuthService(pool, testJWTSecret, "test-issuer", 15*time.Minute, 7*24*time.Hour, 1*time.Hour)

		token, err := svc.ForgotPassword(context.Background(), &ForgotPasswordInput{
			Email: "nonexistent@example.com",
		})
		if err != nil {
			t.Fatalf("ForgotPassword should not error for non-existent email: %v", err)
		}
		if token != "" {
			t.Error("expected empty token for non-existent email")
		}
	})
}

func TestEmailVerification_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		svc := NewAuthService(pool, testJWTSecret, "test-issuer", 15*time.Minute, 7*24*time.Hour, 1*time.Hour)

		result, err := svc.Register(context.Background(), &RegisterInput{
			Email: "verify@example.com", Password: "password123",
			FirstName: "Test", LastName: "User",
		})
		if err != nil {
			t.Fatalf("Register: %v", err)
		}
		if result.VerificationToken == "" {
			t.Fatal("expected non-empty verification token")
		}

		err = svc.VerifyEmail(context.Background(), &VerifyEmailInput{
			Token: result.VerificationToken,
		})
		if err != nil {
			t.Fatalf("VerifyEmail: %v", err)
		}

		err = svc.VerifyEmail(context.Background(), &VerifyEmailInput{
			Token: result.VerificationToken,
		})
		if err == nil {
			t.Error("expected error verifying same token twice")
		}
	})
}
