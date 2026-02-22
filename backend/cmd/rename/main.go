// Package main implements the project rename tool.
// Usage: go run ./cmd/rename <new-name> <new-module-path>
// Example: go run ./cmd/rename myapp github.com/myuser/myapp
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode"
)

const oldModule = "github.com/testuser/testapp/backend"
const oldProjectName = "golid"
const oldGitHubRepo = "golid-ai/golid"
const oldNPMScope = "@golid"
const oldDomain = "golid.ai"

func main() {
	if len(os.Args) < 3 {
		fmt.Fprintf(os.Stderr, "Usage: go run ./cmd/rename <new-name> <new-module-path>\n")
		fmt.Fprintf(os.Stderr, "  e.g. go run ./cmd/rename myapp github.com/myuser/myapp/backend\n")
		os.Exit(1)
	}

	newName := os.Args[1]
	newModule := os.Args[2]

	if err := validateProjectName(newName); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %s\n", err)
		os.Exit(1)
	}

	newGitHubRepo := strings.TrimPrefix(newModule, "github.com/")
	newGitHubRepo = strings.TrimSuffix(newGitHubRepo, "/backend")

	root := repoRoot()
	oldTitled := toPascalCase(oldProjectName)
	newTitled := toPascalCase(newName)
	oldUpper := strings.ToUpper(oldProjectName)
	newUpper := strings.ToUpper(strings.ReplaceAll(newName, "-", "_"))
	var changed int

	// 1. Update go.mod
	changed += replaceInFile(root+"backend/go.mod", oldModule, newModule)

	// 2. Update all Go imports and string literals (config defaults, error messages)
	goFiles := findFiles(root+"backend/", ".go")
	for _, f := range goFiles {
		changed += replaceInFile(f, oldModule, newModule)
		changed += replaceInFile(f, oldTitled, newTitled)
		if !strings.HasSuffix(f, "cmd/rename/main.go") {
			changed += replaceInFileSafe(f, oldProjectName, newName)
		}
	}

	// 3. Update docker-compose.yml
	changed += replaceInFileSafe(root+"docker-compose.yml", oldProjectName, newName)

	// 4. Update frontend package.json and package-lock.json (npm scope + name)
	newScope := "@" + newName
	changed += replaceInFile(root+"frontend/package.json", oldNPMScope, newScope)
	changed += replaceInFile(root+"frontend/package-lock.json", oldNPMScope, newScope)

	// 5. Update README (title, badge URLs, GitHub references)
	changed += replaceInFile(root+"README.md", oldGitHubRepo, newGitHubRepo)
	changed += replaceInFile(root+"README.md", toPascalCase(oldProjectName), toPascalCase(newName))

	// 6. Update Cursor rules (may reference module path in examples)
	mdcFiles := findFiles(root+".cursor/rules/", ".mdc")
	for _, f := range mdcFiles {
		changed += replaceInFile(f, oldModule, newModule)
		changed += replaceInFileSafe(f, oldProjectName, newName)
	}

	// 7. Update docs (reference project name and module path)
	docFiles := findFiles(root+"docs/", ".md")
	for _, f := range docFiles {
		changed += replaceInFile(f, oldModule, newModule)
		changed += replaceInFileSafe(f, oldProjectName, newName)
	}

	// 8. Update frontend source files (branding in titles, meta tags, navbar, footer)
	for _, ext := range []string{".tsx", ".ts"} {
		frontendFiles := findFiles(root+"frontend/src/", ext)
		for _, f := range frontendFiles {
			changed += replaceInFile(f, oldTitled, newTitled)
			changed += replaceInFileSafe(f, oldProjectName, newName)
			changed += replaceInFile(f, oldUpper, newUpper)
		}
	}

	// 8b. Update CSS files (branded class names like golid-location-render)
	cssFiles := findFiles(root+"frontend/src/", ".css")
	for _, f := range cssFiles {
		changed += replaceInFile(f, oldProjectName, newName)
		changed += replaceInFile(f, oldUpper, newUpper)
	}

	// 9. Update root-level community files (SECURITY, CHANGELOG, CONTRIBUTING)
	for _, f := range []string{"SECURITY.md", "CHANGELOG.md", "CONTRIBUTING.md"} {
		changed += replaceInFile(root+f, oldGitHubRepo, newGitHubRepo)
		changed += replaceInFile(root+f, oldTitled, newTitled)
	}

	// 10. Update CI/coverage config (GitHub repo references)
	changed += replaceInFile(root+"codecov.yml", oldModule, newModule)

	// 11. Update environment config files (APP_NAME, DB_USER)
	for _, envFile := range []string{"config/.env.qa", "config/.env.prod", "config/.env.example"} {
		changed += replaceInFile(root+envFile, oldTitled, newTitled)
		changed += replaceInFileSafe(root+envFile, oldProjectName, newName)
		changed += replaceInFile(root+envFile, oldUpper, newUpper)
	}

	// 12. Update deploy/teardown scripts and scripts README
	changed += replaceInFileSafe(root+"scripts/deploy.sh", oldProjectName, newName)
	changed += replaceInFileSafe(root+"scripts/teardown.sh", oldProjectName, newName)
	changed += replaceInFileSafe(root+"scripts/README.md", oldProjectName, newName)
	changed += replaceInFile(root+"scripts/README.md", oldTitled, newTitled)

	// 13. Update Swagger docs, Dockerfiles, DevContainer, infra templates
	changed += replaceInFile(root+"backend/docs/docs.go", oldTitled, newTitled)
	changed += replaceInFile(root+".devcontainer/devcontainer.json", oldTitled, newTitled)
	for _, f := range []string{
		"backend/Dockerfile.dev", "backend/Dockerfile.prod",
		"frontend/Dockerfile.dev", "frontend/Dockerfile.prod",
		".devcontainer/Dockerfile",
	} {
		changed += replaceInFile(root+f, oldTitled, newTitled)
		changed += replaceInFileSafe(root+f, oldProjectName, newName)
	}

	// 14. Update infra templates and CI
	infraFiles := findFiles(root+"infra/", ".yaml")
	for _, f := range infraFiles {
		changed += replaceInFileSafe(f, oldProjectName, newName)
	}
	ciFiles := findFiles(root+".github/workflows/", ".yml")
	for _, f := range ciFiles {
		changed += replaceInFileSafe(f, oldProjectName, newName)
	}

	// 15. Update scaffold template branding + backend Makefile
	changed += replaceInFile(root+"backend/cmd/scaffold/main.go", oldTitled, newTitled)
	changed += replaceInFile(root+"backend/Makefile", oldTitled, newTitled)

	// 16b. Update test utility database defaults
	changed += replaceInFileSafe(root+"backend/internal/testutil/testutil.go", oldProjectName, newName)

	// 17. Update miscellaneous files containing project name
	changed += replaceInFile(root+".gcloudignore", oldTitled, newTitled)
	changed += replaceInFileSafe(root+".gcloudignore", oldProjectName, newName)
	changed += replaceInFile(root+"benchmarks/benchmark.js", oldTitled, newTitled)
	changed += replaceInFileSafe(root+"benchmarks/benchmark.js", oldProjectName, newName)
	changed += replaceInFile(root+"frontend/.env.example", oldTitled, newTitled)
	changed += replaceInFileSafe(root+"frontend/.env.example", oldProjectName, newName)
	changed += replaceInFile(root+"frontend/.env.example", oldUpper, newUpper)

	// 18. Update entrypoint scripts (Docker logs + default DB names)
	for _, f := range []string{
		"backend/entrypoint.sh",
		"backend/entrypoint.dev.sh",
		"frontend/prod-entrypoint.sh",
	} {
		changed += replaceInFileSafe(root+f, oldProjectName, newName)
		changed += replaceInFile(root+f, oldTitled, newTitled)
		changed += replaceInFile(root+f, oldUpper, newUpper)
	}

	// 16. Update OpenAPI spec (API title, descriptions)
	changed += replaceInFile(root+"backend/openapi.yaml", oldTitled, newTitled)
	changed += replaceInFileSafe(root+"backend/openapi.yaml", oldProjectName, newName)

	// 19. Update .gitignore (all-caps project name in comments)
	changed += replaceInFile(root+".gitignore", oldUpper, newUpper)

	fmt.Printf("\n=== Rename complete: %d files updated ===\n", changed)
	fmt.Printf("  Module:  %s -> %s\n", oldModule, newModule)
	fmt.Printf("  Project: %s -> %s\n", oldProjectName, newName)
	fmt.Printf("  GitHub:  %s -> %s\n", oldGitHubRepo, newGitHubRepo)
	fmt.Println("\nNext steps:")
	fmt.Println("  1. Review the changes: git diff")
	fmt.Println("  2. Verify build:       cd backend && go build ./...")
	fmt.Println("  3. Verify frontend:    cd frontend && npm run build")
	fmt.Println("  4. Update entry-server.tsx og:url with your domain")
	fmt.Println("  5. Update LICENSE copyright if needed")
}

