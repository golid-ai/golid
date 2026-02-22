package handler

import (
	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

// contextString safely extracts a string value from the echo context.
func contextString(c echo.Context, key string) (string, bool) {
	v := c.Get(key)
	if v == nil {
		return "", false
	}
	s, ok := v.(string)
	return s, ok
}

// requireUserID extracts "user_id" from context or returns an HTTP 401 error.
func requireUserID(c echo.Context) (string, error) {
	id, ok := contextString(c, "user_id")
	if !ok || id == "" {
		return "", apperror.Unauthorized("missing user identity")
	}
	return id, nil
}

// requireUserType extracts "user_type" from context or returns an HTTP 401 error.
func requireUserType(c echo.Context) (string, error) {
	t, ok := contextString(c, "user_type")
	if !ok || t == "" {
		return "", apperror.Unauthorized("missing user type")
	}
	return t, nil
}
