package wire

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/queue"
)

func assertRoute(t *testing.T, routes []*echo.Route, method, path string) {
	t.Helper()
	for _, r := range routes {
		if r.Method == method && r.Path == path {
			return
		}
	}
	t.Errorf("route %s %s not found", method, path)
	for _, r := range routes {
		t.Logf("  registered: %s %s", r.Method, r.Path)
	}
}

func TestRegisterRoutes_MountsV1Groups(t *testing.T) {
	h, svcs, cfg := buildWireStack(t)
	e := echo.New()
	RegisterRoutes(e, h, svcs, cfg, stubJWTMW())

	routes := e.Routes()

	// Public routes
	assertRoute(t, routes, http.MethodGet, "/api/v1/features")
	assertRoute(t, routes, http.MethodPost, "/api/v1/auth/register")
	assertRoute(t, routes, http.MethodPost, "/api/v1/auth/login")
	assertRoute(t, routes, http.MethodPost, "/api/v1/auth/refresh")
	assertRoute(t, routes, http.MethodPost, "/api/v1/auth/forgot-password")
	assertRoute(t, routes, http.MethodGet, "/api/v1/auth/verify-reset-token")
	assertRoute(t, routes, http.MethodPost, "/api/v1/auth/reset-password")
	assertRoute(t, routes, http.MethodGet, "/api/v1/auth/verify-email")
	assertRoute(t, routes, http.MethodPost, "/api/v1/auth/resend-verification")

	// Protected routes
	assertRoute(t, routes, http.MethodPost, "/api/v1/auth/logout")
	assertRoute(t, routes, http.MethodPut, "/api/v1/auth/password")
	assertRoute(t, routes, http.MethodGet, "/api/v1/me")
	assertRoute(t, routes, http.MethodPut, "/api/v1/me")

	// Admin routes
	assertRoute(t, routes, http.MethodGet, "/api/v1/admin/features")
	assertRoute(t, routes, http.MethodPut, "/api/v1/admin/features/:key")

	// SSE routes
	assertRoute(t, routes, http.MethodGet, "/api/v1/events/stream")
	assertRoute(t, routes, http.MethodPost, "/api/v1/events/ticket")
	assertRoute(t, routes, http.MethodPost, "/api/v1/events/demo")

	// No v2 API group
	for _, r := range routes {
		if len(r.Path) >= 8 && r.Path[:8] == "/api/v2/" {
			t.Errorf("unexpected v2 route: %s %s", r.Method, r.Path)
		}
	}
}

func TestRegisterRoutes_SetsAPIVersionHeader(t *testing.T) {
	h, svcs, cfg := buildWireStack(t)
	e := echo.New()
	RegisterRoutes(e, h, svcs, cfg, stubJWTMW())

	req := httptest.NewRequest(http.MethodGet, "/api/v1/features", nil)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	if got := rec.Header().Get("X-API-Version"); got != "v1" {
		t.Errorf("X-API-Version = %q, want v1", got)
	}
}

func TestRegisterRoutes_ProductionOmitsDemoRoute(t *testing.T) {
	h, svcs, cfg := buildWireStack(t)
	cfg.Environment = "production"

	e := echo.New()
	RegisterRoutes(e, h, svcs, cfg, stubJWTMW())

	for _, r := range e.Routes() {
		if r.Method == http.MethodPost && r.Path == "/api/v1/events/demo" {
			t.Error("production config should not register /api/v1/events/demo")
		}
	}
}

func TestRegisterRoutes_WithConfiguredQueue(t *testing.T) {
	cfg := testWireConfig()
	pool := newTestPool(t)
	svcs := BuildServices(context.Background(), cfg, pool)
	jobQueue := queue.New("redis://localhost:6379")
	h := BuildHandlers(svcs, cfg, jobQueue)

	e := echo.New()
	RegisterRoutes(e, h, svcs, cfg, stubJWTMW())

	assertRoute(t, e.Routes(), http.MethodPost, "/api/v1/auth/register")
}
