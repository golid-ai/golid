package handler

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/logger"
	"github.com/golid-ai/golid/backend/internal/queue"
	"github.com/golid-ai/golid/backend/internal/service"
)

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	authService   authServicer
	emailService  emailServicer
	queue         queuer
	retryAttempts int
	retryDelay    time.Duration
}

// NewAuthHandler creates a new auth handler.
func NewAuthHandler(authService *service.AuthService, emailService *service.EmailService, q queuer, retryAttempts int, retryDelay time.Duration) *AuthHandler {
	return &AuthHandler{authService: authService, emailService: emailService, queue: q, retryAttempts: retryAttempts, retryDelay: retryDelay}
}

// RegisterRequest is the request body for registration.
type RegisterRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// Register handles POST /api/v1/auth/register
func (h *AuthHandler) Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if req.Email == "" || req.Password == "" {
		return apperror.Validation("Validation failed", map[string]string{
			"email":    "Email is required",
			"password": "Password is required",
		})
	}

	result, err := h.authService.Register(c.Request().Context(), &service.RegisterInput{
		Email:     req.Email,
		Password:  req.Password,
		FirstName: req.FirstName,
		LastName:  req.LastName,
	})
	if err != nil {
		return err
	}

	// Send verification email (best-effort, don't fail registration)
	if result.VerificationToken != "" && h.emailService.IsConfigured() {
		requestID := c.Response().Header().Get(echo.HeaderXRequestID)
		email, token := req.Email, result.VerificationToken
		if h.queue.IsConfigured() {
			task, err := queue.NewSendVerificationEmail(email, token)
			if err != nil {
				logger.Error("failed to create verification email task",
					slog.String("request_id", requestID),
					slog.String("error", err.Error()),
				)
			} else if err := h.queue.Enqueue(task); err != nil {
				logger.Error("failed to enqueue verification email",
					slog.String("request_id", requestID),
					slog.String("email", email),
					slog.String("error", err.Error()),
				)
			}
		} else {
			go func() {
			if err := service.Retry(h.retryAttempts, h.retryDelay, func() error {
				return h.emailService.SendVerificationEmail(email, token)
			}); err != nil {
					logger.Error("failed to send verification email after retries",
						slog.String("request_id", requestID),
						slog.String("email", email),
						slog.String("error", err.Error()),
					)
				}
			}()
		}
	}

	return c.JSON(http.StatusCreated, result)
}

// LoginRequest is the request body for login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Login handles POST /api/v1/auth/login
func (h *AuthHandler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if req.Email == "" || req.Password == "" {
		return apperror.BadRequest("Email and password are required")
	}

	result, err := h.authService.Login(c.Request().Context(), &service.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, result)
}

// RefreshRequest is the request body for token refresh.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Refresh handles POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(c echo.Context) error {
	var req RefreshRequest
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if req.RefreshToken == "" {
		return apperror.BadRequest("Refresh token is required")
	}

	result, err := h.authService.Refresh(c.Request().Context(), &service.RefreshInput{
		RefreshToken: req.RefreshToken,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, result)
}

// Logout handles POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	if err := h.authService.Logout(c.Request().Context(), userID); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Logged out successfully.",
	})
}

// ChangePasswordRequest is the request body for changing password (authenticated).
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// ChangePassword handles PUT /api/v1/auth/password
func (h *AuthHandler) ChangePassword(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	var req ChangePasswordRequest
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		return apperror.BadRequest("Current password and new password are required")
	}

	err = h.authService.ChangePassword(c.Request().Context(), &service.ChangePasswordInput{
		UserID:          userID,
		CurrentPassword: req.CurrentPassword,
		NewPassword:     req.NewPassword,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Password changed successfully.",
	})
}

// ForgotPasswordRequest is the request body for forgot password.
type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

