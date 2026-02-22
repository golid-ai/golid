package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
)

const testSecret = "test-secret-key-that-is-long-enough"
const testIssuer = "test-app"

func TestGenerateToken(t *testing.T) {
	token, err := GenerateToken(testSecret, "user-123", "user", testIssuer, 15*time.Minute)
	if err != nil {
		t.Fatalf("GenerateToken() error = %v", err)
	}
	if token == "" {
		t.Error("GenerateToken() returned empty token")
	}
}

func TestGenerateRefreshToken(t *testing.T) {
	token, err := GenerateRefreshToken(testSecret, "user-123", testIssuer, 7*24*time.Hour)
	if err != nil {
		t.Fatalf("GenerateRefreshToken() error = %v", err)
	}
	if token == "" {
		t.Error("GenerateRefreshToken() returned empty token")
	}
}

func TestParseToken(t *testing.T) {
	token, err := GenerateRefreshToken(testSecret, "user-123", testIssuer, 15*time.Minute)
	if err != nil {
		t.Fatalf("GenerateRefreshToken() error = %v", err)
	}

	claims, err := ParseToken(testSecret, token)
	if err != nil {
		t.Fatalf("ParseToken() error = %v", err)
	}

	if claims.Subject != "user-123" {
		t.Errorf("ParseToken() subject = %v, want user-123", claims.Subject)
	}
}

func TestParseToken_InvalidToken(t *testing.T) {
	_, err := ParseToken(testSecret, "invalid-token")
	if err == nil {
		t.Error("ParseToken() expected error for invalid token")
	}
}

func TestParseToken_ExpiredToken(t *testing.T) {
	token, err := GenerateRefreshToken(testSecret, "user-123", testIssuer, -1*time.Hour)
	if err != nil {
		t.Fatalf("GenerateRefreshToken() error = %v", err)
	}

	_, err = ParseToken(testSecret, token)
	if err == nil {
		t.Error("ParseToken() expected error for expired token")
	}
}

func TestJWTAuth_MissingHeader(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	middleware := JWTAuth(testSecret)
	handler := middleware(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	err := handler(c)
	if err == nil {
		t.Error("JWTAuth() expected error for missing header")
	}
}

func TestJWTAuth_InvalidFormat(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "InvalidFormat token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	middleware := JWTAuth(testSecret)
	handler := middleware(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	err := handler(c)
	if err == nil {
		t.Error("JWTAuth() expected error for invalid format")
	}
}

func TestJWTAuth_ValidToken(t *testing.T) {
	token, err := GenerateToken(testSecret, "user-123", "user", testIssuer, 15*time.Minute)
	if err != nil {
		t.Fatalf("GenerateToken() error = %v", err)
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	middleware := JWTAuth(testSecret)
	handler := middleware(func(c echo.Context) error {
		userID := c.Get("user_id")
		userType := c.Get("user_type")

		if userID != "user-123" {
			t.Errorf("user_id = %v, want user-123", userID)
		}
		if userType != "user" {
			t.Errorf("user_type = %v, want user", userType)
		}

		return c.String(http.StatusOK, "ok")
	})

	err = handler(c)
	if err != nil {
		t.Errorf("JWTAuth() error = %v", err)
	}
}

func TestRequireRole_Allowed(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_type", "admin")

	middleware := RequireRole("admin")
	handler := middleware(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	err := handler(c)
	if err != nil {
		t.Errorf("RequireRole() error = %v", err)
	}
}

func TestJWTAuth_ExpiredToken(t *testing.T) {
	token, err := GenerateToken(testSecret, "user-123", "user", testIssuer, -1*time.Hour)
	if err != nil {
		t.Fatalf("GenerateToken() error = %v", err)
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	middleware := JWTAuth(testSecret)
	handler := middleware(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	err = handler(c)
	if err == nil {
		t.Error("JWTAuth() expected error for expired token")
	}
}

func TestJWTAuth_WrongSecret(t *testing.T) {
	token, err := GenerateToken("different-secret-that-is-long-enough", "user-123", "user", testIssuer, 15*time.Minute)
	if err != nil {
		t.Fatalf("GenerateToken() error = %v", err)
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	middleware := JWTAuth(testSecret)
	handler := middleware(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	err = handler(c)
	if err == nil {
		t.Error("JWTAuth() expected error for wrong secret")
	}
}

func TestJWTAuth_MalformedToken(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer not-a-valid-jwt-at-all")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	middleware := JWTAuth(testSecret)
	handler := middleware(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	err := handler(c)
	if err == nil {
		t.Error("JWTAuth() expected error for malformed token")
	}
}

func TestJWTAuth_NoBearerPrefix(t *testing.T) {
	token, err := GenerateToken(testSecret, "user-123", "user", testIssuer, 15*time.Minute)
	if err != nil {
		t.Fatalf("GenerateToken() error = %v", err)
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", token)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	middleware := JWTAuth(testSecret)
	handler := middleware(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	err = handler(c)
	if err == nil {
		t.Error("JWTAuth() expected error for missing Bearer prefix")
	}
}

func TestRequireRole_UserTypeMissing(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	middleware := RequireRole("admin")
	handler := middleware(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	err := handler(c)
	if err == nil {
		t.Error("RequireRole() expected error when user_type not set")
	}
}

func TestRequireRole_Denied(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_type", "user")

	middleware := RequireRole("admin")
	handler := middleware(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	err := handler(c)
	if err == nil {
		t.Error("RequireRole() expected error for denied role")
	}
}