func repoRoot() string {
	if _, err := os.Stat("backend/go.mod"); err == nil {
		return ""
	}
	if _, err := os.Stat("go.mod"); err == nil {
		return "../"
	}
	return ""
}

func findFiles(dir, ext string) []string {
	var files []string
	_ = filepath.Walk(dir, func(path string, info os.FileInfo, err error) error { //nolint:errcheck
		if err != nil {
			fmt.Fprintf(os.Stderr, "  Warning: skipping %s: %v\n", path, err)
			return nil
		}
		if info.IsDir() {
			base := filepath.Base(path)
			if base == ".git" || base == "node_modules" || base == "tmp" {
				return filepath.SkipDir
			}
			return nil
		}
		if strings.HasSuffix(path, ext) {
			files = append(files, path)
		}
		return nil
	})
	return files
}

var validName = regexp.MustCompile(`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`)

func validateProjectName(name string) error {
	if len(name) < 2 {
		return fmt.Errorf("project name %q is too short (minimum 2 characters)", name)
	}
	if len(name) > 50 {
		return fmt.Errorf("project name %q is too long (maximum 50 characters, GCP limits resource names to 63)", name)
	}
	if !validName.MatchString(name) {
		return fmt.Errorf("project name %q must be lowercase alphanumeric with optional hyphens (e.g. \"myapp\" or \"my-app\")", name)
	}
	return nil
}

