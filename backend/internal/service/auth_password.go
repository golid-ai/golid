package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

// ============================================================================
// CHANGE PASSWORD (authenticated)
// ============================================================================

// ChangePasswordInput is the input for an authenticated password change.
type ChangePasswordInput struct {
	UserID          string
	CurrentPassword string
	NewPassword     string
}

// ChangePassword changes a user's password after verifying their current one.
func (s *AuthService) ChangePassword(ctx context.Context, input *ChangePasswordInput) error {
	if len(input.NewPassword) < 8 {
		return apperror.Validation("Validation failed", map[string]string{
			"new_password": "Password must be at least 8 characters",
		})
	}
	if len(input.NewPassword) > 72 {
		return apperror.Validation("Validation failed", map[string]string{
			"new_password": "Password must not exceed 72 characters",
		})
	}

	var passwordHash string
	err := s.pool.QueryRow(ctx,
		"SELECT password_hash FROM users WHERE id = $1",
		input.UserID,
	).Scan(&passwordHash)

	if errors.Is(err, pgx.ErrNoRows) {
		return apperror.NotFound("User not found")
	}
	if err != nil {
		return apperror.Internal(fmt.Errorf("get user: %w", err))
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(input.CurrentPassword)); err != nil {
		return apperror.BadRequest("Current password is incorrect")
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return apperror.Internal(fmt.Errorf("hash password: %w", err))
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return apperror.Internal(fmt.Errorf("begin tx: %w", err))
	}
	defer func() { _ = tx.Rollback(ctx) }()

	_, err = tx.Exec(ctx,
		"UPDATE users SET password_hash = $2 WHERE id = $1",
		input.UserID, string(newHash),
	)
	if err != nil {
		return apperror.Internal(fmt.Errorf("update password: %w", err))
	}

	_, err = tx.Exec(ctx,
		"UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE",
		input.UserID,
	)
	if err != nil {
		return apperror.Internal(fmt.Errorf("revoke tokens: %w", err))
	}

	if err := tx.Commit(ctx); err != nil {
		return apperror.Internal(fmt.Errorf("commit tx: %w", err))
	}

	return nil
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

// ForgotPasswordInput is the input for forgot password.
type ForgotPasswordInput struct {
	Email string
}

// ForgotPassword initiates a password reset using the selector.verifier pattern.
// Returns empty token for non-existent emails to prevent enumeration.
func (s *AuthService) ForgotPassword(ctx context.Context, input *ForgotPasswordInput) (string, error) {
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))

	if input.Email == "" {
		return "", apperror.BadRequest("Email is required")
	}

	var userID uuid.UUID
	err := s.pool.QueryRow(ctx,
		"SELECT id FROM users WHERE email = $1",
		input.Email,
	).Scan(&userID)

	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", apperror.Internal(fmt.Errorf("get user: %w", err))
	}

	selector, verifier, token, err := generateResetToken()
	if err != nil {
		return "", apperror.Internal(fmt.Errorf("generate token: %w", err))
	}

	verifierHash := hashVerifier(verifier)
	expires := time.Now().Add(s.passwordResetTTL)

	_, err = s.pool.Exec(ctx,
		`UPDATE users 
		 SET password_reset_selector = $2, 
		     password_reset_verifier_hash = $3, 
		     password_reset_expires = $4
		 WHERE id = $1`,
		userID, selector, verifierHash, expires,
	)
	if err != nil {
		return "", apperror.Internal(fmt.Errorf("store reset token: %w", err))
	}

	return token, nil
}

// VerifyResetTokenInput is the input for verifying a reset token.
type VerifyResetTokenInput struct {
	Token string
}

// VerifyResetTokenResult is the result of verifying a reset token.
type VerifyResetTokenResult struct {
	Valid bool   `json:"valid"`
	Email string `json:"email"`
}

