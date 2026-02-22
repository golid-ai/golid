package queue

import (
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/hibiken/asynq"
)

// =============================================================================
// UNCONFIGURED PATH
// =============================================================================

func TestQueue_IsConfigured_NilClient(t *testing.T) {
	q := New("")
	if q.IsConfigured() {
		t.Error("expected IsConfigured() = false with empty REDIS_URL")
	}
}

func TestQueue_Enqueue_NotConfigured(t *testing.T) {
	q := New("")
	task, err := NewSendVerificationEmail("test@example.com", "token123")
	if err != nil {
		t.Fatalf("unexpected error creating task: %v", err)
	}
	err = q.Enqueue(task)
	if err != ErrNotConfigured {
		t.Errorf("expected ErrNotConfigured, got %v", err)
	}
}

func TestQueue_Close_NilClient(t *testing.T) {
	q := New("")
	if err := q.Close(); err != nil {
		t.Errorf("expected nil error on close with nil client, got %v", err)
	}
}

func TestQueue_New_InvalidRedisURL(t *testing.T) {
	q := New("not-a-valid-url")
	if q.IsConfigured() {
		t.Error("invalid Redis URL should result in unconfigured queue")
	}
}

// =============================================================================
// CONFIGURED PATH (miniredis)
// =============================================================================

func TestQueue_New_WithRedis(t *testing.T) {
	mr := miniredis.RunT(t)
	q := New("redis://" + mr.Addr())
	defer q.Close() //nolint:errcheck // test cleanup

	if !q.IsConfigured() {
		t.Error("expected IsConfigured() = true with valid Redis URL")
	}
}

func TestQueue_Enqueue_Configured(t *testing.T) {
	mr := miniredis.RunT(t)
	q := New("redis://" + mr.Addr())
	defer q.Close() //nolint:errcheck // test cleanup

	task := asynq.NewTask("test:task", []byte(`{"key":"value"}`))
	err := q.Enqueue(task)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestQueue_Enqueue_RedisDown(t *testing.T) {
	mr := miniredis.RunT(t)
	q := New("redis://" + mr.Addr())
	defer q.Close() //nolint:errcheck // test cleanup

	mr.Close()

	task := asynq.NewTask("test:task", []byte(`{}`))
	err := q.Enqueue(task)
	if err == nil {
		t.Error("expected error when Redis is down")
	}
}

func TestQueue_Close_Configured(t *testing.T) {
	mr := miniredis.RunT(t)
	q := New("redis://" + mr.Addr())

	if err := q.Close(); err != nil {
		t.Errorf("expected no error on close, got %v", err)
	}
}
