package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

// FeatureHandler handles feature flag endpoints.
type FeatureHandler struct {
	featureService featureServicer
}

func NewFeatureHandler(fs featureServicer) *FeatureHandler {
	return &FeatureHandler{featureService: fs}
}

// List returns all feature flags with descriptions. Admin-only.
func (h *FeatureHandler) List(c echo.Context) error {
	userType, err := requireUserType(c)
	if err != nil {
		return err
	}
	if userType != "admin" {
		return apperror.Forbidden("Admin access required")
	}
	flags, err := h.featureService.List(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, flags)
}

// ListEnabled returns a {key: bool} map. Public endpoint — no descriptions exposed.
func (h *FeatureHandler) ListEnabled(c echo.Context) error {
	flags, err := h.featureService.ListEnabled(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, flags)
}

type SetFeatureRequest struct {
	Enabled bool `json:"enabled"`
}

// Set toggles a feature flag. Admin-only.
func (h *FeatureHandler) Set(c echo.Context) error {
	userType, err := requireUserType(c)
	if err != nil {
		return err
	}
	if userType != "admin" {
		return apperror.Forbidden("Admin access required")
	}
	key := c.Param("key")
	if key == "" {
		return apperror.BadRequest("Feature flag key is required")
	}
	var req SetFeatureRequest
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}
	if err := h.featureService.Set(c.Request().Context(), key, req.Enabled); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Feature flag updated"})
}
