package wire

import (
	"testing"
)

func TestBuildHandlers_ReturnsNonNilHandlers(t *testing.T) {
	h, _, _ := buildWireStack(t)
	if h == nil {
		t.Fatal("BuildHandlers returned nil")
	}
	if h.Auth == nil {
		t.Error("Auth handler is nil")
	}
	if h.User == nil {
		t.Error("User handler is nil")
	}
	if h.Feature == nil {
		t.Error("Feature handler is nil")
	}
	if h.SSE == nil {
		t.Error("SSE handler is nil")
	}
}
