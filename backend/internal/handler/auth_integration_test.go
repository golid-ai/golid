//go:build integration

package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/logger"
	"github.com/golid-ai/golid/backend/internal/middleware"
	"github.com/golid-ai/golid/backend/internal/queue"
	"github.com/golid-ai/golid/backend/internal/service/auth"
	"github.com/golid-ai/golid/backend/internal/service/email"
	"github.com/golid-ai/golid/backend/internal/service/user"
	"github.com/golid-ai/golid/backend/internal/testutil"
)

const integrationJWTSecret = "integration-test-jwt-secret-at-least-32-chars!"

func newIntegrationAPI(t *testing.T) (*echo.Echo, func()) {
	t.Helper()
	testutil.SkipIfNoTestDB(t)
	db := testutil.SetupTestDB()

	authSvc := auth.NewAuthService(
		db.Pool,
		integrationJWTSecret,
		"golid-test",
		15*time.Minute,
		7*24*time.Hour,
		time.Hour,
	)
	emailSvc := email.NewEmailService(email.EmailConfig{AppName: "golid-test"})
	jobQueue := queue.New("")
	authH := NewAuthHandler(authSvc, emailSvc, jobQueue, 3, time.Second)
	userH := NewUserHandler(user.NewUserService(db.Pool))

	e := echo.New()
	e.HTTPErrorHandler = middleware.ErrorHandler

	api := e.Group("/api/v1")
	api.Use(middleware.APIVersion("v1"))
	api.Use(middleware.CSRF(false, logger.Logger()))

	authGroup := api.Group("/auth")
	authGroup.POST("/register", authH.Register)
	authGroup.POST("/login", authH.Login)

	protected := api.Group("")
	protected.Use(middleware.JWTAuth(integrationJWTSecret))
	protected.GET("/me", userH.Me)

	cleanup := func() {
		ctx := context.Background()
		db.CleanAllTables(ctx)
		db.Close()
	}
	return e, cleanup
}

func doJSONRequest(e *echo.Echo, method, path, body string, headers map[string]string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Requested-With", "golid-app")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
	return rec
}

func TestRegisterAndLogin_Integration(t *testing.T) {
	e, cleanup := newIntegrationAPI(t)
	defer cleanup()

	registerBody := `{"email":"handler-int@example.com","password":"password123","first_name":"Handler","last_name":"Test"}`
	rec := doJSONRequest(e, http.MethodPost, "/api/v1/auth/register", registerBody, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("register status = %d, body = %s", rec.Code, rec.Body.String())
	}

	var authResp map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &authResp); err != nil {
		t.Fatalf("decode register response: %v", err)
	}
	if authResp["access_token"] == "" {
		t.Error("expected access_token in register response")
	}

	loginBody := `{"email":"handler-int@example.com","password":"password123"}`
	rec = doJSONRequest(e, http.MethodPost, "/api/v1/auth/login", loginBody, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("login status = %d, body = %s", rec.Code, rec.Body.String())
	}
}

func TestRegisterDuplicateEmail_Integration(t *testing.T) {
	e, cleanup := newIntegrationAPI(t)
	defer cleanup()

	body := `{"email":"dupe-handler@example.com","password":"password123","first_name":"A","last_name":"B"}`
	rec := doJSONRequest(e, http.MethodPost, "/api/v1/auth/register", body, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("first register status = %d", rec.Code)
	}

	rec = doJSONRequest(e, http.MethodPost, "/api/v1/auth/register", body, nil)
	if rec.Code != http.StatusConflict {
		t.Fatalf("duplicate register status = %d, want %d", rec.Code, http.StatusConflict)
	}
}

func TestLoginInvalidCredentials_Integration(t *testing.T) {
	e, cleanup := newIntegrationAPI(t)
	defer cleanup()

	body := `{"email":"nobody@example.com","password":"wrongpassword"}`
	rec := doJSONRequest(e, http.MethodPost, "/api/v1/auth/login", body, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("login status = %d, want %d", rec.Code, http.StatusUnauthorized)
	}
}

func TestMeRequiresAuth_Integration(t *testing.T) {
	e, cleanup := newIntegrationAPI(t)
	defer cleanup()

	rec := doJSONRequest(e, http.MethodGet, "/api/v1/me", "", nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("GET /me without auth status = %d, want %d", rec.Code, http.StatusUnauthorized)
	}
}

func TestMeWithJWT_Integration(t *testing.T) {
	e, cleanup := newIntegrationAPI(t)
	defer cleanup()

	registerBody := `{"email":"me-handler@example.com","password":"password123","first_name":"Me","last_name":"User"}`
	rec := doJSONRequest(e, http.MethodPost, "/api/v1/auth/register", registerBody, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("register status = %d", rec.Code)
	}

	var authResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &authResp); err != nil {
		t.Fatalf("decode register response: %v", err)
	}

	rec = doJSONRequest(e, http.MethodGet, "/api/v1/me", "", map[string]string{
		"Authorization": "Bearer " + authResp.AccessToken,
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /me status = %d, body = %s", rec.Code, rec.Body.String())
	}

	var profile map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &profile); err != nil {
		t.Fatalf("decode profile: %v", err)
	}
	if profile["email"] != "me-handler@example.com" {
		t.Errorf("email = %v, want me-handler@example.com", profile["email"])
	}
}
