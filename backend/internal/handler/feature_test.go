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

type mockFeatureService struct {
	flags   []service.FeatureFlag
	enabled map[string]bool
	setKey  string
	setVal  bool
}

func (m *mockFeatureService) List(ctx context.Context) ([]service.FeatureFlag, error) {
	return m.flags, nil
}

func (m *mockFeatureService) ListEnabled(ctx context.Context) (map[string]bool, error) {
	return m.enabled, nil
}

func (m *mockFeatureService) Set(ctx context.Context, key string, enabled bool) error {
	m.setKey = key
	m.setVal = enabled
	return nil
}

func TestFeature_List_Admin(t *testing.T) {
	mock := &mockFeatureService{
		flags: []service.FeatureFlag{
			{Key: "test_flag", Enabled: true, Description: "A test flag"},
		},
	}
	h := NewFeatureHandler(mock)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/features", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_type", "admin")

	if err := h.List(c); err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestFeature_List_NonAdmin(t *testing.T) {
	h := NewFeatureHandler(&mockFeatureService{})

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/features", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_type", "user")

	err := h.List(c)
	if err == nil {
		t.Error("expected error for non-admin")
	}
}

func TestFeature_ListEnabled_Public(t *testing.T) {
	mock := &mockFeatureService{
		enabled: map[string]bool{"maintenance_mode": false, "new_dashboard": true},
	}
	h := NewFeatureHandler(mock)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/features", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.ListEnabled(c); err != nil {
		t.Fatalf("ListEnabled() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestFeature_Set_Admin(t *testing.T) {
	mock := &mockFeatureService{}
	h := NewFeatureHandler(mock)

	e := echo.New()
	body := `{"enabled": true}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/features/test_flag", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("key")
	c.SetParamValues("test_flag")
	c.Set("user_type", "admin")

	if err := h.Set(c); err != nil {
		t.Fatalf("Set() error = %v", err)
	}
	if mock.setKey != "test_flag" {
		t.Errorf("expected key = test_flag, got %s", mock.setKey)
	}
	if !mock.setVal {
		t.Error("expected enabled = true")
	}
}

func TestFeature_Set_MissingKey(t *testing.T) {
	h := NewFeatureHandler(&mockFeatureService{})

	e := echo.New()
	body := `{"enabled": true}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/features/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("key")
	c.SetParamValues("")
	c.Set("user_type", "admin")

	err := h.Set(c)
	if err == nil {
		t.Error("expected error for missing key")
	}
}

func TestFeature_Set_InvalidJSON(t *testing.T) {
	h := NewFeatureHandler(&mockFeatureService{})

	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/features/flag", strings.NewReader("not json"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("key")
	c.SetParamValues("flag")
	c.Set("user_type", "admin")

	err := h.Set(c)
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
}

func TestFeature_Set_NonAdmin(t *testing.T) {
	h := NewFeatureHandler(&mockFeatureService{})

	e := echo.New()
	body := `{"enabled": true}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/features/test_flag", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("key")
	c.SetParamValues("test_flag")
	c.Set("user_type", "user")

	err := h.Set(c)
	if err == nil {
		t.Error("expected error for non-admin")
	}
}
