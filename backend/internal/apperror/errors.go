package apperror

import (
	"errors"
	"fmt"
	"net/http"
)

// Code represents an application error code.
type Code string

const (
	CodeInternal       Code = "INTERNAL_ERROR"
	CodeValidation     Code = "VALIDATION_ERROR"
	CodeNotFound       Code = "NOT_FOUND"
	CodeUnauthorized   Code = "UNAUTHORIZED"
	CodeForbidden      Code = "FORBIDDEN"
	CodeConflict       Code = "CONFLICT"
	CodeRateLimited    Code = "RATE_LIMITED"
	CodeBadRequest     Code = "BAD_REQUEST"
	CodeTimeout        Code = "REQUEST_TIMEOUT"
	CodeServiceUnavail Code = "SERVICE_UNAVAILABLE"
)

// AppError is a structured application error.
type AppError struct {
	Code       Code              `json:"code"`
	Message    string            `json:"message"`
	Details    map[string]string `json:"details,omitempty"`
	HTTPStatus int               `json:"-"`
	Err        error             `json:"-"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// --- Constructors ---

// Internal creates an internal server error.
func Internal(err error) *AppError {
	return &AppError{
		Code:       CodeInternal,
		Message:    "An internal error occurred",
		HTTPStatus: http.StatusInternalServerError,
		Err:        err,
	}
}

// NotFound creates a not found error.
func NotFound(resource string) *AppError {
	return &AppError{
		Code:       CodeNotFound,
		Message:    fmt.Sprintf("%s not found", resource),
		HTTPStatus: http.StatusNotFound,
	}
}

// Validation creates a validation error with field details.
func Validation(message string, details map[string]string) *AppError {
	return &AppError{
		Code:       CodeValidation,
		Message:    message,
		Details:    details,
		HTTPStatus: http.StatusBadRequest,
	}
}

// Unauthorized creates an unauthorized error.
func Unauthorized(message string) *AppError {
	if message == "" {
		message = "Authentication required"
	}
	return &AppError{
		Code:       CodeUnauthorized,
		Message:    message,
		HTTPStatus: http.StatusUnauthorized,
	}
}

// Forbidden creates a forbidden error.
func Forbidden(message string) *AppError {
	if message == "" {
		message = "Access denied"
	}
	return &AppError{
		Code:       CodeForbidden,
		Message:    message,
		HTTPStatus: http.StatusForbidden,
	}
}

// Conflict creates a conflict error (e.g., duplicate email).
func Conflict(message string) *AppError {
	return &AppError{
		Code:       CodeConflict,
		Message:    message,
		HTTPStatus: http.StatusConflict,
	}
}

// RateLimited creates a rate limit error.
func RateLimited() *AppError {
	return &AppError{
		Code:       CodeRateLimited,
		Message:    "Too many requests, please try again later",
		HTTPStatus: http.StatusTooManyRequests,
	}
}

// RequestTimeout creates a request timeout error.
func RequestTimeout(message string) *AppError {
	return &AppError{
		Code:       CodeTimeout,
		Message:    message,
		HTTPStatus: http.StatusRequestTimeout,
	}
}

// BadRequest creates a bad request error.
func BadRequest(message string) *AppError {
	return &AppError{
		Code:       CodeBadRequest,
		Message:    message,
		HTTPStatus: http.StatusBadRequest,
	}
}

// Wrap wraps an error with context.
func Wrap(err error, message string) error {
	if err == nil {
		return nil
	}
	return fmt.Errorf("%s: %w", message, err)
}

// Is checks if an error is of a specific code.
func Is(err error, code Code) bool {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr.Code == code
	}
	return false
}

// HTTPStatus returns the appropriate HTTP status for an error.
func HTTPStatus(err error) int {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr.HTTPStatus
	}
	return http.StatusInternalServerError
}
