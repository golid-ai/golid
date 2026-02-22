package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

func TestContextString(t *testing.T) {
	tests := []struct {
		name     string
		key      string
		value    interface{}
		wantStr  string
		wantOK   bool
	}{
		{"valid string", "user_id", "abc-123", "abc-123", true},
		{"nil value", "user_id", nil, "", false},
		{"wrong type", "user_id", 42, "", false},
		{"empty string", "user_id", "", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			if tt.value != nil {
				c.Set(tt.key, tt.value)
			}

			got, ok := contextString(c, tt.key)
			if ok != tt.wantOK {
				t.Errorf("contextString() ok = %v, want %v", ok, tt.wantOK)
			}
			if got != tt.wantStr {
				t.Errorf("contextString() = %q, want %q", got, tt.wantStr)
			}
		})
	}
}

func TestRequireUserID(t *testing.T) {
	tests := []struct {
		name    string
		userID  interface{}
		wantID  string
		wantErr bool
	}{
		{"valid ID", "user-123", "user-123", false},
		{"missing ID", nil, "", true},
		{"empty ID", "", "", true},
		{"wrong type", 42, "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			if tt.userID != nil {
				c.Set("user_id", tt.userID)
			}

			id, err := requireUserID(c)
			if (err != nil) != tt.wantErr {
				t.Errorf("requireUserID() error = %v, wantErr %v", err, tt.wantErr)
			}
			if id != tt.wantID {
				t.Errorf("requireUserID() = %q, want %q", id, tt.wantID)
			}
			if err != nil && !apperror.Is(err, apperror.CodeUnauthorized) {
				t.Errorf("expected UNAUTHORIZED error, got %v", err)
			}
		})
	}
}

func TestRequireUserType(t *testing.T) {
	tests := []struct {
		name     string
		userType interface{}
		wantType string
		wantErr  bool
	}{
		{"valid type", "admin", "admin", false},
		{"user type", "user", "user", false},
		{"missing type", nil, "", true},
		{"empty type", "", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			if tt.userType != nil {
				c.Set("user_type", tt.userType)
			}

			typ, err := requireUserType(c)
			if (err != nil) != tt.wantErr {
				t.Errorf("requireUserType() error = %v, wantErr %v", err, tt.wantErr)
			}
			if typ != tt.wantType {
				t.Errorf("requireUserType() = %q, want %q", typ, tt.wantType)
			}
			if err != nil && !apperror.Is(err, apperror.CodeUnauthorized) {
				t.Errorf("expected UNAUTHORIZED error, got %v", err)
			}
		})
	}
}
