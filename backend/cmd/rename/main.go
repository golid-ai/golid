// Package main implements the project rename tool.
// Usage: go run ./cmd/rename <new-name> <new-module-path> [new-domain]
// Example: go run ./cmd/rename myapp github.com/myuser/myapp/backend myapp.com
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode"
)

const oldModule = "github.com/golid-ai/golid/backend"
const oldProjectName = "golid"
const oldGitHubRepo = "golid-ai/golid"
const oldNPMScope = "@golid"
const oldDomain = "golid.ai"

func main() {
	newName, newModule, newDomain, strict, starterCopyHint := parseArgs()
	if newName == "" {
		fmt.Fprintf(os.Stderr, "Usage: go run ./cmd/rename <new-name> <new-module-path> [new-domain] [--strict] [--starter-copy-hint]\n")
		fmt.Fprintf(os.Stderr, "  e.g. go run ./cmd/rename myapp github.com/myuser/myapp/backend myapp.com\n")
		os.Exit(1)
	}

	if err := validateProjectName(newName); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %s\n", err)
		os.Exit(1)
	}
	if err := validateDomain(newDomain); err != nil {
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
	//    Covers internal/wire/, internal/service/* subpackages, and all other backend Go code.
	goFiles := findFiles(root+"backend/", ".go")
	for _, f := range goFiles {
		if strings.HasSuffix(f, "cmd/rename/main.go") {
			continue
		}
		changed += replaceInFile(f, oldModule, newModule)
		changed += replaceInFile(f, oldTitled, newTitled)
		changed += replaceInFileSafe(f, oldProjectName, newName)
	}

	// 3. Update docker-compose.yml
	changed += replaceInFileSafe(root+"docker-compose.yml", oldProjectName, newName)

	// 4. Update frontend package.json and package-lock.json (npm scope + name)
	newScope := "@" + newName
	changed += replaceInFile(root+"frontend/package.json", oldNPMScope, newScope)
	changed += replaceInFile(root+"frontend/package-lock.json", oldNPMScope, newScope)

	// 5. Update README (title, badge URLs, GitHub references, tree paths)
	changed += replaceInFile(root+"README.md", oldGitHubRepo, newGitHubRepo)
	changed += replaceInFile(root+"README.md", oldTitled, newTitled)
	changed += replaceInFileSafe(root+"README.md", oldProjectName, newName)

	// 6. Update Cursor rules (may reference module path in examples)
	mdcFiles := findFiles(root+".cursor/rules/", ".mdc")
	for _, f := range mdcFiles {
		changed += replaceInFile(f, oldModule, newModule)
		changed += replaceInFile(f, oldTitled, newTitled)
		changed += replaceInFileSafe(f, oldProjectName, newName)
	}

	// 7. Update docs (reference project name and module path)
	docFiles := findFiles(root+"docs/", ".md")
	for _, f := range docFiles {
		changed += replaceInFile(f, oldModule, newModule)
		changed += replaceInFileSafe(f, oldProjectName, newName)
		if !isHistoricalDoc(f) {
			changed += replaceInFile(f, oldTitled, newTitled)
		}
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

	// 8c. Update frontend tests (e2e + unit — same branding as src)
	for _, ext := range []string{".tsx", ".ts"} {
		testFiles := findFiles(root+"frontend/tests/", ext)
		for _, f := range testFiles {
			changed += replaceInFile(f, oldTitled, newTitled)
			changed += replaceInFileSafe(f, oldProjectName, newName)
			changed += replaceInFile(f, oldUpper, newUpper)
		}
	}

	// 9. Update root-level community files (SECURITY, CHANGELOG, CONTRIBUTING)
	for _, f := range []string{"SECURITY.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md"} {
		changed += replaceInFile(root+f, oldGitHubRepo, newGitHubRepo)
		changed += replaceInFile(root+f, oldTitled, newTitled)
		changed += replaceInFileSafe(root+f, oldProjectName, newName)
	}
	// CHANGELOG: module + lowercase only — preserve historical release titles
	changed += replaceInFile(root+"CHANGELOG.md", oldGitHubRepo, newGitHubRepo)
	changed += replaceInFileSafe(root+"CHANGELOG.md", oldProjectName, newName)

	// 9b. Update GitHub issue templates
	issueTemplates := findFiles(root+".github/ISSUE_TEMPLATE/", ".md")
	for _, f := range issueTemplates {
		changed += replaceInFile(f, oldGitHubRepo, newGitHubRepo)
		changed += replaceInFile(f, oldTitled, newTitled)
		changed += replaceInFileSafe(f, oldProjectName, newName)
	}

	// 10. Update CI/coverage config (GitHub repo references)
	changed += replaceInFile(root+"codecov.yml", oldModule, newModule)

	// 11. Update environment config files (APP_NAME, DB_USER)
	for _, envFile := range findEnvFiles(root + "config/") {
		changed += replaceInFile(envFile, oldTitled, newTitled)
		changed += replaceInFileSafe(envFile, oldProjectName, newName)
		changed += replaceInFile(envFile, oldUpper, newUpper)
	}
	if _, err := os.Stat(root + "config/.env.local"); os.IsNotExist(err) {
		fmt.Println("  Note: config/.env.local not found — copy from .env.example and set APP_NAME/DB_NAME if you use local env")
	}

	// 12. Update deploy/teardown scripts and scripts README
	changed += replaceInFileSafe(root+"scripts/deploy.sh", oldProjectName, newName)
	changed += replaceInFileSafe(root+"scripts/teardown.sh", oldProjectName, newName)
	changed += replaceInFileSafe(root+"scripts/init-test-db.sh", oldProjectName, newName)
	changed += replaceInFileSafe(root+"scripts/setup-domain.sh", oldProjectName, newName)
	changed += replaceInFile(root+"scripts/setup-domain.sh", oldTitled, newTitled)
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
		changed += replaceInFile(f, oldTitled, newTitled)
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

	// 20. v0.3.0 paths — docker-compose overlay, dev tooling, CI scripts.
	//     internal/wire/ is covered by step 2 (all backend .go files).
	changed += replaceInFileSafe(root+"docker-compose.ci-e2e.yml", oldProjectName, newName)
	for _, f := range []string{
		".nvmrc",
		"frontend/dev-watch.mjs",
		".vscode/start-frontend-dev.sh",
		"scripts/check_spec_drift.sh",
		"scripts/check_citation_freshness.sh",
	} {
		changed += replaceInFileSafe(root+f, oldProjectName, newName)
		changed += replaceInFile(root+f, oldTitled, newTitled)
	}

	changed += replaceDomain(root, newName, newDomain)
	changed += renamePublicAssets(root, newName)

	fmt.Printf("\n=== Rename complete: %d files updated ===\n", changed)
	fmt.Printf("  Module:  %s -> %s\n", oldModule, newModule)
	fmt.Printf("  Project: %s -> %s\n", oldProjectName, newName)
	fmt.Printf("  GitHub:  %s -> %s\n", oldGitHubRepo, newGitHubRepo)
	if newDomain != "" {
		fmt.Printf("  Domain:  %s -> %s\n", oldDomain, newDomain)
	}

	survivors := reportSurvivors(root)
	if starterCopyHint {
		printStarterCopyHints(root)
	}
	printPostRenameChecklist(newName, newDomain)

	if strict && len(survivors) > 0 {
		fmt.Fprintf(os.Stderr, "\nStrict mode: %d survivor(s) remain — fix before commit.\n", len(survivors))
		os.Exit(1)
	}
}

func parseArgs() (name, module, domain string, strict, starterCopyHint bool) {
	for _, arg := range os.Args[1:] {
		switch arg {
		case "--strict":
			strict = true
		case "--starter-copy-hint":
			starterCopyHint = true
		default:
			if strings.HasPrefix(arg, "-") {
				fmt.Fprintf(os.Stderr, "Error: unknown flag %q\n", arg)
				return "", "", "", false, false
			}
			switch {
			case name == "":
				name = arg
			case module == "":
				module = arg
			case domain == "":
				domain = arg
			default:
				fmt.Fprintf(os.Stderr, "Error: unexpected argument %q\n", arg)
				return "", "", "", false, false
			}
		}
	}
	return name, module, domain, strict, starterCopyHint
}

func renamePublicAssets(root, newName string) int {
	var changed int
	for _, pair := range []struct{ old, new string }{
		{"golid-og.png", newName + "-og.png"},
		{"meta.png", newName + "-meta.png"},
	} {
		oldPath := filepath.Join(root, "frontend/public/images", pair.old)
		newPath := filepath.Join(root, "frontend/public/images", pair.new)
		if _, err := os.Stat(oldPath); err != nil {
			continue
		}
		if err := os.Rename(oldPath, newPath); err != nil {
			fmt.Fprintf(os.Stderr, "  Warning: could not rename %s: %v\n", pair.old, err)
			continue
		}
		fmt.Printf("  Renamed asset: %s -> %s\n", pair.old, pair.new)
		changed++
	}
	if _, err := os.Stat(filepath.Join(root, "frontend/public/images/favicon-light/favicon.svg")); err == nil {
		fmt.Println("  Note: replace favicon SVG/ICO artwork manually (binary assets)")
	}
	return changed
}

func reportSurvivors(root string) []string {
	var hits []string
	_ = filepath.Walk(root, func(path string, info os.FileInfo, err error) error { //nolint:errcheck
		if err != nil {
			return nil
		}
		if info.IsDir() {
			base := info.Name()
			if base == "node_modules" || base == ".git" {
				return filepath.SkipDir
			}
			return nil
		}
		if !shouldScanSurvivor(path, root) {
			return nil
		}
		if hit := scanFileForSurvivor(path); hit != "" {
			hits = append(hits, hit)
		}
		return nil
	})

	if len(hits) > 0 {
		fmt.Println("\n=== Survivor report (case-insensitive 'golid') ===")
		for _, h := range hits {
			fmt.Println(" ", h)
		}
	} else {
		fmt.Println("\n=== Survivor report: no hits in scanned paths ===")
	}
	return hits
}

func shouldScanSurvivor(path, root string) bool {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		rel = path
	}
	rel = filepath.ToSlash(rel)
	if strings.Contains(rel, "node_modules/") || strings.Contains(rel, ".git/") {
		return false
	}
	if strings.HasPrefix(rel, "backend/cmd/rename/") {
		return false
	}
	if strings.HasPrefix(rel, ".cursor/rules/rename-tool.mdc") {
		return false
	}
	if strings.HasPrefix(rel, "docs/plans/") || strings.HasPrefix(rel, "docs/decisions/") {
		return false
	}
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".go", ".md", ".mdc", ".tsx", ".ts", ".yaml", ".yml", ".json", ".sh", ".css", ".js", ".mjs", ".cjs", ".env", ".example", ".prod", ".qa", ".local", ".html", ".svg", ".txt":
		return true
	default:
		if strings.Contains(filepath.Base(path), ".env.") {
			return true
		}
		return false
	}
}

