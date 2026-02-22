package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/hibiken/asynq"
	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/service"
)

// =============================================================================
// MOCK AUTH SERVICE
// =============================================================================

type mockAuthService struct {
	registerFn           func(ctx context.Context, input *service.RegisterInput) (*service.AuthResult, error)
	loginFn              func(ctx context.Context, input *service.LoginInput) (*service.AuthResult, error)
	changePasswordFn     func(ctx context.Context, input *service.ChangePasswordInput) error
	logoutFn             func(ctx context.Context, userID string) error
	refreshFn            func(ctx context.Context, input *service.RefreshInput) (*service.AuthResult, error)
	forgotPasswordFn     func(ctx context.Context, input *service.ForgotPasswordInput) (string, error)
	verifyResetTokenFn   func(ctx context.Context, input *service.VerifyResetTokenInput) (*service.VerifyResetTokenResult, error)
	resetPasswordFn      func(ctx context.Context, input *service.ResetPasswordInput) error
	verifyEmailFn        func(ctx context.Context, input *service.VerifyEmailInput) error
	resendVerificationFn func(ctx context.Context, input *service.ResendVerificationInput) (string, error)
}

func (m *mockAuthService) Register(ctx context.Context, input *service.RegisterInput) (*service.AuthResult, error) {
	return m.registerFn(ctx, input)
}
func (m *mockAuthService) Login(ctx context.Context, input *service.LoginInput) (*service.AuthResult, error) {
	return m.loginFn(ctx, input)
}
func (m *mockAuthService) ChangePassword(ctx context.Context, input *service.ChangePasswordInput) error {
	return m.changePasswordFn(ctx, input)
}
func (m *mockAuthService) Logout(ctx context.Context, userID string) error {
	if m.logoutFn != nil {
		return m.logoutFn(ctx, userID)
	}
	return nil
}
func (m *mockAuthService) Refresh(ctx context.Context, input *service.RefreshInput) (*service.AuthResult, error) {
	if m.refreshFn != nil {
		return m.refreshFn(ctx, input)
	}
	panic("unexpected Refresh")
}
func (m *mockAuthService) ForgotPassword(ctx context.Context, input *service.ForgotPasswordInput) (string, error) {
	if m.forgotPasswordFn != nil {
		return m.forgotPasswordFn(ctx, input)
	}
	panic("unexpected ForgotPassword")
}
func (m *mockAuthService) VerifyResetToken(ctx context.Context, input *service.VerifyResetTokenInput) (*service.VerifyResetTokenResult, error) {
	if m.verifyResetTokenFn != nil {
		return m.verifyResetTokenFn(ctx, input)
	}
	panic("unexpected VerifyResetToken")
}
func (m *mockAuthService) ResetPassword(ctx context.Context, input *service.ResetPasswordInput) error {
	if m.resetPasswordFn != nil {
		return m.resetPasswordFn(ctx, input)
	}
	panic("unexpected ResetPassword")
}
func (m *mockAuthService) VerifyEmail(ctx context.Context, input *service.VerifyEmailInput) error {
	if m.verifyEmailFn != nil {
		return m.verifyEmailFn(ctx, input)
	}
	panic("unexpected VerifyEmail")
}
func (m *mockAuthService) ResendVerification(ctx context.Context, input *service.ResendVerificationInput) (string, error) {
	if m.resendVerificationFn != nil {
		return m.resendVerificationFn(ctx, input)
	}
	panic("unexpected ResendVerification")
}

// =============================================================================
// MOCK EMAIL SERVICE
// =============================================================================

type mockEmailService struct {
	configured             bool
	sendVerificationCalled atomic.Bool
	sendResetCalled        atomic.Bool
}

func (m *mockEmailService) IsConfigured() bool { return m.configured }
func (m *mockEmailService) SendVerificationEmail(toEmail, token string) error {
	m.sendVerificationCalled.Store(true)
	return nil
}
func (m *mockEmailService) SendPasswordResetEmail(toEmail, token string) error {
	m.sendResetCalled.Store(true)
	return nil
}

