package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestAPIVersion_SetsHeader(t *testing.T) {
	e := echo.New()
	e.Use(APIVersion("v1"))
	e.GET("/test", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	version := rec.Header().Get("X-API-Version")
	if version != "v1" {
		t.Errorf("expected X-API-Version = v1, got %s", version)
	}
}

func TestAPIVersion_V2(t *testing.T) {
	e := echo.New()
	e.Use(APIVersion("v2"))
	e.GET("/test", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	version := rec.Header().Get("X-API-Version")
	if version != "v2" {
		t.Errorf("expected X-API-Version = v2, got %s", version)
	}
}
