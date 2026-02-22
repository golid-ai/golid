// Package validate provides input validation utilities.
package validate

import (
	"regexp"
	"strconv"
	"strings"

	"github.com/google/uuid"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

// UUID validates that a string is a valid UUID.
// Returns a BadRequest error if invalid.
func UUID(id string, fieldName string) error {
	if id == "" {
		return apperror.BadRequest(fieldName + " is required")
	}
	if _, err := uuid.Parse(id); err != nil {
		return apperror.BadRequest(fieldName + " must be a valid UUID")
	}
	return nil
}

// UUIDOrNil validates a UUID only if non-empty.
// Returns nil if the string is empty (optional field).
func UUIDOrNil(id string, fieldName string) error {
	if id == "" {
		return nil
	}
	return UUID(id, fieldName)
}

// Email validates an email address format.
func Email(email string) error {
	if email == "" {
		return apperror.BadRequest("Email is required")
	}
	// Basic email regex - not exhaustive but catches obvious issues
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return apperror.BadRequest("Invalid email format")
	}
	return nil
}

// Password validates password strength.
func Password(password string) error {
	if len(password) < 8 {
		return apperror.BadRequest("Password must be at least 8 characters")
	}
	return nil
}

// Required validates that a string is not empty.
func Required(value string, fieldName string) error {
	if strings.TrimSpace(value) == "" {
		return apperror.BadRequest(fieldName + " is required")
	}
	return nil
}

// MinLength validates minimum string length.
func MinLength(value string, minLen int, fieldName string) error {
	if len(value) < minLen {
		return apperror.Validation("Validation failed", map[string]string{
			fieldName: strings.ToLower(fieldName) + " must be at least " + strconv.Itoa(minLen) + " characters",
		})
	}
	return nil
}

// EscapeLike escapes special characters for SQL LIKE patterns.
// This prevents users from injecting wildcards into search queries.
func EscapeLike(s string) string {
	// Escape the special LIKE characters: %, _, and \
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "%", "\\%")
	s = strings.ReplaceAll(s, "_", "\\_")
	return s
}

// WrapLike wraps a string with % for LIKE pattern matching.
// Also escapes special characters first.
func WrapLike(s string) string {
	return "%" + EscapeLike(s) + "%"
}
