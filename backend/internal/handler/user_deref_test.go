package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/service"
)

func TestDerefStr(t *testing.T) {
	t.Run("nil returns empty", func(t *testing.T) {
		if got := derefStr(nil); got != "" {
			t.Errorf("derefStr(nil) = %q, want empty", got)
		}
	})

	t.Run("non-nil returns value", func(t *testing.T) {
		s := "hello"
		if got := derefStr(&s); got != "hello" {
			t.Errorf("derefStr(&\"hello\") = %q, want \"hello\"", got)
		}
	})

	t.Run("empty string pointer returns empty", func(t *testing.T) {
		s := ""
		if got := derefStr(&s); got != "" {
			t.Errorf("derefStr(&\"\") = %q, want empty", got)
		}
	})
}

func TestUpdateProfile_Success(t *testing.T) {
	mock := &mockUserService{
		getByIDFn: func(ctx context.Context, userID string) (*service.UserProfile, error) {
			return testUserProfile("John"), nil
		},
		updateProfileFn: func(ctx context.Context, userID string, update *service.ProfileUpdate) (*service.UserProfile, error) {
			return testUserProfile(update.FirstName), nil
		},
	}
	h := &UserHandler{userService: mock}

	body := `{"first_name":"Updated","last_name":"Name"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/me", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "user-123")

	if err := h.UpdateProfile(c); err != nil {
		t.Fatalf("UpdateProfile() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestUpdateProfile_WithAvatarURL(t *testing.T) {
	var receivedUpdate *service.ProfileUpdate
	mock := &mockUserService{
		getByIDFn: func(ctx context.Context, userID string) (*service.UserProfile, error) {
			return testUserProfile("John"), nil
		},
		updateProfileFn: func(ctx context.Context, userID string, update *service.ProfileUpdate) (*service.UserProfile, error) {
			receivedUpdate = update
			p := testUserProfile("John")
			if update.AvatarURLSet {
				p.AvatarURL = &update.AvatarURL
			}
			return p, nil
		},
	}
	h := &UserHandler{userService: mock}

	body := `{"avatar_url":"https://example.com/pic.jpg"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/me", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "user-123")

	if err := h.UpdateProfile(c); err != nil {
		t.Fatalf("UpdateProfile() error = %v", err)
	}
	if receivedUpdate == nil {
		t.Fatal("expected UpdateProfile to be called with update")
	}
	if !receivedUpdate.AvatarURLSet {
		t.Error("AvatarURLSet should be true when avatar_url is provided")
	}
	if receivedUpdate.AvatarURL != "https://example.com/pic.jpg" {
		t.Errorf("AvatarURL = %q, want %q", receivedUpdate.AvatarURL, "https://example.com/pic.jpg")
	}
}
