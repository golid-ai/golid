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

func TestInitTracer_WithEndpoint(t *testing.T) {
	shutdown, err := InitTracer("localhost:4317", "test-service", "development", 1.0)
	if err != nil {
		t.Fatalf("expected no error with endpoint set, got %v", err)
	}
	if shutdown == nil {
		t.Fatal("expected non-nil shutdown function")
	}
	if err := shutdown(context.Background()); err != nil {
		t.Fatalf("expected no error on shutdown, got %v", err)
	}
}

func TestInitTracer_WithEndpointPartialSampleRatio(t *testing.T) {
	shutdown, err := InitTracer("localhost:4317", "test-service", "staging", 0.5)
	if err != nil {
		t.Fatalf("expected no error with partial sample ratio, got %v", err)
	}
	if err := shutdown(context.Background()); err != nil {
		t.Fatalf("expected no error on shutdown, got %v", err)
	}
}

func TestInitTracer_WithEndpointZeroSampleRatio(t *testing.T) {
	shutdown, err := InitTracer("localhost:4317", "", "production", 0.0)
	if err != nil {
		t.Fatalf("expected no error with zero sample ratio, got %v", err)
	}
	if err := shutdown(context.Background()); err != nil {
		t.Fatalf("expected no error on shutdown, got %v", err)
	}
}
