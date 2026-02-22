package observability

import (
	"context"
	"testing"
)

func TestInitTracer_NoOp(t *testing.T) {
	shutdown, err := InitTracer("", "test-service", "development", 1.0)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if err := shutdown(context.Background()); err != nil {
		t.Fatalf("expected no error on no-op shutdown, got %v", err)
	}
}

func TestInitTracer_EmptyServiceName(t *testing.T) {
	shutdown, err := InitTracer("", "", "development", 0.5)
	if err != nil {
		t.Fatalf("expected no error with empty service name, got %v", err)
	}
	if err := shutdown(context.Background()); err != nil {
		t.Fatalf("expected no error on shutdown, got %v", err)
	}
}
