package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

// UserService handles user profile operations.
type UserService struct {
	pool *pgxpool.Pool
}

// NewUserService creates a new user service.
func NewUserService(pool *pgxpool.Pool) *UserService {
	return &UserService{pool: pool}
}

// UserProfile represents a user with their full profile.
type UserProfile struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Type          string    `json:"type"`
	EmailVerified bool      `json:"email_verified"`
	FirstName     *string   `json:"first_name"`
	LastName      *string   `json:"last_name"`
	AvatarURL     *string   `json:"avatar_url"`
	CreatedAt     time.Time `json:"created_at"`
}

// GetByID retrieves a user by ID with their full profile.
func (s *UserService) GetByID(ctx context.Context, userID string) (*UserProfile, error) {
	var profile UserProfile
	err := s.pool.QueryRow(ctx,
		`SELECT id, email, type, email_verified,
		 first_name, last_name, avatar_url, created_at
		 FROM users WHERE id = $1`,
		userID,
	).Scan(&profile.ID, &profile.Email, &profile.Type, &profile.EmailVerified,
		&profile.FirstName, &profile.LastName, &profile.AvatarURL, &profile.CreatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperror.NotFound("User not found")
	}
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("get user: %w", err))
	}

	return &profile, nil
}

// ProfileUpdate holds profile update fields.
type ProfileUpdate struct {
	FirstName    string
	LastName     string
	AvatarURL    string
	AvatarURLSet bool
}

// UpdateProfile updates a user's profile.
func (s *UserService) UpdateProfile(ctx context.Context, userID string, update *ProfileUpdate) (*UserProfile, error) {
	_, err := s.pool.Exec(ctx,
		`UPDATE users SET
			first_name = COALESCE(NULLIF($2, ''), first_name),
			last_name = COALESCE(NULLIF($3, ''), last_name),
			avatar_url = CASE WHEN $4 THEN $5 ELSE avatar_url END,
			updated_at = NOW()
		 WHERE id = $1`,
		userID, update.FirstName, update.LastName,
		update.AvatarURLSet, nilIfEmpty(update.AvatarURL),
	)
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("update profile: %w", err))
	}

	return s.GetByID(ctx, userID)
}

// nilIfEmpty returns nil for empty strings, or a pointer to the string.
func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
