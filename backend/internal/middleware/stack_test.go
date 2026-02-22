package middleware

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/config"
)

func TestErrorHandler_AppError(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := apperror.NotFound("User")
	ErrorHandler(err, c)

	if rec.Code != http.StatusNotFound {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusNotFound)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse body: %v", err)
	}
	if body["code"] != string(apperror.CodeNotFound) {
		t.Errorf("code = %v, want %v", body["code"], apperror.CodeNotFound)
	}
	if body["message"] != "User not found" {
		t.Errorf("message = %v, want 'User not found'", body["message"])
	}
}

func TestErrorHandler_InternalError_HidesDetails(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := apperror.Internal(errors.New("secret database connection string"))
	ErrorHandler(err, c)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusInternalServerError)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse body: %v", err)
	}
	if body["message"] != "An internal error occurred" {
		t.Errorf("internal error should not expose details, got %v", body["message"])
	}

	bodyStr := rec.Body.String()
	if contains(bodyStr, "secret") || contains(bodyStr, "database") {
		t.Error("internal error details leaked to response")
	}
}

func TestErrorHandler_EchoHTTPError(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := echo.NewHTTPError(http.StatusMethodNotAllowed, "Method not allowed")
	ErrorHandler(err, c)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusMethodNotAllowed)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse body: %v", err)
	}
	if body["code"] != "HTTP_ERROR" {
		t.Errorf("code = %v, want HTTP_ERROR", body["code"])
	}
	if body["message"] != "Method not allowed" {
		t.Errorf("message = %v, want 'Method not allowed'", body["message"])
	}
}

func TestErrorHandler_EchoHTTPError_NonStringMessage(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := echo.NewHTTPError(http.StatusBadRequest, 42)
	ErrorHandler(err, c)

	var body map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse body: %v", err)
	}
	if body["message"] != "An error occurred" {
		t.Errorf("non-string echo error should use default message, got %v", body["message"])
	}
}

func TestErrorHandler_UnknownError(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := errors.New("something unexpected")
	ErrorHandler(err, c)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusInternalServerError)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse body: %v", err)
	}
	if body["message"] != "An internal error occurred" {
		t.Errorf("unknown error should use generic message, got %v", body["message"])
	}
}

func TestErrorHandler_CommittedResponse_NoOp(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	c.Response().WriteHeader(http.StatusOK)

	sizeBefore := rec.Body.Len()
	ErrorHandler(errors.New("should be ignored"), c)

	if rec.Body.Len() != sizeBefore {
		t.Error("ErrorHandler should not write to committed response")
	}
}

func TestErrorHandler_ValidationError_IncludesDetails(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := apperror.Validation("Validation failed", map[string]string{
		"email": "Email is required",
	})
	ErrorHandler(err, c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse body: %v", err)
	}
	details, ok := body["details"].(map[string]interface{})
	if !ok {
		t.Fatal("expected details in validation error response")
	}
	if details["email"] != "Email is required" {
		t.Errorf("details.email = %v, want 'Email is required'", details["email"])
	}
}

