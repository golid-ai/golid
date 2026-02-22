package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

// VerifyEmailInput is the input for email verification.
type VerifyEmailInput struct {
	Token string
}

// VerifyEmail verifies a user's email address.
func (s *AuthService) VerifyEmail(ctx context.Context, input *VerifyEmailInput) error {
	if input.Token == "" {
		return apperror.BadRequest("Token is required")
	}

	selector, verifier, err := parseVerificationToken(input.Token)
	if err != nil {
		return apperror.BadRequest("Invalid verification token")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return apperror.Internal(fmt.Errorf("begin tx: %w", err))
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var userID uuid.UUID
	var storedHash string
	err = tx.QueryRow(ctx,
		`SELECT id, verification_verifier_hash FROM users
		 WHERE verification_selector = $1 AND email_verified = FALSE
		 FOR UPDATE`,
		selector,
	).Scan(&userID, &storedHash)

	if errors.Is(err, pgx.ErrNoRows) {
		return apperror.BadRequest("Invalid or already-used verification token")
	}
	if err != nil {
		return apperror.Internal(fmt.Errorf("verify email: %w", err))
	}

	if !verifyHash(verifier, storedHash) {
		return apperror.BadRequest("Invalid verification token")
	}

	_, err = tx.Exec(ctx,
		`UPDATE users SET email_verified = TRUE, verification_selector = NULL, verification_verifier_hash = NULL
		 WHERE id = $1`,
		userID,
	)
	if err != nil {
		return apperror.Internal(fmt.Errorf("update verification: %w", err))
	}

	if err := tx.Commit(ctx); err != nil {
		return apperror.Internal(fmt.Errorf("commit tx: %w", err))
	}

	return nil
}

// ResendVerificationInput is the input for resending verification email.
type ResendVerificationInput struct {
	Email string
}

// ResendVerification generates a new verification token.
func (s *AuthService) ResendVerification(ctx context.Context, input *ResendVerificationInput) (string, error) {
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))

	if input.Email == "" {
		return "", apperror.BadRequest("Email is required")
	}

	var userID uuid.UUID
	var emailVerified bool
	err := s.pool.QueryRow(ctx,
		"SELECT id, email_verified FROM users WHERE email = $1",
		input.Email,
	).Scan(&userID, &emailVerified)

	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", apperror.Internal(fmt.Errorf("get user: %w", err))
	}

	if emailVerified {
		return "", nil
	}

	selector, verifier, token, err := generateVerificationToken()
	if err != nil {
		return "", apperror.Internal(fmt.Errorf("generate token: %w", err))
	}

	verifierHash := hashVerifier(verifier)
	_, err = s.pool.Exec(ctx,
		"UPDATE users SET verification_selector = $2, verification_verifier_hash = $3 WHERE id = $1",
		userID, selector, verifierHash,
	)
	if err != nil {
		return "", apperror.Internal(fmt.Errorf("update token: %w", err))
	}

	return token, nil
}

// GenerateVerificationToken creates a new verification token for a user.
func (s *AuthService) GenerateVerificationToken() (string, string, string, error) {
	return generateVerificationToken()
}

func generateVerificationToken() (string, string, string, error) {
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

func parseVerificationToken(token string) (string, string, error) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return "", "", fmt.Errorf("invalid token format")
	}
	return parts[0], parts[1], nil
}
