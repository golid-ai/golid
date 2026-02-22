package validate_test

import (
	"testing"

	"github.com/golid-ai/golid/backend/internal/validate"
)

func TestUUID_Valid(t *testing.T) {
	err := validate.UUID("550e8400-e29b-41d4-a716-446655440000", "ID")
	if err != nil {
		t.Errorf("UUID() error = %v, want nil", err)
	}
}

func TestUUID_Empty(t *testing.T) {
	err := validate.UUID("", "ID")
	if err == nil {
		t.Error("UUID() expected error for empty string")
	}
}

func TestUUID_Invalid(t *testing.T) {
	err := validate.UUID("not-a-uuid", "ID")
	if err == nil {
		t.Error("UUID() expected error for invalid UUID")
	}
}

func TestUUIDOrNil_Empty(t *testing.T) {
	err := validate.UUIDOrNil("", "ID")
	if err != nil {
		t.Errorf("UUIDOrNil() error = %v, want nil for empty", err)
	}
}

func TestEmail_Valid(t *testing.T) {
	tests := []string{
		"test@example.com",
		"user.name@domain.org",
		"user+tag@example.co.uk",
	}
	for _, email := range tests {
		err := validate.Email(email)
		if err != nil {
			t.Errorf("Email(%s) error = %v, want nil", email, err)
		}
	}
}

func TestEmail_Invalid(t *testing.T) {
	tests := []string{
		"",
		"not-an-email",
		"@nodomain.com",
		"noatsign.com",
	}
	for _, email := range tests {
		err := validate.Email(email)
		if err == nil {
			t.Errorf("Email(%s) expected error", email)
		}
	}
}

func TestPassword_Valid(t *testing.T) {
	err := validate.Password("password123")
	if err != nil {
		t.Errorf("Password() error = %v, want nil", err)
	}
}

func TestPassword_TooShort(t *testing.T) {
	err := validate.Password("short")
	if err == nil {
		t.Error("Password() expected error for short password")
	}
}

func TestEscapeLike(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"normal", "normal"},
		{"with%percent", "with\\%percent"},
		{"with_underscore", "with\\_underscore"},
		{"with\\backslash", "with\\\\backslash"},
		{"100%_off\\deal", "100\\%\\_off\\\\deal"},
	}

	for _, tt := range tests {
		result := validate.EscapeLike(tt.input)
		if result != tt.expected {
			t.Errorf("EscapeLike(%q) = %q, want %q", tt.input, result, tt.expected)
		}
	}
}

func TestWrapLike(t *testing.T) {
	result := validate.WrapLike("search")
	expected := "%search%"
	if result != expected {
		t.Errorf("WrapLike() = %q, want %q", result, expected)
	}

	// With special chars
	result = validate.WrapLike("100%")
	expected = "%100\\%%"
	if result != expected {
		t.Errorf("WrapLike() = %q, want %q", result, expected)
	}
}

func TestRequired_Valid(t *testing.T) {
	err := validate.Required("value", "Field")
	if err != nil {
		t.Errorf("Required() error = %v, want nil", err)
	}
}

func TestRequired_Empty(t *testing.T) {
	tests := []string{"", "   ", "\t\n"}
	for _, val := range tests {
		err := validate.Required(val, "Field")
		if err == nil {
			t.Errorf("Required(%q) expected error", val)
		}
	}
}

func TestUUIDOrNil_Valid(t *testing.T) {
	err := validate.UUIDOrNil("550e8400-e29b-41d4-a716-446655440000", "ID")
	if err != nil {
		t.Errorf("UUIDOrNil() error = %v, want nil for valid UUID", err)
	}
}

func TestUUIDOrNil_Invalid(t *testing.T) {
	err := validate.UUIDOrNil("not-a-uuid", "ID")
	if err == nil {
		t.Error("UUIDOrNil() expected error for invalid non-empty UUID")
	}
}

func TestMinLength_Valid(t *testing.T) {
	err := validate.MinLength("longstring", 5, "Name")
	if err != nil {
		t.Errorf("MinLength() error = %v, want nil", err)
	}
}

func TestMinLength_Exact(t *testing.T) {
	err := validate.MinLength("exact", 5, "Name")
	if err != nil {
		t.Errorf("MinLength() error = %v, want nil for exact length", err)
	}
}

func TestMinLength_TooShort(t *testing.T) {
	err := validate.MinLength("ab", 5, "Name")
	if err == nil {
		t.Error("MinLength() expected error for short string")
	}
}