func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func TestTimeout_NormalRequest(t *testing.T) {
	e := echo.New()
	mw := Timeout(5 * time.Second)

	handler := mw(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/test", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := handler(c); err != nil {
		t.Fatalf("Timeout() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestTimeout_SkipsSSEStream(t *testing.T) {
	e := echo.New()
	mw := Timeout(1 * time.Millisecond)

	called := false
	handler := mw(func(c echo.Context) error {
		time.Sleep(10 * time.Millisecond)
		called = true
		return c.String(http.StatusOK, "streamed")
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/events/stream", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/events/stream")

	if err := handler(c); err != nil {
		t.Fatalf("Timeout() should skip SSE streams, got error: %v", err)
	}
	if !called {
		t.Error("handler should have been called without timeout for SSE")
	}
}

func TestTimeout_ExceedsDeadline(t *testing.T) {
	e := echo.New()
	mw := Timeout(10 * time.Millisecond)

	handler := mw(func(c echo.Context) error {
		time.Sleep(100 * time.Millisecond)
		return c.String(http.StatusOK, "late")
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/test", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	_ = handler(c)
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status 503, got %d", rec.Code)
	}
}

func TestStrictRateLimiter_ReturnsMiddleware(t *testing.T) {
	mw := StrictRateLimiter(10)
	if mw == nil {
		t.Error("StrictRateLimiter() returned nil")
	}
}

func TestRateLimiter_InMemory_ReturnsMiddleware(t *testing.T) {
	mw := RateLimiter(5, time.Minute)
	if mw == nil {
		t.Error("RateLimiter() returned nil")
	}
}

func TestRequestLogger_ReturnsMiddleware(t *testing.T) {
	mw := RequestLogger()
	if mw == nil {
		t.Error("RequestLogger() returned nil")
	}
}

func TestRequestLogger_LogsRequest(t *testing.T) {
	e := echo.New()
	mw := RequestLogger()

	handler := mw(func(c echo.Context) error {
		return c.String(http.StatusOK, "logged")
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := handler(c); err != nil {
		t.Fatalf("RequestLogger() error = %v", err)
	}
}

func TestSetup_ConfiguresMiddleware(t *testing.T) {
	e := echo.New()
	cfg := &config.Config{
		AllowedOrigins: []string{"http://localhost:3000"},
		Environment:    "development",
		RequestTimeout: 30 * time.Second,
	}

	Setup(e, cfg)

	if e.HTTPErrorHandler == nil {
		t.Error("Setup should configure HTTPErrorHandler")
	}

	// Verify middleware chain is wired by making a request
	e.GET("/test", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Setup request status = %d, want %d", rec.Code, http.StatusOK)
	}

	// Verify security headers are set
	if rec.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Error("expected X-Content-Type-Options: nosniff header")
	}
	if rec.Header().Get("X-Frame-Options") != "DENY" {
		t.Error("expected X-Frame-Options: DENY header")
	}

	// Verify request ID middleware is active
	if rec.Header().Get(echo.HeaderXRequestID) == "" {
		t.Error("expected X-Request-Id header from RequestID middleware")
	}
}

func TestSetup_GzipSkipsSSE(t *testing.T) {
	e := echo.New()
	cfg := &config.Config{
		AllowedOrigins: []string{"http://localhost:3000"},
	}
	Setup(e, cfg)

	e.GET("/api/v1/events/stream", func(c echo.Context) error {
		return c.String(http.StatusOK, "stream")
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/events/stream", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	if rec.Header().Get("Content-Encoding") == "gzip" {
		t.Error("SSE stream should not be gzipped")
	}
}

func TestSetup_CORSDenyByDefault(t *testing.T) {
	e := echo.New()
	cfg := &config.Config{
		AllowedOrigins: []string{},
	}
	Setup(e, cfg)

	e.GET("/test", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodOptions, "/test", nil)
	req.Header.Set("Origin", "https://evil.com")
	req.Header.Set("Access-Control-Request-Method", "GET")
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "" {
		t.Errorf("CORS should deny unknown origins when AllowedOrigins is empty, got Allow-Origin: %s", origin)
	}
}

func TestSetup_CORSAllowsConfiguredOrigin(t *testing.T) {
	e := echo.New()
	cfg := &config.Config{
		AllowedOrigins: []string{"https://app.example.com"},
	}
	Setup(e, cfg)

	e.GET("/test", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodOptions, "/test", nil)
	req.Header.Set("Origin", "https://app.example.com")
	req.Header.Set("Access-Control-Request-Method", "GET")
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "https://app.example.com" {
		t.Errorf("CORS should allow configured origin, got Allow-Origin: %q", origin)
	}
}

func TestRequestLogger_HandlesError(t *testing.T) {
	e := echo.New()
	e.HTTPErrorHandler = func(err error, c echo.Context) {}
	mw := RequestLogger()

	handler := mw(func(c echo.Context) error {
		return apperror.BadRequest("test error")
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := handler(c)
	if err != nil {
		t.Errorf("RequestLogger should swallow errors after calling c.Error, got: %v", err)
	}
}
