package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/prometheus/client_golang/prometheus/testutil"

	"github.com/golid-ai/golid/backend/internal/observability"
)

func TestMetrics_IncrementsCounter(t *testing.T) {
	e := echo.New()
	e.Use(Metrics())
	e.GET("/test-metrics", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-metrics", nil)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	counter := observability.RequestsTotal.WithLabelValues("GET", "/test-metrics", "200")
	val := testutil.ToFloat64(counter)
	if val < 1 {
		t.Errorf("expected RequestsTotal >= 1, got %f", val)
	}
}

func TestMetrics_RecordsDuration(t *testing.T) {
	e := echo.New()
	e.Use(Metrics())
	e.GET("/test-duration", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-duration", nil)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	count := testutil.CollectAndCount(observability.RequestDuration)
	if count == 0 {
		t.Error("expected RequestDuration to have observations")
	}
}
