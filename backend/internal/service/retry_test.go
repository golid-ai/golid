package service

import (
	"fmt"
	"testing"
	"time"
)

func TestRetry_SucceedsImmediately(t *testing.T) {
	callCount := 0
	err := Retry(3, time.Millisecond, func() error {
		callCount++
		return nil
	})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if callCount != 1 {
		t.Errorf("expected 1 call, got %d", callCount)
	}
}

func TestRetry_SucceedsAfterFailures(t *testing.T) {
	callCount := 0
	err := Retry(3, time.Millisecond, func() error {
		callCount++
		if callCount < 3 {
			return fmt.Errorf("flaky")
		}
		return nil
	})
	if err != nil {
		t.Fatalf("expected success after 3 attempts, got %v", err)
	}
	if callCount != 3 {
		t.Errorf("expected 3 calls, got %d", callCount)
	}
}

func TestRetry_ExhaustsAttempts(t *testing.T) {
	callCount := 0
	err := Retry(3, time.Millisecond, func() error {
		callCount++
		return fmt.Errorf("always fails")
	})
	if err == nil {
		t.Fatal("expected error after exhausting attempts")
	}
	if callCount != 3 {
		t.Errorf("expected 3 calls, got %d", callCount)
	}
	if err.Error() != "always fails" {
		t.Errorf("expected last error, got %q", err.Error())
	}
}

func TestRetry_SingleAttempt(t *testing.T) {
	err := Retry(1, time.Millisecond, func() error {
		return fmt.Errorf("fails once")
	})
	if err == nil {
		t.Fatal("expected error with single attempt")
	}
}

func TestRetry_ZeroAttempts(t *testing.T) {
	err := Retry(0, time.Millisecond, func() error {
		t.Fatal("should not be called with 0 attempts")
		return nil
	})
	if err != nil {
		t.Fatalf("expected nil for 0 attempts, got %v", err)
	}
}
