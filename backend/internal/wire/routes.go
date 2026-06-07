package wire

import (
	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/config"
	"github.com/golid-ai/golid/backend/internal/logger"
	"github.com/golid-ai/golid/backend/internal/middleware"
)

// RegisterRoutes mounts every /api/v1 route group on the given Echo
// instance. Bootstrap concerns (/health, /ready, /metrics, OTel + metrics
// middleware setup) stay in main.go.
//
// jwtMW is the configured JWT middleware. We pass it in rather than
// constructing it here so main.go retains ownership of the JWT secret.
func RegisterRoutes(e *echo.Echo, h *Handlers, _ *Services, cfg *config.Config, jwtMW echo.MiddlewareFunc) {
	api := e.Group("/api/v1")
	api.Use(middleware.APIVersion("v1"))
	api.Use(middleware.CSRF(cfg.CSRFEnforce, logger.Logger()))
	api.Use(middleware.RateLimiter(cfg.RateLimitRequests, cfg.RateLimitWindow))

	registerPublicRoutes(api, h, cfg)

	protected := api.Group("")
	protected.Use(jwtMW)

	registerProtectedRoutes(protected, h)
	registerAdminRoutes(protected, h)
	registerSSERoutes(api, protected, h, cfg)
}

func registerPublicRoutes(api *echo.Group, h *Handlers, cfg *config.Config) {
	api.GET("/features", h.Feature.ListEnabled)

	authGroup := api.Group("/auth")
	authGroup.Use(middleware.StrictRateLimiter(cfg.AuthRateLimitRequests))
	authGroup.POST("/register", h.Auth.Register)
	authGroup.POST("/login", h.Auth.Login)
	authGroup.POST("/refresh", h.Auth.Refresh)
	authGroup.POST("/forgot-password", h.Auth.ForgotPassword)
	authGroup.GET("/verify-reset-token", h.Auth.VerifyResetToken)
	authGroup.POST("/reset-password", h.Auth.ResetPassword)
	authGroup.GET("/verify-email", h.Auth.VerifyEmail)
	authGroup.POST("/resend-verification", h.Auth.ResendVerification)
}

func registerProtectedRoutes(protected *echo.Group, h *Handlers) {
	protected.POST("/auth/logout", h.Auth.Logout)
	protected.PUT("/auth/password", h.Auth.ChangePassword)
	protected.GET("/me", h.User.Me)
	protected.PUT("/me", h.User.UpdateProfile)
}

func registerAdminRoutes(protected *echo.Group, h *Handlers) {
	admin := protected.Group("/admin")
	admin.Use(middleware.RequireRole("admin"))
	admin.GET("/features", h.Feature.List)
	admin.PUT("/features/:key", h.Feature.Set)
}

// SSE routes — stream endpoint uses ticket auth (EventSource cannot set
// headers, so JWT-in-header doesn't work). Demo endpoint is dev-only.
func registerSSERoutes(api, protected *echo.Group, h *Handlers, cfg *config.Config) {
	api.GET("/events/stream", h.SSE.Stream)
	protected.POST("/events/ticket", h.SSE.Ticket)
	if cfg.IsDevelopment() {
		protected.POST("/events/demo", h.SSE.Demo)
	}
}
