package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/middleware"
)

type dbExecer interface {
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
}

// AuthService handles authentication: registration, login, JWT tokens,
// password reset (selector.verifier pattern), and email verification.
type AuthService struct {
	pool             *pgxpool.Pool
	jwtSecret        string
	jwtIssuer        string
	accessDuration   time.Duration
	refreshDuration  time.Duration
	passwordResetTTL time.Duration
}

// NewAuthService creates a new auth service.
func NewAuthService(pool *pgxpool.Pool, jwtSecret, jwtIssuer string, accessDuration, refreshDuration, passwordResetTTL time.Duration) *AuthService {
	return &AuthService{
		pool:             pool,
		jwtSecret:        jwtSecret,
		jwtIssuer:        jwtIssuer,
		accessDuration:   accessDuration,
		refreshDuration:  refreshDuration,
		passwordResetTTL: passwordResetTTL,
	}
}

// CleanupExpiredTokens deletes expired and revoked refresh tokens from the database.
// Called periodically to prevent unbounded table growth.
func (s *AuthService) CleanupExpiredTokens(ctx context.Context) error {
	_, err := s.pool.Exec(ctx,
		"DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE")
	return err
}

// RegisterInput is the input for user registration.
type RegisterInput struct {
	Email     string
	Password  string
	FirstName string
	LastName  string
}

// AuthResult is returned after successful authentication.
type AuthResult struct {
	AccessToken       string `json:"access_token"`
	RefreshToken      string `json:"refresh_token"`
	ExpiresIn         int    `json:"expires_in"`
	User              *User  `json:"user"`
	VerificationToken string `json:"-"`
}

// User represents a user for auth responses.
type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"created_at"`
}

// Register creates a new user account.
func (s *AuthService) Register(ctx context.Context, input *RegisterInput) (*AuthResult, error) {
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))

	if err := validateRegisterInput(input); err != nil {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("hash password: %w", err))
	}

	selector, verifier, verificationToken, err := generateVerificationToken()
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("generate verification token: %w", err))
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("begin transaction: %w", err))
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var userID uuid.UUID
	var createdAt time.Time
	verifierHash := hashVerifier(verifier)
	err = tx.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, type, first_name, last_name, verification_selector, verification_verifier_hash)
		 VALUES ($1, $2, 'user', $3, $4, $5, $6)
		 RETURNING id, created_at`,
		input.Email, string(hash), input.FirstName, input.LastName, selector, verifierHash,
	).Scan(&userID, &createdAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, apperror.Conflict("Email already registered")
		}
		return nil, apperror.Internal(fmt.Errorf("create user: %w", err))
	}

	result, err := s.generateAuthResult(ctx, tx, userID.String(), input.Email, "user", createdAt)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperror.Internal(fmt.Errorf("commit transaction: %w", err))
	}

	result.VerificationToken = verificationToken
	return result, nil
}

// LoginInput is the input for login.
type LoginInput struct {
	Email    string
	Password string
}

// Login authenticates a user.
func (s *AuthService) Login(ctx context.Context, input *LoginInput) (*AuthResult, error) {
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))

	var userID uuid.UUID
	var passwordHash string
	var userType string
	var createdAt time.Time

	err := s.pool.QueryRow(ctx,
		"SELECT id, password_hash, type, created_at FROM users WHERE email = $1",
		input.Email,
	).Scan(&userID, &passwordHash, &userType, &createdAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperror.Unauthorized("Invalid email or password")
	}
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("get user: %w", err))
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(input.Password)); err != nil {
		return nil, apperror.Unauthorized("Invalid email or password")
	}

	return s.generateAuthResult(ctx, s.pool, userID.String(), input.Email, userType, createdAt)
}

// Logout revokes all refresh tokens for a user.
func (s *AuthService) Logout(ctx context.Context, userID string) error {
	_, err := s.pool.Exec(ctx,
		"UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE",
		userID,
	)
	if err != nil {
		return apperror.Internal(fmt.Errorf("revoke tokens: %w", err))
	}
	return nil
}

// RefreshInput is the input for token refresh.
type RefreshInput struct {
	RefreshToken string
}

// Refresh generates new tokens from a refresh token.
// Uses UPDATE ... RETURNING inside a transaction to atomically revoke the old
// token and verify it in one step, preventing TOCTOU races on concurrent refresh.
func (s *AuthService) Refresh(ctx context.Context, input *RefreshInput) (*AuthResult, error) {
	claims, err := middleware.ParseToken(s.jwtSecret, input.RefreshToken)
	if err != nil {
		return nil, apperror.Unauthorized("Invalid refresh token")
	}

	tokenHash := hashVerifier(input.RefreshToken)

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("begin tx: %w", err))
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var storedUserID string
	err = tx.QueryRow(ctx,
		`UPDATE refresh_tokens SET revoked = TRUE
		 WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()
		 RETURNING user_id::text`,
		tokenHash,
	).Scan(&storedUserID)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperror.Unauthorized("Refresh token revoked or expired")
	}
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("revoke refresh token: %w", err))
	}

	var email string
	var userType string
	var createdAt time.Time

	err = tx.QueryRow(ctx,
		"SELECT email, type, created_at FROM users WHERE id = $1",
		claims.Subject,
	).Scan(&email, &userType, &createdAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperror.Unauthorized("User not found")
	}
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("get user: %w", err))
	}

	result, err := s.generateAuthResult(ctx, tx, claims.Subject, email, userType, createdAt)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperror.Internal(fmt.Errorf("commit refresh: %w", err))
	}

	return result, nil
}

// generateAuthResult creates tokens and stores the refresh token.
func (s *AuthService) generateAuthResult(ctx context.Context, db dbExecer, userID, email, userType string, createdAt time.Time) (*AuthResult, error) {
	accessToken, err := middleware.GenerateToken(s.jwtSecret, userID, userType, s.jwtIssuer, s.accessDuration)
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("generate access token: %w", err))
	}

	refreshToken, err := middleware.GenerateRefreshToken(s.jwtSecret, userID, s.jwtIssuer, s.refreshDuration)
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("generate refresh token: %w", err))
	}

	tokenHash := hashVerifier(refreshToken)
	expiresAt := time.Now().Add(s.refreshDuration)
	_, err = db.Exec(ctx,
		"INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
		userID, tokenHash, expiresAt,
	)
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("store refresh token: %w", err))
	}

	return &AuthResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int(s.accessDuration.Seconds()),
		User: &User{
			ID:        userID,
			Email:     email,
			Type:      userType,
			CreatedAt: createdAt,
		},
	}, nil
}

// validateRegisterInput validates registration input.
func validateRegisterInput(input *RegisterInput) error {
	details := make(map[string]string)

	if input.Email == "" {
		details["email"] = "Email is required"
	} else if !strings.Contains(input.Email, "@") || !strings.Contains(input.Email[strings.LastIndex(input.Email, "@"):], ".") {
		details["email"] = "Invalid email format"
	}
	if len(input.Password) < 8 {
		details["password"] = "Password must be at least 8 characters"
	} else if len(input.Password) > 72 {
		details["password"] = "Password must not exceed 72 characters"
	}
	if input.FirstName == "" {
		details["first_name"] = "First name is required"
	}
	if input.LastName == "" {
		details["last_name"] = "Last name is required"
	}

	if len(details) > 0 {
		return apperror.Validation("Validation failed", details)
	}
	return nil
}
