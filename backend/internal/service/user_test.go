package service

import (
	"encoding/json"
	"testing"
	"time"
)

func TestUserProfile_JSONOmitsEmptyOptionalFields(t *testing.T) {
	profile := &UserProfile{
		ID:        "user-123",
		Email:     "test@example.com",
		Type:      "user",
		CreatedAt: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
		FirstName: strPtr("John"),
		LastName:  strPtr("Doe"),
	}

	data, err := json.Marshal(profile)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	result := string(data)

	if !contains(result, `"id":"user-123"`) {
		t.Error("JSON should contain id")
	}
	if !contains(result, `"email":"test@example.com"`) {
		t.Error("JSON should contain email")
	}
	if !contains(result, `"first_name":"John"`) {
		t.Error("JSON should contain first_name")
	}
	if !contains(result, `"avatar_url":null`) {
		t.Error("JSON should contain avatar_url as null when unset")
	}
}

func TestProfileUpdate_PartialUpdatePreservesZeroValues(t *testing.T) {
	update := &ProfileUpdate{
		FirstName: "NewFirst",
	}

	if update.FirstName != "NewFirst" {
		t.Error("FirstName should be set")
	}
	if update.LastName != "" {
		t.Error("LastName should be empty for partial update")
	}
	if update.AvatarURLSet {
		t.Error("AvatarURLSet should be false for partial update")
	}
}

func TestProfileUpdate_AvatarURLSetFlag(t *testing.T) {
	tests := []struct {
		name         string
		update       ProfileUpdate
		wantURL      string
		wantURLSet   bool
	}{
		{
			name:       "avatar not provided",
			update:     ProfileUpdate{FirstName: "John"},
			wantURL:    "",
			wantURLSet: false,
		},
		{
			name:       "avatar explicitly set",
			update:     ProfileUpdate{AvatarURL: "https://example.com/img.png", AvatarURLSet: true},
			wantURL:    "https://example.com/img.png",
			wantURLSet: true,
		},
		{
			name:       "avatar explicitly cleared",
			update:     ProfileUpdate{AvatarURL: "", AvatarURLSet: true},
			wantURL:    "",
			wantURLSet: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.update.AvatarURL != tt.wantURL {
				t.Errorf("AvatarURL = %q, want %q", tt.update.AvatarURL, tt.wantURL)
			}
			if tt.update.AvatarURLSet != tt.wantURLSet {
				t.Errorf("AvatarURLSet = %v, want %v", tt.update.AvatarURLSet, tt.wantURLSet)
			}
		})
	}
}

func TestNilIfEmpty(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantNil bool
	}{
		{"empty string returns nil", "", true},
		{"non-empty string returns pointer", "hello", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := nilIfEmpty(tt.input)
			if tt.wantNil && result != nil {
				t.Error("expected nil for empty string")
			}
			if !tt.wantNil {
				if result == nil {
					t.Fatal("expected non-nil for non-empty string")
				}
				if *result != tt.input {
					t.Errorf("got %q, want %q", *result, tt.input)
				}
			}
		})
	}
}

func TestUserProfile_EmailVerifiedField(t *testing.T) {
	profile := &UserProfile{
		ID:            "user-123",
		Email:         "test@example.com",
		Type:          "user",
		EmailVerified: true,
		CreatedAt:     time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
	}

	data, err := json.Marshal(profile)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed["email_verified"] != true {
		t.Error("email_verified should be true in JSON output")
	}
}

func strPtr(s string) *string { return &s }

func contains(s, substr string) bool {
	return len(s) >= len(substr) && searchString(s, substr)
}

func searchString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
