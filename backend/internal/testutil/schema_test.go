package testutil

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSanitizeSchemaIdent(t *testing.T) {
	tests := []struct {
		in   string
		want string
	}{
		{"job", "job"},
		{"public_profile", "public_profile"},
		{"Handler", "handler"},
		{"", "pkg"},
		{"a-b.c", "a_b_c"},
	}
	for _, tt := range tests {
		if got := sanitizeSchemaIdent(tt.in); got != tt.want {
			t.Errorf("sanitizeSchemaIdent(%q) = %q, want %q", tt.in, got, tt.want)
		}
	}
}

func TestFindMigrationsDirFromModuleRoot(t *testing.T) {
	dir, err := findMigrationsDir()
	if err != nil {
		t.Fatalf("findMigrationsDir: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "000001_init.up.sql")); err != nil {
		t.Fatalf("expected init migration in %s: %v", dir, err)
	}
}

func TestMigrateDatabaseURLSetsSearchPath(t *testing.T) {
	got, err := migrateDatabaseURL(
		"postgres://test:test@localhost:5432/golid_test?sslmode=disable",
		"it_job_123",
	)
	if err != nil {
		t.Fatalf("migrateDatabaseURL: %v", err)
	}
	if !strings.HasPrefix(got, "pgx5://") {
		t.Fatalf("expected pgx5 scheme for golang-migrate, got %q", got)
	}
	if !strings.Contains(got, "search_path=") || !strings.Contains(got, "it_job_123") {
		t.Fatalf("expected search_path with schema in %q", got)
	}
}

func TestIntegrationSchemaNameFormat(t *testing.T) {
	name := fmt.Sprintf("it_%s_%d", sanitizeSchemaIdent("job"), 42)
	if name != "it_job_42" {
		t.Fatalf("schema name = %q, want it_job_42", name)
	}
}