// VerifyResetToken checks if a password reset token is valid.
func (s *AuthService) VerifyResetToken(ctx context.Context, input *VerifyResetTokenInput) (*VerifyResetTokenResult, error) {
	if input.Token == "" {
		return nil, apperror.BadRequest("Token is required")
	}

	selector, verifier, err := parseResetToken(input.Token)
	if err != nil {
		return &VerifyResetTokenResult{Valid: false}, nil
	}

	var userID uuid.UUID
	var email string
	var storedHash string
	var expires time.Time

	err = s.pool.QueryRow(ctx,
		`SELECT id, email, password_reset_verifier_hash, password_reset_expires 
		 FROM users 
		 WHERE password_reset_selector = $1 
		   AND password_reset_expires > NOW()`,
		selector,
	).Scan(&userID, &email, &storedHash, &expires)

	if errors.Is(err, pgx.ErrNoRows) {
		return &VerifyResetTokenResult{Valid: false}, nil
	}
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("get user: %w", err))
	}

	if !verifyHash(verifier, storedHash) {
		return &VerifyResetTokenResult{Valid: false}, nil
	}

	return &VerifyResetTokenResult{Valid: true, Email: email}, nil
}

// ResetPasswordInput is the input for resetting password.
type ResetPasswordInput struct {
	Token       string
	NewPassword string
}

// ResetPassword resets a user's password using a valid reset token.
func (s *AuthService) ResetPassword(ctx context.Context, input *ResetPasswordInput) error {
	if input.Token == "" {
		return apperror.BadRequest("Token is required")
	}
	if len(input.NewPassword) < 8 {
		return apperror.Validation("Validation failed", map[string]string{
			"password": "Password must be at least 8 characters",
		})
	}
	if len(input.NewPassword) > 72 {
		return apperror.Validation("Validation failed", map[string]string{
			"password": "Password must not exceed 72 characters",
		})
	}

	selector, verifier, err := parseResetToken(input.Token)
	if err != nil {
		return apperror.BadRequest("Invalid reset token")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return apperror.Internal(fmt.Errorf("begin tx: %w", err))
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var userID uuid.UUID
	var storedHash string

	err = tx.QueryRow(ctx,
		`SELECT id, password_reset_verifier_hash 
		 FROM users 
		 WHERE password_reset_selector = $1 
		   AND password_reset_expires > NOW()
		 FOR UPDATE`,
		selector,
	).Scan(&userID, &storedHash)

	if errors.Is(err, pgx.ErrNoRows) {
		return apperror.BadRequest("Invalid or expired reset token")
	}
	if err != nil {
		return apperror.Internal(fmt.Errorf("get user: %w", err))
	}

	if !verifyHash(verifier, storedHash) {
		return apperror.BadRequest("Invalid reset token")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return apperror.Internal(fmt.Errorf("hash password: %w", err))
	}

	_, err = tx.Exec(ctx,
		`UPDATE users 
		 SET password_hash = $2,
		     password_reset_selector = NULL,
		     password_reset_verifier_hash = NULL,
		     password_reset_expires = NULL
		 WHERE id = $1`,
		userID, string(hash),
	)
	if err != nil {
		return apperror.Internal(fmt.Errorf("update password: %w", err))
	}

	_, err = tx.Exec(ctx, "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE", userID)
	if err != nil {
		return apperror.Internal(fmt.Errorf("revoke tokens: %w", err))
	}

	if err := tx.Commit(ctx); err != nil {
		return apperror.Internal(fmt.Errorf("commit tx: %w", err))
	}

	return nil
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

func generateResetToken() (string, string, string, error) {
	selectorBytes := make([]byte, 16)
	if _, err := rand.Read(selectorBytes); err != nil {
		return "", "", "", err
	}
	selector := base64.URLEncoding.EncodeToString(selectorBytes)

	verifierBytes := make([]byte, 32)
	if _, err := rand.Read(verifierBytes); err != nil {
		return "", "", "", err
	}
	verifier := base64.URLEncoding.EncodeToString(verifierBytes)

	token := selector + "." + verifier
	return selector, verifier, token, nil
}

func parseResetToken(token string) (string, string, error) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return "", "", fmt.Errorf("invalid token format")
	}
	return parts[0], parts[1], nil
}

func hashVerifier(verifier string) string {
	hash := sha256.Sum256([]byte(verifier))
	return hex.EncodeToString(hash[:])
}

func verifyHash(verifier, storedHash string) bool {
	hash := hashVerifier(verifier)
	return subtle.ConstantTimeCompare([]byte(hash), []byte(storedHash)) == 1
}
