// Package models defines hand-written domain types for use in services and handlers.
// These types use standard Go types (*string, time.Time) and JSON tags suitable for API responses.
//
// For sqlc-generated types that match DB columns exactly (pgtype.Text, pgtype.Timestamptz),
// see internal/db/models.go. Use db types for scanning query results, domain types for
// business logic and API responses.
package models

import (
	"time"

	"github.com/google/uuid"
)

// UserType represents the type of user account.
type UserType string

const (
	UserTypeUser  UserType = "user"
	UserTypeAdmin UserType = "admin"
)

// User represents a row in the users table.
type User struct {
	ID            uuid.UUID `json:"id"`
	Email         string    `json:"email"`
	PasswordHash  string    `json:"-"`
	Type          UserType  `json:"type"`
	EmailVerified bool      `json:"email_verified"`
	FirstName     *string   `json:"first_name,omitempty"`
	LastName      *string   `json:"last_name,omitempty"`
	AvatarURL     *string   `json:"avatar_url,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// RefreshToken represents a row in the refresh_tokens table.
type RefreshToken struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	TokenHash string    `json:"-"`
	ExpiresAt time.Time `json:"expires_at"`
	Revoked   bool      `json:"revoked"`
	CreatedAt time.Time `json:"created_at"`
}
