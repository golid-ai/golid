package handler

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/service"
)

// UserHandler handles user endpoints.
type UserHandler struct {
	userService userServicer
}

// NewUserHandler creates a new user handler.
func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

// Me handles GET /api/v1/me
func (h *UserHandler) Me(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	user, err := h.userService.GetByID(c.Request().Context(), userID)
	if err != nil {
		return err
	}

	data, err := json.Marshal(user)
	if err != nil {
		return apperror.Internal(fmt.Errorf("marshal user: %w", err))
	}

	etag := fmt.Sprintf(`"%x"`, sha256.Sum256(data))
	if match := c.Request().Header.Get("If-None-Match"); match == etag {
		return c.NoContent(http.StatusNotModified)
	}

	c.Response().Header().Set("ETag", etag)
	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().WriteHeader(http.StatusOK)
	_, err = c.Response().Write(data)
	return err
}

// UpdateProfileRequest is the request body for profile updates.
type UpdateProfileRequest struct {
	FirstName string  `json:"first_name,omitempty"`
	LastName  string  `json:"last_name,omitempty"`
	AvatarURL *string `json:"avatar_url"`
}

// UpdateProfile handles PUT /api/v1/me
func (h *UserHandler) UpdateProfile(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	var req UpdateProfileRequest
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if err := validateProfileUpdate(&req); err != nil {
		return err
	}

	user, err := h.userService.UpdateProfile(c.Request().Context(), userID, &service.ProfileUpdate{
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		AvatarURL:    derefStr(req.AvatarURL),
		AvatarURLSet: req.AvatarURL != nil,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, user)
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// validateProfileUpdate checks profile fields for reasonable formats and lengths.
func validateProfileUpdate(req *UpdateProfileRequest) error {
	details := make(map[string]string)

	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)

	if len(req.FirstName) > 100 {
		details["first_name"] = "First name must be 100 characters or fewer"
	}
	if len(req.LastName) > 100 {
		details["last_name"] = "Last name must be 100 characters or fewer"
	}

	if len(details) > 0 {
		return apperror.Validation("Validation failed", details)
	}
	return nil
}
