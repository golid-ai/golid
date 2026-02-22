package apperror_test

import (
	"errors"
	"net/http"
	"testing"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

func TestNotFound(t *testing.T) {
	err := apperror.NotFound("User")

	if err.Code != apperror.CodeNotFound {
		t.Errorf("expected code %s, got %s", apperror.CodeNotFound, err.Code)
	}

	if err.HTTPStatus != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, err.HTTPStatus)
	}

	if err.Message != "User not found" {
		t.Errorf("unexpected message: %s", err.Message)
	}
}

func TestValidation(t *testing.T) {
	details := map[string]string{
		"email":    "invalid email format",
		"password": "must be at least 8 characters",
	}
	err := apperror.Validation("Validation failed", details)

	if err.Code != apperror.CodeValidation {
		t.Errorf("expected code %s, got %s", apperror.CodeValidation, err.Code)
	}

	if len(err.Details) != 2 {
		t.Errorf("expected 2 details, got %d", len(err.Details))
	}
}

func TestInternal(t *testing.T) {
	originalErr := errors.New("database connection failed")
	err := apperror.Internal(originalErr)

	if err.Code != apperror.CodeInternal {
		t.Errorf("expected code %s, got %s", apperror.CodeInternal, err.Code)
	}

	// Should wrap the original error
	if !errors.Is(err, originalErr) {
		t.Error("expected error to wrap original")
	}
}

func TestWrap(t *testing.T) {
	original := errors.New("original error")
	wrapped := apperror.Wrap(original, "context")

	if wrapped == nil {
		t.Fatal("expected non-nil error")
	}

	if !errors.Is(wrapped, original) {
		t.Error("expected wrapped error to contain original")
	}
}

func TestWrapNil(t *testing.T) {
	wrapped := apperror.Wrap(nil, "context")

	if wrapped != nil {
		t.Error("expected nil when wrapping nil")
	}
}

func TestIs(t *testing.T) {
	err := apperror.NotFound("User")

	if !apperror.Is(err, apperror.CodeNotFound) {
		t.Error("expected Is to return true for matching code")
	}

	if apperror.Is(err, apperror.CodeInternal) {
		t.Error("expected Is to return false for non-matching code")
	}
}

func TestError_WithWrappedError(t *testing.T) {
	originalErr := errors.New("db connection failed")
	err := apperror.Internal(originalErr)
	str := err.Error()
	if str == "" {
		t.Error("Error() should return non-empty string")
	}
	if !errors.Is(err, originalErr) {
		t.Error("should unwrap to original error")
	}
}

func TestError_WithoutWrappedError(t *testing.T) {
	err := apperror.BadRequest("email is required")
	str := err.Error()
	if str == "" {
		t.Error("Error() should return non-empty string")
	}
	if err.Err != nil {
		t.Error("BadRequest should not have wrapped error")
	}
}

func TestIs_NonAppError(t *testing.T) {
	err := errors.New("regular error")
	if apperror.Is(err, apperror.CodeNotFound) {
		t.Error("Is() should return false for non-AppError")
	}
}

func TestIs_NilError(t *testing.T) {
	if apperror.Is(nil, apperror.CodeNotFound) {
		t.Error("Is() should return false for nil error")
	}
}

func TestHTTPStatus(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		expected int
	}{
		{"NotFound", apperror.NotFound("X"), http.StatusNotFound},
		{"Unauthorized", apperror.Unauthorized(""), http.StatusUnauthorized},
		{"Forbidden", apperror.Forbidden(""), http.StatusForbidden},
		{"RateLimited", apperror.RateLimited(), http.StatusTooManyRequests},
		{"Unknown", errors.New("unknown"), http.StatusInternalServerError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			status := apperror.HTTPStatus(tt.err)
			if status != tt.expected {
				t.Errorf("expected %d, got %d", tt.expected, status)
			}
		})
	}
}