func scanFileForSurvivor(path string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	if !strings.Contains(strings.ToLower(string(data)), "golid") {
		return ""
	}
	return path
}

func printStarterCopyHints(root string) {
	files := []string{
		root + "frontend/src/entry-server.tsx",
		root + "frontend/src/lib/og-meta.tsx",
		root + "frontend/src/routes/(public)/index.tsx",
		root + "frontend/tests/e2e/auth.spec.ts",
	}
	fmt.Println("\n=== Starter copy (manual rewrite recommended) ===")
	for _, f := range files {
		if _, err := os.Stat(f); err == nil {
			fmt.Printf("  - %s\n", strings.TrimPrefix(f, root))
		}
	}
}

func printPostRenameChecklist(newName, newDomain string) {
	fmt.Println("\nNext steps:")
	fmt.Println("  1. Review the changes: git diff")
	fmt.Println("  2. Verify build:       cd backend && go build ./...")
	fmt.Println("  3. Verify frontend:    cd frontend && npm run typecheck && npm run build")
	fmt.Println("  4. Replace OG/favicon artwork under frontend/public/images/ if still Golid-branded")
	if newDomain == "" {
		fmt.Println("  5. Pass production domain: go run ./cmd/rename ... [your-domain] or edit og-meta / entry-server fallbacks")
	} else {
		fmt.Printf("  5. Set config/.env.prod:\n")
		fmt.Printf("       FRONTEND_URL=https://%s\n", newDomain)
		fmt.Printf("       ALLOWED_ORIGINS=https://%s\n", newDomain)
		fmt.Printf("       VITE_OG_URL=https://%s\n", newDomain)
		fmt.Printf("       GCP_PROJECT_ID=<your-gcp-project>\n")
	}
	fmt.Println("  6. Rewrite homepage/marketing copy (entry-server, og-meta, landing page, e2e headings)")
	fmt.Println("  7. First prod deploy: ./scripts/deploy.sh check prod  then  ./scripts/deploy.sh prod")
	fmt.Println("  8. Update LICENSE copyright if needed")
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

func isHistoricalDoc(path string) bool {
	return strings.Contains(path, "docs/decisions/") || strings.Contains(path, "docs/plans/archive/")
}

func findEnvFiles(dir string) []string {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	var files []string
	for _, e := range entries {
		name := e.Name()
		if strings.HasPrefix(name, ".env.") {
			files = append(files, filepath.Join(dir, name))
		}
	}
	return files
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
var validDomain = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$`)

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

func validateDomain(domain string) error {
	if domain == "" {
		return nil
	}
	if strings.Contains(domain, "://") {
		return fmt.Errorf("domain must not include a scheme (use %q not %q)", "example.com", domain)
	}
	if !validDomain.MatchString(domain) {
		return fmt.Errorf("domain %q is not a valid hostname", domain)
	}
	return nil
}

func replaceDomain(root, newName, newDomain string) int {
	if newDomain == "" {
		return 0
	}

	oldHTTPS := "https://" + oldDomain
	newHTTPS := "https://" + newDomain

	var paths []string
	paths = append(paths,
		root+"frontend/src/lib/og-meta.tsx",
		root+"frontend/src/entry-server.tsx",
		root+"frontend/src/lib/chunk-recovery.test.ts",
		root+"scripts/setup-domain.sh",
		root+"README.md",
	)
	for _, envFile := range findEnvFiles(root + "config/") {
		paths = append(paths, envFile)
	}
	mdcFiles := findFiles(root+".cursor/rules/", ".mdc")
	paths = append(paths, mdcFiles...)
	for _, ext := range []string{".tsx", ".ts"} {
		paths = append(paths, findFiles(root+"frontend/src/", ext)...)
		paths = append(paths, findFiles(root+"frontend/tests/", ext)...)
	}

	seen := make(map[string]struct{}, len(paths))
	var changed int
	for _, path := range paths {
		if _, ok := seen[path]; ok {
			continue
		}
		seen[path] = struct{}{}
		changed += replaceInFile(path, oldHTTPS, newHTTPS)
		changed += replaceInFile(path, oldDomain, newDomain)
	}

	guessHTTPS := "https://" + newName + ".com"
	if guessHTTPS != newHTTPS &&
		(fileContains(root+"frontend/src/lib/og-meta.tsx", guessHTTPS) ||
			fileContains(root+"frontend/src/entry-server.tsx", guessHTTPS)) {
		fmt.Printf("  Note: found %s — verify TLD matches your domain %q\n", guessHTTPS, newDomain)
	}

	return changed
}

func fileContains(path, substr string) bool {
	data, err := os.ReadFile(path)
	if err != nil {
		return false
	}
	return strings.Contains(string(data), substr)
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
