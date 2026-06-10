package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestReplaceInFileSafePreservesDomain(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	path := filepath.Join(dir, "config.env")
	if err := os.WriteFile(path, []byte("APP=golid\nURL=https://golid.ai\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	if replaceInFileSafe(path, oldProjectName, "myapp") != 1 {
		t.Fatal("expected file update")
	}

	got, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	body := string(got)
	if !strings.Contains(body, "APP=myapp") {
		t.Fatalf("project name not replaced: %q", body)
	}
	if !strings.Contains(body, "https://golid.ai") {
		t.Fatalf("domain corrupted: %q", body)
	}
}

func TestReplaceInFileTitledDocLine(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	path := filepath.Join(dir, "architecture.md")
	if err := os.WriteFile(path, []byte("# Golid architecture\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	if replaceInFile(path, "Golid", "Myapp") != 1 {
		t.Fatal("expected titled replacement")
	}

	got, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != "# Myapp architecture\n" {
		t.Fatalf("got %q", got)
	}
}

func TestReplaceInFileSafeREADMETreePath(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	path := filepath.Join(dir, "README.md")
	content := "├── golid/\n│   └── backend/\n"
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}

	if replaceInFileSafe(path, oldProjectName, "myapp") != 1 {
		t.Fatal("expected tree path replacement")
	}

	got, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != "├── myapp/\n│   └── backend/\n" {
		t.Fatalf("got %q", got)
	}
}

func TestReplaceDomainUpdatesOGMetaFallback(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	ogPath := filepath.Join(root, "frontend/src/lib/og-meta.tsx")
	if err := os.MkdirAll(filepath.Dir(ogPath), 0o755); err != nil {
		t.Fatal(err)
	}
	content := `export const OG_SITE_BASE = (import.meta.env.VITE_OG_URL || "https://golid.ai").replace(/\/$/, "");`
	if err := os.WriteFile(ogPath, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}

	if replaceDomain(root+"/", "tidestone", "tidestone.co") != 1 {
		t.Fatal("expected domain replacement")
	}

	got, err := os.ReadFile(ogPath)
	if err != nil {
		t.Fatal(err)
	}
	body := string(got)
	if strings.Contains(body, "golid.ai") {
		t.Fatalf("domain survivor: %q", body)
	}
	if !strings.Contains(body, "https://tidestone.co") {
		t.Fatalf("expected tidestone.co fallback: %q", body)
	}
}

func TestRenameToolMainGoSkippedBySuffix(t *testing.T) {
	t.Parallel()

	path := filepath.Join("backend", "cmd", "rename", "main.go")
	if !strings.HasSuffix(path, "cmd/rename/main.go") {
		t.Fatal("expected rename main.go path to match skip suffix")
	}

	dir := t.TempDir()
	renameMain := filepath.Join(dir, "backend", "cmd", "rename", "main.go")
	if err := os.MkdirAll(filepath.Dir(renameMain), 0o755); err != nil {
		t.Fatal(err)
	}
	baseline := `const oldModule = "github.com/golid-ai/golid/backend"
const oldProjectName = "golid"
`
	if err := os.WriteFile(renameMain, []byte(baseline), 0o644); err != nil {
		t.Fatal(err)
	}

	for _, f := range []string{renameMain} {
		if strings.HasSuffix(f, "cmd/rename/main.go") {
			continue
		}
		replaceInFile(f, oldModule, "github.com/tidestone/tidestone/backend")
	}

	got, err := os.ReadFile(renameMain)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != baseline {
		t.Fatalf("rename tool main.go must not be modified; got %q", got)
	}
}

func TestIsHistoricalDoc(t *testing.T) {
	t.Parallel()

	if !isHistoricalDoc("/repo/docs/decisions/002-foo.md") {
		t.Fatal("expected ADR path to be historical")
	}
	if !isHistoricalDoc("/repo/docs/plans/archive/6-7-26/plan.md") {
		t.Fatal("expected archived plan to be historical")
	}
	if isHistoricalDoc("/repo/docs/architecture.md") {
		t.Fatal("architecture doc should receive titled replacement")
	}
}

func TestValidateDomainRejectsScheme(t *testing.T) {
	t.Parallel()

	if err := validateDomain("https://example.com"); err == nil {
		t.Fatal("expected scheme to be rejected")
	}
	if err := validateDomain("example.com"); err != nil {
		t.Fatalf("valid domain rejected: %v", err)
	}
}

func TestParseArgs(t *testing.T) {
	t.Parallel()

	oldArgs := os.Args
	t.Cleanup(func() { os.Args = oldArgs })

	os.Args = []string{"rename", "myapp", "github.com/u/m/backend", "myapp.com", "--strict"}
	name, module, domain, strict, hint := parseArgs()
	if name != "myapp" || module != "github.com/u/m/backend" || domain != "myapp.com" || !strict || hint {
		t.Fatalf("got name=%q module=%q domain=%q strict=%v hint=%v", name, module, domain, strict, hint)
	}
}
