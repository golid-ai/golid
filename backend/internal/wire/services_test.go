package wire

import (
	"context"
	"testing"
)

func TestBuildServices_ReturnsNonNilServices(t *testing.T) {
	cfg := testWireConfig()
	pool := newTestPool(t)

	svcs := BuildServices(context.Background(), cfg, pool)
	if svcs == nil {
		t.Fatal("BuildServices returned nil")
	}
	if svcs.SSEHub == nil {
		t.Error("SSEHub is nil")
	}
	if svcs.Auth == nil {
		t.Error("Auth is nil")
	}
	if svcs.Users == nil {
		t.Error("Users is nil")
	}
	if svcs.Email == nil {
		t.Error("Email is nil")
	}
	if svcs.Feature == nil {
		t.Error("Feature is nil")
	}
}
