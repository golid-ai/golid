//go:build integration

package service

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/testutil"
)

func ptrStr(s string) string {
	if s == "" {
		return ""
	}
	return s
}

func derefStr(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func TestUpdateProfile_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		ctx := context.Background()
		authSvc := NewAuthService(pool, "test-jwt-secret-that-is-at-least-32-characters-long!", "test-issuer", 15*time.Minute, 7*24*time.Hour, 1*time.Hour)
		userSvc := NewUserService(pool)

		result, err := authSvc.Register(ctx, &RegisterInput{
			Email:     "profile@example.com",
			Password:  "password123",
			FirstName: "Original",
			LastName:  "Name",
		})
		if err != nil {
			t.Fatalf("Register() error = %v", err)
		}

		userID := result.User.ID

		profile, err := userSvc.GetByID(ctx, userID)
		if err != nil {
			t.Fatalf("GetByID() error = %v", err)
		}
		if derefStr(profile.FirstName) != "Original" {
			t.Errorf("FirstName = %q, want %q", derefStr(profile.FirstName), "Original")
		}

		updated, err := userSvc.UpdateProfile(ctx, userID, &ProfileUpdate{
			FirstName: "Updated",
			LastName:  "User",
		})
		if err != nil {
			t.Fatalf("UpdateProfile() error = %v", err)
		}
		if derefStr(updated.FirstName) != "Updated" {
			t.Errorf("FirstName after update = %q, want %q", derefStr(updated.FirstName), "Updated")
		}
		if derefStr(updated.LastName) != "User" {
			t.Errorf("LastName after update = %q, want %q", derefStr(updated.LastName), "User")
		}

		refetched, err := userSvc.GetByID(ctx, userID)
		if err != nil {
			t.Fatalf("GetByID() after update error = %v", err)
		}
		if derefStr(refetched.FirstName) != "Updated" {
			t.Errorf("FirstName after refetch = %q, want %q", derefStr(refetched.FirstName), "Updated")
		}
	})
}

func TestGetByID_NotFound_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		ctx := context.Background()
		userSvc := NewUserService(pool)

		_, err := userSvc.GetByID(ctx, "00000000-0000-0000-0000-000000000000")
		if err == nil {
			t.Fatal("GetByID() expected error for non-existent user")
		}
		if !apperror.Is(err, apperror.CodeNotFound) {
			t.Errorf("expected CodeNotFound, got: %v", err)
		}
	})
}

func TestUpdateProfile_NotFound_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		ctx := context.Background()
		userSvc := NewUserService(pool)

		_, err := userSvc.UpdateProfile(ctx, "00000000-0000-0000-0000-000000000000", &ProfileUpdate{
			FirstName: "Ghost",
		})
		if err == nil {
			t.Fatal("UpdateProfile() expected NotFound for non-existent user (GetByID runs after UPDATE)")
		}
		if !apperror.Is(err, apperror.CodeNotFound) {
			t.Errorf("expected CodeNotFound, got: %v", err)
		}
	})
}

func TestUpdateProfile_AvatarURL_Integration(t *testing.T) {
	testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
		ctx := context.Background()
		authSvc := NewAuthService(pool, "test-jwt-secret-that-is-at-least-32-characters-long!", "test-issuer", 15*time.Minute, 7*24*time.Hour, 1*time.Hour)
		userSvc := NewUserService(pool)

		result, err := authSvc.Register(ctx, &RegisterInput{
			Email:     "avatar@example.com",
			Password:  "password123",
			FirstName: "Test",
			LastName:  "User",
		})
		if err != nil {
			t.Fatalf("Register() error = %v", err)
		}

		updated, err := userSvc.UpdateProfile(ctx, result.User.ID, &ProfileUpdate{
			AvatarURL:    "https://example.com/pic.jpg",
			AvatarURLSet: true,
		})
		if err != nil {
			t.Fatalf("UpdateProfile() set avatar error = %v", err)
		}
		if derefStr(updated.AvatarURL) != "https://example.com/pic.jpg" {
			t.Errorf("AvatarURL = %q, want %q", derefStr(updated.AvatarURL), "https://example.com/pic.jpg")
		}

		cleared, err := userSvc.UpdateProfile(ctx, result.User.ID, &ProfileUpdate{
			AvatarURL:    "",
			AvatarURLSet: true,
		})
		if err != nil {
			t.Fatalf("UpdateProfile() clear avatar error = %v", err)
		}
		if updated.AvatarURL != nil && derefStr(cleared.AvatarURL) != "" {
			t.Errorf("AvatarURL after clear = %q, want empty", derefStr(cleared.AvatarURL))
		}
	})
}