func toPascalCase(s string) string {
	var b strings.Builder
	for _, part := range strings.Split(s, "-") {
		if len(part) > 0 {
			b.WriteRune(unicode.ToUpper(rune(part[0])))
			b.WriteString(part[1:])
		}
	}
	return b.String()
}

func replaceInFile(path, old, new string) int {
	data, err := os.ReadFile(path)
	if err != nil {
		return 0
	}
	content := string(data)
	if !strings.Contains(content, old) {
		return 0
	}
	updated := strings.ReplaceAll(content, old, new)
	if err := os.WriteFile(path, []byte(updated), 0o644); err != nil {
		fmt.Fprintf(os.Stderr, "  Warning: could not write %s: %v\n", path, err)
		return 0
	}
	fmt.Printf("  Updated: %s\n", path)
	return 1
}

// replaceInFileSafe replaces old→new but protects the project domain from corruption.
// Without this, replacing "golid"→"myapp" would turn "golid.ai" into "myapp.ai".
func replaceInFileSafe(path, old, new string) int {
	data, err := os.ReadFile(path)
	if err != nil {
		return 0
	}
	content := string(data)
	if !strings.Contains(content, old) {
		return 0
	}
	const placeholder = "\x00DOMAIN\x00"
	protected := strings.ReplaceAll(content, oldDomain, placeholder)
	updated := strings.ReplaceAll(protected, old, new)
	final := strings.ReplaceAll(updated, placeholder, oldDomain)
	if final == content {
		return 0
	}
	if err := os.WriteFile(path, []byte(final), 0o644); err != nil {
		fmt.Fprintf(os.Stderr, "  Warning: could not write %s: %v\n", path, err)
		return 0
	}
	fmt.Printf("  Updated: %s\n", path)
	return 1
}