// ForgotPassword handles POST /api/v1/auth/forgot-password
func (h *AuthHandler) ForgotPassword(c echo.Context) error {
	var req ForgotPasswordRequest
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if req.Email == "" {
		return apperror.Validation("Validation failed", map[string]string{
			"email": "Email is required",
		})
	}

	// Error logged but we still return 200 to prevent email enumeration
	token, err := h.authService.ForgotPassword(c.Request().Context(), &service.ForgotPasswordInput{
		Email: req.Email,
	})
	if err != nil {
		logger.Error("forgot password lookup failed", slog.String("error", err.Error()))
	}

	// Send email if token was generated (user exists)
	if token != "" && h.emailService.IsConfigured() {
		if h.queue.IsConfigured() {
			task, err := queue.NewSendPasswordReset(req.Email, token)
			if err != nil {
				logger.Error("failed to create password reset task",
					slog.String("email", req.Email),
					slog.String("error", err.Error()),
				)
			} else if err := h.queue.Enqueue(task); err != nil {
				logger.Error("failed to enqueue password reset email",
					slog.String("email", req.Email),
					slog.String("error", err.Error()),
				)
			}
		} else {
			go func() {
				if err := service.Retry(h.retryAttempts, h.retryDelay, func() error {
				return h.emailService.SendPasswordResetEmail(req.Email, token)
				}); err != nil {
					logger.Error("failed to send password reset email after retries",
						slog.String("email", req.Email),
						slog.String("error", err.Error()),
					)
				}
			}()
		}
	}

	// Always return success to prevent email enumeration
	return c.JSON(http.StatusOK, map[string]string{
		"message": "If an account exists with that email, a password reset link has been sent.",
	})
}

// VerifyResetToken handles GET /api/v1/auth/verify-reset-token?token=...
func (h *AuthHandler) VerifyResetToken(c echo.Context) error {
	token := c.QueryParam("token")
	if token == "" {
		return apperror.BadRequest("Token is required")
	}

	result, err := h.authService.VerifyResetToken(c.Request().Context(), &service.VerifyResetTokenInput{
		Token: token,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, result)
}

// ResetPasswordRequest is the request body for reset password.
type ResetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

// ResetPassword handles POST /api/v1/auth/reset-password
func (h *AuthHandler) ResetPassword(c echo.Context) error {
	var req ResetPasswordRequest
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if req.Token == "" || req.Password == "" {
		return apperror.Validation("Validation failed", map[string]string{
			"token":    "Token is required",
			"password": "Password is required",
		})
	}

	err := h.authService.ResetPassword(c.Request().Context(), &service.ResetPasswordInput{
		Token:       req.Token,
		NewPassword: req.Password,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Password has been reset successfully.",
	})
}

// VerifyEmail handles GET /api/v1/auth/verify-email?token=...
func (h *AuthHandler) VerifyEmail(c echo.Context) error {
	token := c.QueryParam("token")
	if token == "" {
		return apperror.BadRequest("Token is required")
	}

	err := h.authService.VerifyEmail(c.Request().Context(), &service.VerifyEmailInput{
		Token: token,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Email verified successfully.",
	})
}

// ResendVerificationRequest is the request body for resending verification.
type ResendVerificationRequest struct {
	Email string `json:"email"`
}

// ResendVerification handles POST /api/v1/auth/resend-verification
func (h *AuthHandler) ResendVerification(c echo.Context) error {
	var req ResendVerificationRequest
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if req.Email == "" {
		return apperror.Validation("Validation failed", map[string]string{
			"email": "Email is required",
		})
	}

	// Error logged but we still return 200 to prevent email enumeration
	token, err := h.authService.ResendVerification(c.Request().Context(), &service.ResendVerificationInput{
		Email: req.Email,
	})
	if err != nil {
		logger.Error("resend verification lookup failed", slog.String("error", err.Error()))
	}

	// Send email if token was generated (user exists and not yet verified)
	if token != "" && h.emailService.IsConfigured() {
		if h.queue.IsConfigured() {
			task, err := queue.NewSendVerificationEmail(req.Email, token)
			if err != nil {
				logger.Error("failed to create verification email task",
					slog.String("email", req.Email),
					slog.String("error", err.Error()),
				)
			} else if err := h.queue.Enqueue(task); err != nil {
				logger.Error("failed to enqueue verification email",
					slog.String("email", req.Email),
					slog.String("error", err.Error()),
				)
			}
		} else {
			go func() {
				if err := service.Retry(h.retryAttempts, h.retryDelay, func() error {
				return h.emailService.SendVerificationEmail(req.Email, token)
				}); err != nil {
					logger.Error("failed to send verification email after retries",
						slog.String("email", req.Email),
						slog.String("error", err.Error()),
					)
				}
			}()
		}
	}

	// Always return success to prevent email enumeration
	return c.JSON(http.StatusOK, map[string]string{
		"message": "If an account exists with that email, a verification link has been sent.",
	})
}