// =============================================================================
// MOCK QUEUE
// =============================================================================

type mockQueue struct {
	configured    bool
	enqueuedTasks []string
}

func (m *mockQueue) IsConfigured() bool { return m.configured }
func (m *mockQueue) Enqueue(task *asynq.Task, opts ...asynq.Option) error {
	m.enqueuedTasks = append(m.enqueuedTasks, task.Type())
	return nil
}

// =============================================================================
// HELPERS
// =============================================================================

func testAuthResult() *service.AuthResult {
	return &service.AuthResult{
		AccessToken:  "test-access-token",
		RefreshToken: "test-refresh-token",
		ExpiresIn:    900,
		User: &service.User{
			ID:        "test-user-id",
			Email:     "test@example.com",
			Type:      "user",
			CreatedAt: time.Now(),
		},
	}
}

func TestRegister_InvalidJSON(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader("not json"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := &AuthHandler{authService: nil, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	err := h.Register(c)

	if err == nil {
		t.Error("Register() expected error for invalid JSON")
	}
}

func TestRegister_EmptyBody(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader("{}"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	var reqBody RegisterRequest
	if err := c.Bind(&reqBody); err != nil {
		t.Fatalf("Bind failed on empty body: %v", err)
	}
	if reqBody.Email != "" {
		t.Error("expected empty email from empty body")
	}
	if reqBody.FirstName != "" {
		t.Error("expected empty first_name from empty body")
	}
}

func TestLogin_MissingFields(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		wantErr bool
	}{
		{"empty body", `{}`, true},
		{"missing email", `{"password":"password123"}`, true},
		{"missing password", `{"email":"test@example.com"}`, true},
		{"empty email", `{"email":"","password":"password123"}`, true},
		{"empty password", `{"email":"test@example.com","password":""}`, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(tt.body))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			h := &AuthHandler{authService: nil, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

			err := h.Login(c)

			if (err != nil) != tt.wantErr {
				t.Errorf("Login() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestLogin_InvalidJSON(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader("not json"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := &AuthHandler{authService: nil, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	err := h.Login(c)
	if err == nil {
		t.Error("Login() expected error for invalid JSON")
	}
}

func TestRefresh_MissingToken(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", strings.NewReader(`{}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := &AuthHandler{authService: nil, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	err := h.Refresh(c)
	if err == nil {
		t.Error("Refresh() expected error for missing token")
	}
}

func TestRefresh_EmptyToken(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", strings.NewReader(`{"refresh_token":""}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := &AuthHandler{authService: nil, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	err := h.Refresh(c)
	if err == nil {
		t.Error("Refresh() expected error for empty token")
	}
}

func TestRefresh_InvalidJSON(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", strings.NewReader("invalid"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := &AuthHandler{authService: nil, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	err := h.Refresh(c)
	if err == nil {
		t.Error("Refresh() expected error for invalid JSON")
	}
}

func TestRegisterRequest_Binding(t *testing.T) {
	jsonBody := `{"email":"test@example.com","password":"password123","first_name":"John","last_name":"Doe"}`

	var req RegisterRequest
	if err := json.Unmarshal([]byte(jsonBody), &req); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if req.Email != "test@example.com" {
		t.Errorf("Email = %v, want test@example.com", req.Email)
	}
	if req.FirstName != "John" {
		t.Errorf("FirstName = %v, want John", req.FirstName)
	}
	if req.LastName != "Doe" {
		t.Errorf("LastName = %v, want Doe", req.LastName)
	}
}

func TestLoginRequest_Binding(t *testing.T) {
	jsonBody := `{"email":"test@example.com","password":"password123"}`

	var req LoginRequest
	if err := json.Unmarshal([]byte(jsonBody), &req); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if req.Email != "test@example.com" {
		t.Errorf("Email = %v, want test@example.com", req.Email)
	}
	if req.Password != "password123" {
		t.Errorf("Password = %v, want password123", req.Password)
	}
}

func TestRefreshRequest_Binding(t *testing.T) {
	jsonBody := `{"refresh_token":"some-token-value"}`

	var req RefreshRequest
	if err := json.Unmarshal([]byte(jsonBody), &req); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if req.RefreshToken != "some-token-value" {
		t.Errorf("RefreshToken = %v, want some-token-value", req.RefreshToken)
	}
}

// =============================================================================
// MOCK-BASED HANDLER TESTS
// =============================================================================

func TestRegister_Success(t *testing.T) {
	mock := &mockAuthService{
		registerFn: func(ctx context.Context, input *service.RegisterInput) (*service.AuthResult, error) {
			return testAuthResult(), nil
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"new@example.com","password":"password123","first_name":"Jane","last_name":"Doe"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.Register(c); err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	if rec.Code != http.StatusCreated {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusCreated)
	}

	var result map[string]interface{}
	_ = json.Unmarshal(rec.Body.Bytes(), &result)
	if result["access_token"] == nil {
		t.Error("response missing access_token")
	}
}

func TestRegister_EnqueuesWhenQueueConfigured(t *testing.T) {
	result := testAuthResult()
	result.VerificationToken = "verify-token-123"
	mock := &mockAuthService{
		registerFn: func(ctx context.Context, input *service.RegisterInput) (*service.AuthResult, error) {
			return result, nil
		},
	}
	q := &mockQueue{configured: true}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{configured: true}, queue: q, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"new@example.com","password":"password123","first_name":"Jane","last_name":"Doe"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.Register(c); err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	if len(q.enqueuedTasks) != 1 {
		t.Fatalf("expected 1 enqueued task, got %d", len(q.enqueuedTasks))
	}
	if q.enqueuedTasks[0] != "email:verification" {
		t.Errorf("expected task type email:verification, got %s", q.enqueuedTasks[0])
	}
}

func TestRegister_Conflict(t *testing.T) {
	mock := &mockAuthService{
		registerFn: func(ctx context.Context, input *service.RegisterInput) (*service.AuthResult, error) {
			return nil, apperror.Conflict("Email already registered")
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"existing@example.com","password":"password123","first_name":"Jane","last_name":"Doe"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.Register(c)
	if err == nil {
		t.Fatal("Register() expected error for duplicate email")
	}

	var appErr *apperror.AppError
	if !errors.As(err, &appErr) {
		t.Fatalf("expected AppError, got %T", err)
	}
	if appErr.HTTPStatus != http.StatusConflict {
		t.Errorf("HTTPStatus = %d, want %d", appErr.HTTPStatus, http.StatusConflict)
	}
}

func TestLogin_Success(t *testing.T) {
	mock := &mockAuthService{
		loginFn: func(ctx context.Context, input *service.LoginInput) (*service.AuthResult, error) {
			return testAuthResult(), nil
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"test@example.com","password":"password123"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.Login(c); err != nil {
		t.Fatalf("Login() error = %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestLogin_Unauthorized(t *testing.T) {
	mock := &mockAuthService{
		loginFn: func(ctx context.Context, input *service.LoginInput) (*service.AuthResult, error) {
			return nil, apperror.Unauthorized("Invalid email or password")
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"test@example.com","password":"wrongpassword"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.Login(c)
	if err == nil {
		t.Fatal("Login() expected error for wrong password")
	}

	var appErr *apperror.AppError
	if !errors.As(err, &appErr) {
		t.Fatalf("expected AppError, got %T", err)
	}
	if appErr.HTTPStatus != http.StatusUnauthorized {
		t.Errorf("HTTPStatus = %d, want %d", appErr.HTTPStatus, http.StatusUnauthorized)
	}
}

func TestChangePassword_Success(t *testing.T) {
	mock := &mockAuthService{
		changePasswordFn: func(ctx context.Context, input *service.ChangePasswordInput) error {
			return nil
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"current_password":"oldpass123","new_password":"newpass123"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/auth/password", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "test-user-id")

	if err := h.ChangePassword(c); err != nil {
		t.Fatalf("ChangePassword() error = %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestChangePassword_MissingFields(t *testing.T) {
	h := &AuthHandler{authService: &mockAuthService{}, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	tests := []struct {
		name string
		body string
	}{
		{"empty body", `{}`},
		{"missing new_password", `{"current_password":"old"}`},
		{"missing current_password", `{"new_password":"new12345"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodPut, "/api/v1/auth/password", strings.NewReader(tt.body))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			c.Set("user_id", "test-user-id")

			err := h.ChangePassword(c)
			if err == nil {
				t.Error("ChangePassword() expected error for missing fields")
			}
		})
	}
}

func TestChangePassword_NoAuth(t *testing.T) {
	h := &AuthHandler{authService: &mockAuthService{}, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"current_password":"old","new_password":"new12345"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/auth/password", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.ChangePassword(c)
	if err == nil {
		t.Error("ChangePassword() expected error without user_id in context")
	}
}

func TestRegister_SendsVerificationEmail(t *testing.T) {
	emailMock := &mockEmailService{configured: true}
	authMock := &mockAuthService{
		registerFn: func(ctx context.Context, input *service.RegisterInput) (*service.AuthResult, error) {
			result := testAuthResult()
			result.VerificationToken = "verify-token-123"
			return result, nil
		},
	}
	h := &AuthHandler{authService: authMock, emailService: emailMock, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"new@example.com","password":"password123","first_name":"Jane","last_name":"Doe"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.Register(c); err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	// Give the goroutine time to execute
	time.Sleep(100 * time.Millisecond)

	if !emailMock.sendVerificationCalled.Load() {
		t.Error("expected SendVerificationEmail to be called after registration")
	}
}

func TestRegister_SkipsEmailWhenNotConfigured(t *testing.T) {
	emailMock := &mockEmailService{configured: false}
	authMock := &mockAuthService{
		registerFn: func(ctx context.Context, input *service.RegisterInput) (*service.AuthResult, error) {
			result := testAuthResult()
			result.VerificationToken = "verify-token-123"
			return result, nil
		},
	}
	h := &AuthHandler{authService: authMock, emailService: emailMock, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"new@example.com","password":"password123","first_name":"Jane","last_name":"Doe"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.Register(c); err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	time.Sleep(100 * time.Millisecond)

	if emailMock.sendVerificationCalled.Load() {
		t.Error("SendVerificationEmail should not be called when email is not configured")
	}
}

// =============================================================================
// LOGOUT HANDLER TESTS
// =============================================================================

func TestLogout_Success(t *testing.T) {
	var calledWith string
	mock := &mockAuthService{
		logoutFn: func(ctx context.Context, userID string) error {
			calledWith = userID
			return nil
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "user-123")

	if err := h.Logout(c); err != nil {
		t.Fatalf("Logout() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if calledWith != "user-123" {
		t.Errorf("Logout called with %q, want %q", calledWith, "user-123")
	}
}

func TestLogout_NoAuth(t *testing.T) {
	h := &AuthHandler{authService: &mockAuthService{}, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.Logout(c)
	if err == nil {
		t.Error("Logout() expected error without user_id")
	}
}

// =============================================================================
// FORGOT PASSWORD HANDLER TESTS
// =============================================================================

func TestForgotPassword_Success(t *testing.T) {
	mock := &mockAuthService{
		forgotPasswordFn: func(ctx context.Context, input *service.ForgotPasswordInput) (string, error) {
			return "reset-token-abc", nil
		},
	}
	emailMock := &mockEmailService{configured: true}
	h := &AuthHandler{authService: mock, emailService: emailMock, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"user@example.com"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/forgot-password", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.ForgotPassword(c); err != nil {
		t.Fatalf("ForgotPassword() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	time.Sleep(100 * time.Millisecond)
	if !emailMock.sendResetCalled.Load() {
		t.Error("expected SendPasswordResetEmail to be called")
	}
}

func TestForgotPassword_AlwaysReturns200(t *testing.T) {
	mock := &mockAuthService{
		forgotPasswordFn: func(ctx context.Context, input *service.ForgotPasswordInput) (string, error) {
			return "", nil
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"nonexistent@example.com"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/forgot-password", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.ForgotPassword(c); err != nil {
		t.Fatalf("ForgotPassword() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d (prevents email enumeration)", rec.Code, http.StatusOK)
	}
}

func TestForgotPassword_EnqueuesWhenQueueConfigured(t *testing.T) {
	mock := &mockAuthService{
		forgotPasswordFn: func(ctx context.Context, input *service.ForgotPasswordInput) (string, error) {
			return "reset-token", nil
		},
	}
	q := &mockQueue{configured: true}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{configured: true}, queue: q, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"user@example.com"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/forgot-password", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.ForgotPassword(c); err != nil {
		t.Fatalf("ForgotPassword() error = %v", err)
	}
	if len(q.enqueuedTasks) != 1 || q.enqueuedTasks[0] != "email:password_reset" {
		t.Errorf("expected email:password_reset task, got %v", q.enqueuedTasks)
	}
}

// =============================================================================
// VERIFY RESET TOKEN HANDLER TESTS
// =============================================================================

func TestVerifyResetToken_Success(t *testing.T) {
	mock := &mockAuthService{
		verifyResetTokenFn: func(ctx context.Context, input *service.VerifyResetTokenInput) (*service.VerifyResetTokenResult, error) {
			return &service.VerifyResetTokenResult{Valid: true, Email: "user@example.com"}, nil
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/verify-reset-token?token=valid-token", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames()
	c.QueryParams().Set("token", "valid-token")

	if err := h.VerifyResetToken(c); err != nil {
		t.Fatalf("VerifyResetToken() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestVerifyResetToken_MissingToken(t *testing.T) {
	h := &AuthHandler{authService: &mockAuthService{}, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/verify-reset-token", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.VerifyResetToken(c)
	if err == nil {
		t.Error("VerifyResetToken() expected error for missing token")
	}
}

// =============================================================================
// RESET PASSWORD HANDLER TESTS
// =============================================================================

func TestResetPassword_Success(t *testing.T) {
	mock := &mockAuthService{
		resetPasswordFn: func(ctx context.Context, input *service.ResetPasswordInput) error {
			return nil
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"token":"valid-token","password":"newpassword123"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/reset-password", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.ResetPassword(c); err != nil {
		t.Fatalf("ResetPassword() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestResetPassword_ServiceError(t *testing.T) {
	mock := &mockAuthService{
		resetPasswordFn: func(ctx context.Context, input *service.ResetPasswordInput) error {
			return apperror.BadRequest("Invalid or expired reset token")
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"token":"bad-token","password":"newpassword123"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/reset-password", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.ResetPassword(c)
	if err == nil {
		t.Error("ResetPassword() expected error for bad token")
	}
}

// =============================================================================
// VERIFY EMAIL HANDLER TESTS
// =============================================================================

func TestVerifyEmail_Success(t *testing.T) {
	mock := &mockAuthService{
		verifyEmailFn: func(ctx context.Context, input *service.VerifyEmailInput) error {
			return nil
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/verify-email?token=valid-token", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.QueryParams().Set("token", "valid-token")

	if err := h.VerifyEmail(c); err != nil {
		t.Fatalf("VerifyEmail() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestVerifyEmail_MissingToken(t *testing.T) {
	h := &AuthHandler{authService: &mockAuthService{}, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/verify-email", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.VerifyEmail(c)
	if err == nil {
		t.Error("VerifyEmail() expected error for missing token")
	}
}

func TestVerifyEmail_InvalidToken(t *testing.T) {
	mock := &mockAuthService{
		verifyEmailFn: func(ctx context.Context, input *service.VerifyEmailInput) error {
			return apperror.BadRequest("Invalid verification token")
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/verify-email?token=bad", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.QueryParams().Set("token", "bad")

	err := h.VerifyEmail(c)
	if err == nil {
		t.Error("VerifyEmail() expected error for invalid token")
	}
}

// =============================================================================
// RESEND VERIFICATION HANDLER TESTS
// =============================================================================

func TestResendVerification_Success(t *testing.T) {
	mock := &mockAuthService{
		resendVerificationFn: func(ctx context.Context, input *service.ResendVerificationInput) (string, error) {
			return "new-verify-token", nil
		},
	}
	emailMock := &mockEmailService{configured: true}
	h := &AuthHandler{authService: mock, emailService: emailMock, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"user@example.com"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/resend-verification", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.ResendVerification(c); err != nil {
		t.Fatalf("ResendVerification() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	time.Sleep(100 * time.Millisecond)
	if !emailMock.sendVerificationCalled.Load() {
		t.Error("expected SendVerificationEmail to be called")
	}
}

func TestResendVerification_EnqueuesWhenQueueConfigured(t *testing.T) {
	mock := &mockAuthService{
		resendVerificationFn: func(ctx context.Context, input *service.ResendVerificationInput) (string, error) {
			return "verify-token", nil
		},
	}
	q := &mockQueue{configured: true}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{configured: true}, queue: q, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"user@example.com"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/resend-verification", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.ResendVerification(c); err != nil {
		t.Fatalf("ResendVerification() error = %v", err)
	}
	if len(q.enqueuedTasks) != 1 || q.enqueuedTasks[0] != "email:verification" {
		t.Errorf("expected email:verification task, got %v", q.enqueuedTasks)
	}
}

func TestResendVerification_SkipsEmailWhenNotConfigured(t *testing.T) {
	mock := &mockAuthService{
		resendVerificationFn: func(ctx context.Context, input *service.ResendVerificationInput) (string, error) {
			return "verify-token", nil
		},
	}
	emailMock := &mockEmailService{configured: false}
	h := &AuthHandler{authService: mock, emailService: emailMock, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"user@example.com"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/resend-verification", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.ResendVerification(c); err != nil {
		t.Fatalf("ResendVerification() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	time.Sleep(50 * time.Millisecond)
	if emailMock.sendVerificationCalled.Load() {
		t.Error("should not send email when not configured")
	}
}

func TestResendVerification_AlwaysReturns200(t *testing.T) {
	mock := &mockAuthService{
		resendVerificationFn: func(ctx context.Context, input *service.ResendVerificationInput) (string, error) {
			return "", nil
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"email":"ghost@example.com"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/resend-verification", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.ResendVerification(c); err != nil {
		t.Fatalf("ResendVerification() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d (prevents email enumeration)", rec.Code, http.StatusOK)
	}
}

// =============================================================================
// REFRESH HANDLER TESTS (SUCCESS PATH)
// =============================================================================

func TestRefresh_Success(t *testing.T) {
	mock := &mockAuthService{
		refreshFn: func(ctx context.Context, input *service.RefreshInput) (*service.AuthResult, error) {
			return testAuthResult(), nil
		},
	}
	h := &AuthHandler{authService: mock, emailService: &mockEmailService{}, queue: &mockQueue{}, retryAttempts: 3, retryDelay: time.Second}

	body := `{"refresh_token":"valid-refresh-token"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.Refresh(c); err != nil {
		t.Fatalf("Refresh() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}
