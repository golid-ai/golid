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

	"github.com/golid-ai/golid/backend/internal/service"
)

// =============================================================================
// MOCK USER SERVICE
// =============================================================================

type mockUserService struct {
	getByIDFn       func(ctx context.Context, userID string) (*service.UserProfile, error)
	updateProfileFn func(ctx context.Context, userID string, update *service.ProfileUpdate) (*service.UserProfile, error)
}

func (m *mockUserService) GetByID(ctx context.Context, userID string) (*service.UserProfile, error) {
	return m.getByIDFn(ctx, userID)
}
func (m *mockUserService) UpdateProfile(ctx context.Context, userID string, update *service.ProfileUpdate) (*service.UserProfile, error) {
	if m.updateProfileFn != nil {
		return m.updateProfileFn(ctx, userID, update)
	}
	panic("unexpected UpdateProfile")
}

func testUserProfile(name string) *service.UserProfile {
	lastName := "Doe"
	return &service.UserProfile{
		ID:            "user-123",
		Email:         "test@example.com",
		Type:          "user",
		EmailVerified: true,
		FirstName:     &name,
		LastName:      &lastName,
		CreatedAt:     time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
	}
}

func TestMe_MissingUserID(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := &UserHandler{userService: nil}

	err := h.Me(c)
	if err == nil {
		t.Error("Me() expected error when user_id not in context")
	}
}

func TestMe_EmptyUserID(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "")

	h := &UserHandler{userService: nil}

	err := h.Me(c)
	if err == nil {
		t.Error("Me() expected error when user_id is empty string")
	}
}

func TestUpdateProfile_InvalidJSON(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/me", strings.NewReader("not json"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "test-user-id")

	h := &UserHandler{userService: nil}

	err := h.UpdateProfile(c)
	if err == nil {
		t.Error("UpdateProfile() expected error for invalid JSON")
	}
}

func TestUpdateProfile_MissingUserID(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/me", strings.NewReader(`{"first_name":"Test"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := &UserHandler{userService: nil}

	err := h.UpdateProfile(c)
	if err == nil {
		t.Error("UpdateProfile() expected error when user_id not in context")
	}
}

func TestUpdateProfile_ValidationErrors(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		wantErr bool
	}{
		{
			name:    "name too long",
			body:    `{"first_name":"` + strings.Repeat("a", 101) + `"}`,
			wantErr: true,
		},
		{
			name:    "last name too long",
			body:    `{"last_name":"` + strings.Repeat("b", 101) + `"}`,
			wantErr: true,
		},
		{
			name:    "both names too long",
			body:    `{"first_name":"` + strings.Repeat("a", 101) + `","last_name":"` + strings.Repeat("b", 101) + `"}`,
			wantErr: true,
		},
		{
			name:    "valid short names",
			body:    `{"first_name":"John","last_name":"Doe"}`,
			wantErr: false,
		},
		{
			name:    "empty body is valid",
			body:    `{}`,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req UpdateProfileRequest
			if err := json.Unmarshal([]byte(tt.body), &req); err != nil {
				t.Fatalf("Unmarshal failed: %v", err)
			}

			err := validateProfileUpdate(&req)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateProfileUpdate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestUpdateProfileRequest_Binding(t *testing.T) {
	jsonBody := `{"first_name":"Jane","last_name":"Smith","avatar_url":"https://example.com/pic.jpg"}`

	var req UpdateProfileRequest
	if err := json.Unmarshal([]byte(jsonBody), &req); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if req.FirstName != "Jane" {
		t.Errorf("FirstName = %v, want Jane", req.FirstName)
	}
	if req.LastName != "Smith" {
		t.Errorf("LastName = %v, want Smith", req.LastName)
	}
	if req.AvatarURL == nil || *req.AvatarURL != "https://example.com/pic.jpg" {
		t.Errorf("AvatarURL = %v, want https://example.com/pic.jpg", req.AvatarURL)
	}
}

func TestUpdateProfileRequest_NullAvatar(t *testing.T) {
	jsonBody := `{"first_name":"Jane","avatar_url":null}`

	var req UpdateProfileRequest
	if err := json.Unmarshal([]byte(jsonBody), &req); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if req.AvatarURL != nil {
		t.Errorf("AvatarURL should be nil for null JSON value, got %v", *req.AvatarURL)
	}
}

// =============================================================================
// ETAG TESTS
// =============================================================================

func TestMe_ETagNotModified(t *testing.T) {
	mock := &mockUserService{
		getByIDFn: func(ctx context.Context, userID string) (*service.UserProfile, error) {
			return testUserProfile("John"), nil
		},
	}
	h := &UserHandler{userService: mock}

	// First request — should return 200 with ETag
	e := echo.New()
	req1 := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	rec1 := httptest.NewRecorder()
	c1 := e.NewContext(req1, rec1)
	c1.Set("user_id", "user-123")

	if err := h.Me(c1); err != nil {
		t.Fatalf("first Me() error = %v", err)
	}
	if rec1.Code != http.StatusOK {
		t.Fatalf("first request status = %d, want 200", rec1.Code)
	}

	etag := rec1.Header().Get("ETag")
	if etag == "" {
		t.Fatal("first request missing ETag header")
	}

	// Second request with If-None-Match — should return 304
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req2.Header.Set("If-None-Match", etag)
	rec2 := httptest.NewRecorder()
	c2 := e.NewContext(req2, rec2)
	c2.Set("user_id", "user-123")

	if err := h.Me(c2); err != nil {
		t.Fatalf("second Me() error = %v", err)
	}
	if rec2.Code != http.StatusNotModified {
		t.Errorf("second request status = %d, want 304", rec2.Code)
	}
}

func TestMe_ETagChanged(t *testing.T) {
	callCount := 0
	mock := &mockUserService{
		getByIDFn: func(ctx context.Context, userID string) (*service.UserProfile, error) {
			callCount++
			if callCount == 1 {
				return testUserProfile("John"), nil
			}
			return testUserProfile("Jane"), nil
		},
	}
	h := &UserHandler{userService: mock}

	// First request — capture ETag
	e := echo.New()
	req1 := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	rec1 := httptest.NewRecorder()
	c1 := e.NewContext(req1, rec1)
	c1.Set("user_id", "user-123")

	if err := h.Me(c1); err != nil {
		t.Fatalf("first Me() error = %v", err)
	}
	etag1 := rec1.Header().Get("ETag")

	// Second request with old ETag — data changed, should return 200
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req2.Header.Set("If-None-Match", etag1)
	rec2 := httptest.NewRecorder()
	c2 := e.NewContext(req2, rec2)
	c2.Set("user_id", "user-123")

	if err := h.Me(c2); err != nil {
		t.Fatalf("second Me() error = %v", err)
	}
	if rec2.Code != http.StatusOK {
		t.Errorf("second request status = %d, want 200 (data changed)", rec2.Code)
	}

	etag2 := rec2.Header().Get("ETag")
	if etag2 == etag1 {
		t.Error("ETag should differ when data changes")
	}

	var body map[string]interface{}
	_ = json.Unmarshal(rec2.Body.Bytes(), &body)
	if body["first_name"] != "Jane" {
		t.Errorf("first_name = %v, want Jane", body["first_name"])
	}
}
