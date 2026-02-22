// Package main implements the module scaffolding tool.
// Usage: go run ./cmd/scaffold <module_name>
// Example: go run ./cmd/scaffold notes
//          go run ./cmd/scaffold blog_posts
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"text/template"
	"unicode"
)

type Module struct {
	Plural      string // table name: "notes", "blog_posts"
	Singular    string // "note", "blog_post"
	Pascal      string // "Note", "BlogPost"
	PascalPlur  string // "Notes", "BlogPosts"
	Camel       string // "note", "blogPost"
	MigrationNo string // "000004"
	ModulePath  string // "github.com/.../backend"
}

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "Usage: go run ./cmd/scaffold <module_name>\n")
		fmt.Fprintf(os.Stderr, "  e.g. go run ./cmd/scaffold notes\n")
		fmt.Fprintf(os.Stderr, "  e.g. go run ./cmd/scaffold blog_posts\n")
		os.Exit(1)
	}

	raw := strings.ToLower(strings.ReplaceAll(os.Args[1], "-", "_"))
	singular := singularize(raw)
	plural := raw

	mod := Module{
		Plural:      plural,
		Singular:    singular,
		Pascal:      toPascal(singular),
		PascalPlur:  toPascal(plural),
		Camel:       toCamel(toPascal(singular)),
		MigrationNo: nextMigration(),
		ModulePath:  readModulePath(),
	}

	fmt.Printf("=== Scaffolding module: %s ===\n", mod.Plural)
	fmt.Printf("  Table:      %s\n", mod.Plural)
	fmt.Printf("  Singular:   %s\n", mod.Singular)
	fmt.Printf("  PascalCase: %s\n", mod.Pascal)
	fmt.Printf("  Migration:  %s\n\n", mod.MigrationNo)

	root := repoRoot()
	writeTemplate(root+"backend/migrations/"+mod.MigrationNo+"_"+mod.Plural+".up.sql", migrationUp, mod)
	writeTemplate(root+"backend/migrations/"+mod.MigrationNo+"_"+mod.Plural+".down.sql", migrationDown, mod)
	writeTemplate(root+"backend/internal/service/"+mod.Singular+".go", serviceTemplate, mod)
	writeTemplate(root+"backend/internal/handler/"+mod.Singular+".go", handlerTemplate, mod)
	writeTemplate(root+"backend/internal/handler/"+mod.Singular+"_test.go", handlerTestTemplate, mod)
	appendInterface(root+"backend/internal/handler/interfaces.go", mod)

	frontendDir := root + "frontend/src/routes/(private)/" + mod.Plural
	if err := os.MkdirAll(frontendDir, 0o755); err != nil {
		fmt.Fprintf(os.Stderr, "Error creating directory %s: %v\n", frontendDir, err)
		os.Exit(1)
	}
	writeFrontend(frontendDir+"/index.tsx", mod)

	fmt.Println("\n=== Files created. Now wire it up: ===")
	printWiring(mod)
}

func writeFrontend(path string, mod Module) {
	content := frontendTemplate
	content = strings.ReplaceAll(content, "PASCAL_PLURAL", mod.PascalPlur)
	content = strings.ReplaceAll(content, "PASCAL", mod.Pascal)
	content = strings.ReplaceAll(content, "PLURAL", mod.Plural)
	content = strings.ReplaceAll(content, "SINGULAR", mod.Singular)
	content = strings.ReplaceAll(content, "CAMEL", mod.Camel)
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		fmt.Fprintf(os.Stderr, "Error creating %s: %v\n", path, err)
		os.Exit(1)
	}
	fmt.Printf("  Created: %s\n", path)
}

func writeTemplate(path, tmplStr string, mod Module) {
	t := template.Must(template.New("").Delims("[[", "]]").Parse(tmplStr))
	f, err := os.Create(path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error creating %s: %v\n", path, err)
		os.Exit(1)
	}
	defer f.Close() //nolint:errcheck // best-effort close
	if err := t.Execute(f, mod); err != nil {
		fmt.Fprintf(os.Stderr, "Error writing %s: %v\n", path, err)
		os.Exit(1)
	}
	fmt.Printf("  Created: %s\n", path)
}

func singularize(s string) string {
	if strings.HasSuffix(s, "ies") && len(s) > 3 {
		return s[:len(s)-3] + "y"
	}
	if strings.HasSuffix(s, "ses") || strings.HasSuffix(s, "xes") || strings.HasSuffix(s, "zes") {
		return s[:len(s)-2]
	}
	if strings.HasSuffix(s, "us") || strings.HasSuffix(s, "is") || strings.HasSuffix(s, "as") || strings.HasSuffix(s, "ss") {
		return s
	}
	if strings.HasSuffix(s, "s") {
		return s[:len(s)-1]
	}
	return s
}

func toPascal(s string) string {
	parts := strings.Split(s, "_")
	for i, p := range parts {
		if len(p) > 0 {
			parts[i] = strings.ToUpper(p[:1]) + p[1:]
		}
	}
	return strings.Join(parts, "")
}

func toCamel(s string) string {
	if len(s) == 0 {
		return s
	}
	r := []rune(s)
	r[0] = unicode.ToLower(r[0])
	return string(r)
}

// repoRoot returns "" if cwd is repo root (backend/ dir exists), or "../" if cwd is backend/
func repoRoot() string {
	if _, err := os.Stat("backend/go.mod"); err == nil {
		return ""
	}
	if _, err := os.Stat("go.mod"); err == nil {
		return "../"
	}
	return ""
}

func nextMigration() string {
	root := repoRoot()
	entries, err := filepath.Glob(root + "backend/migrations/*.up.sql")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Warning: could not glob migrations: %v\n", err)
		return "000001"
	}
	if len(entries) == 0 {
		return "000001"
	}
	sort.Strings(entries)
	last := filepath.Base(entries[len(entries)-1])
	numStr := strings.Split(last, "_")[0]
	var num int
	if _, err := fmt.Sscanf(numStr, "%d", &num); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: could not parse migration number %q: %v\n", numStr, err)
		return "000001"
	}
	return fmt.Sprintf("%06d", num+1)
}

func readModulePath() string {
	// Try backend/go.mod (run from repo root) then go.mod (run from backend/)
	for _, path := range []string{"backend/go.mod", "go.mod"} {
		data, err := os.ReadFile(path)
		if err == nil {
			line := strings.Split(string(data), "\n")[0]
			return strings.TrimPrefix(line, "module ")
		}
	}
	fmt.Fprintf(os.Stderr, "Error: could not find go.mod. Run from repo root or backend/ directory.\n")
	os.Exit(1)
	return ""
}

func appendInterface(path string, mod Module) {
	t := template.Must(template.New("").Delims("[[", "]]").Parse(interfaceTemplate))
	var buf strings.Builder
	if err := t.Execute(&buf, mod); err != nil {
		fmt.Fprintf(os.Stderr, "Error generating interface: %v\n", err)
		os.Exit(1)
	}
	f, err := os.OpenFile(path, os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error opening %s: %v\n", path, err)
		os.Exit(1)
	}
	defer f.Close() //nolint:errcheck // best-effort close
	if _, err := f.WriteString(buf.String()); err != nil {
		fmt.Fprintf(os.Stderr, "Error appending to %s: %v\n", path, err)
		os.Exit(1)
	}
	fmt.Printf("  Updated: %s (added %sServicer interface)\n", path, mod.Camel)
}

func printWiring(m Module) {
	fmt.Printf(`
1. Add to backend/cmd/server/main.go:

   // Services
   %[1]sService := service.New%[2]sService(pool, cfg.PaginationDefault, cfg.PaginationMax)

   // Handlers
   %[1]sHandler := handler.New%[2]sHandler(%[1]sService, cfg.PaginationDefault, cfg.PaginationMax)

   // Routes (in the protected group)
   protected.POST("/%[3]s", %[1]sHandler.Create)
   protected.GET("/%[3]s", %[1]sHandler.List)
   protected.GET("/%[3]s/:id", %[1]sHandler.GetByID)
   protected.PUT("/%[3]s/:id", %[1]sHandler.Update)
   protected.DELETE("/%[3]s/:id", %[1]sHandler.Delete)

2. Add to frontend/src/lib/api.ts:

   export interface %[2]s {
     id: string;
     title: string;
     content: string;
     created_at: string;
     updated_at: string;
   }

   export interface %[2]sListResult {
     %[3]s: %[2]s[];
     total: number;
     page: number;
     per_page: number;
     total_pages: number;
   }

   export const %[1]ssApi = {
     create: (data: { title: string; content: string }) =>
       post<%[2]s>("/%[3]s", data),
     list: (page = 1, perPage = 20, search = "") =>
       get<%[2]sListResult>(` + "`" + `/%[3]s?page=${page}&per_page=${perPage}${search ? ` + "`" + `&search=${encodeURIComponent(search)}` + "`" + ` : ""}` + "`" + `),
     getById: (id: string) =>
       get<%[2]s>(` + "`" + `/%[3]s/${id}` + "`" + `),
     update: (id: string, data: { title: string; content: string }) =>
       put<%[2]s>(` + "`" + `/%[3]s/${id}` + "`" + `, data),
     delete: (id: string) =>
       del<{ message: string }>(` + "`" + `/%[3]s/${id}` + "`" + `),
   };

3. Add to frontend/src/lib/constants.ts PRIVATE_ROUTES:
   "/%[3]s"

4. Add to Sidebar.tsx navItems (if you want it in the nav):
   { label: "%[2]s", href: "/%[3]s", icon: "note" }

5. Run migration:
   migrate -path backend/migrations -database "$DATABASE_URL" up

6. Verify:
   cd backend && go build ./...
   cd frontend && npm run build

=== Done! See docs/example-module.md for the full pattern reference. ===
`, m.Camel, m.Pascal, m.Plural)
}

// ============================================================================
// TEMPLATES
// ============================================================================

var migrationUp = `CREATE TABLE [[.Plural]] (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_[[.Plural]]_user_id ON [[.Plural]](user_id);
CREATE TRIGGER set_[[.Plural]]_updated_at
    BEFORE UPDATE ON [[.Plural]]
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`

var migrationDown = `DROP TRIGGER IF EXISTS set_[[.Plural]]_updated_at ON [[.Plural]];
DROP TABLE IF EXISTS [[.Plural]];
`

var serviceTemplate = `package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"[[.ModulePath]]/internal/apperror"
)

type [[.Pascal]]Service struct {
	pool              *pgxpool.Pool
	paginationDefault int
	paginationMax     int
}

func New[[.Pascal]]Service(pool *pgxpool.Pool, paginationDefault, paginationMax int) *[[.Pascal]]Service {
	return &[[.Pascal]]Service{pool: pool, paginationDefault: paginationDefault, paginationMax: paginationMax}
}

type Create[[.Pascal]]Input struct {
	UserID  string
	Title   string
	Content string
}

type Update[[.Pascal]]Input struct {
	[[.Pascal]]ID string
	UserID       string
	Title        string
	Content      string
}

type [[.Pascal]]Detail struct {
	ID        string ` + "`" + `json:"id"` + "`" + `
	Title     string ` + "`" + `json:"title"` + "`" + `
	Content   string ` + "`" + `json:"content"` + "`" + `
	CreatedAt string ` + "`" + `json:"created_at"` + "`" + `
	UpdatedAt string ` + "`" + `json:"updated_at"` + "`" + `
}

type [[.Pascal]]ListResult struct {
	[[.PascalPlur]] [][[.Pascal]]Detail ` + "`" + `json:"[[.Plural]]"` + "`" + `
	Total           int                ` + "`" + `json:"total"` + "`" + `
	Page            int                ` + "`" + `json:"page"` + "`" + `
	PerPage         int                ` + "`" + `json:"per_page"` + "`" + `
	TotalPages      int                ` + "`" + `json:"total_pages"` + "`" + `
}

func (s *[[.Pascal]]Service) Create(ctx context.Context, input *Create[[.Pascal]]Input) (*[[.Pascal]]Detail, error) {
	var item [[.Pascal]]Detail
	var createdAt, updatedAt time.Time

	err := s.pool.QueryRow(ctx,
		` + "`" + `INSERT INTO [[.Plural]] (user_id, title, content)
		 VALUES ($1, $2, $3)
		 RETURNING id, title, content, created_at, updated_at` + "`" + `,
		input.UserID, input.Title, input.Content,
	).Scan(&item.ID, &item.Title, &item.Content, &createdAt, &updatedAt)

	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("create [[.Singular]]: %w", err))
	}

	item.CreatedAt = createdAt.Format(time.RFC3339)
	item.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &item, nil
}

func (s *[[.Pascal]]Service) List(ctx context.Context, userID string, page, perPage int, search string) (*[[.Pascal]]ListResult, error) {
	page, perPage = NormalizePagination(page, perPage, s.paginationDefault, s.paginationMax)
	offset := (page - 1) * perPage

	var total int
	if search != "" {
		err := s.pool.QueryRow(ctx,
			` + "`" + `SELECT COUNT(*) FROM [[.Plural]] WHERE user_id = $1 AND title ILIKE '%' || $2 || '%'` + "`" + `,
			userID, search,
		).Scan(&total)
		if err != nil {
			return nil, apperror.Internal(fmt.Errorf("count [[.Plural]]: %w", err))
		}
	} else {
		err := s.pool.QueryRow(ctx,
			` + "`" + `SELECT COUNT(*) FROM [[.Plural]] WHERE user_id = $1` + "`" + `, userID,
		).Scan(&total)
		if err != nil {
			return nil, apperror.Internal(fmt.Errorf("count [[.Plural]]: %w", err))
		}
	}

	var query string
	var args []any
	if search != "" {
		query = ` + "`" + `SELECT id, title, content, created_at, updated_at
		 FROM [[.Plural]] WHERE user_id = $1 AND title ILIKE '%' || $2 || '%'
		 ORDER BY created_at DESC
		 LIMIT $3 OFFSET $4` + "`" + `
		args = []any{userID, search, perPage, offset}
	} else {
		query = ` + "`" + `SELECT id, title, content, created_at, updated_at
		 FROM [[.Plural]] WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3` + "`" + `
		args = []any{userID, perPage, offset}
	}

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("list [[.Plural]]: %w", err))
	}
	defer rows.Close()

	var items [][[.Pascal]]Detail
	for rows.Next() {
		var item [[.Pascal]]Detail
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.Title, &item.Content, &createdAt, &updatedAt); err != nil {
			return nil, apperror.Internal(fmt.Errorf("scan [[.Singular]]: %w", err))
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.UpdatedAt = updatedAt.Format(time.RFC3339)
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, apperror.Internal(fmt.Errorf("iterate [[.Plural]]: %w", err))
	}

	if items == nil {
		items = [][[.Pascal]]Detail{}
	}

	totalPages := (total + perPage - 1) / perPage
	return &[[.Pascal]]ListResult{
		[[.PascalPlur]]: items,
		Total:           total,
		Page:            page,
		PerPage:         perPage,
		TotalPages:      totalPages,
	}, nil
}

func (s *[[.Pascal]]Service) GetByID(ctx context.Context, [[.Camel]]ID, userID string) (*[[.Pascal]]Detail, error) {
	var item [[.Pascal]]Detail
	var createdAt, updatedAt time.Time

	err := s.pool.QueryRow(ctx,
		` + "`" + `SELECT id, title, content, created_at, updated_at
		 FROM [[.Plural]] WHERE id = $1 AND user_id = $2` + "`" + `,
		[[.Camel]]ID, userID,
	).Scan(&item.ID, &item.Title, &item.Content, &createdAt, &updatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperror.NotFound("[[.Pascal]] not found")
	}
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("get [[.Singular]]: %w", err))
	}

	item.CreatedAt = createdAt.Format(time.RFC3339)
	item.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &item, nil
}

func (s *[[.Pascal]]Service) Update(ctx context.Context, input *Update[[.Pascal]]Input) (*[[.Pascal]]Detail, error) {
	var item [[.Pascal]]Detail
	var createdAt, updatedAt time.Time

	err := s.pool.QueryRow(ctx,
		` + "`" + `UPDATE [[.Plural]] SET title = $1, content = $2
		 WHERE id = $3 AND user_id = $4
		 RETURNING id, title, content, created_at, updated_at` + "`" + `,
		input.Title, input.Content, input.[[.Pascal]]ID, input.UserID,
	).Scan(&item.ID, &item.Title, &item.Content, &createdAt, &updatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperror.NotFound("[[.Pascal]] not found")
	}
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("update [[.Singular]]: %w", err))
	}

	item.CreatedAt = createdAt.Format(time.RFC3339)
	item.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &item, nil
}

func (s *[[.Pascal]]Service) Delete(ctx context.Context, [[.Camel]]ID, userID string) error {
	result, err := s.pool.Exec(ctx,
		` + "`" + `DELETE FROM [[.Plural]] WHERE id = $1 AND user_id = $2` + "`" + `,
		[[.Camel]]ID, userID,
	)
	if err != nil {
		return apperror.Internal(fmt.Errorf("delete [[.Singular]]: %w", err))
	}
	if result.RowsAffected() == 0 {
		return apperror.NotFound("[[.Pascal]] not found")
	}
	return nil
}
`

var handlerTemplate = `package handler

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"[[.ModulePath]]/internal/apperror"
	"[[.ModulePath]]/internal/service"
)

type [[.Pascal]]Handler struct {
	[[.Camel]]Service  [[.Camel]]Servicer
	paginationDefault int
	paginationMax     int
}

func New[[.Pascal]]Handler([[.Camel]]Service *service.[[.Pascal]]Service, paginationDefault, paginationMax int) *[[.Pascal]]Handler {
	return &[[.Pascal]]Handler{[[.Camel]]Service: [[.Camel]]Service, paginationDefault: paginationDefault, paginationMax: paginationMax}
}

type Create[[.Pascal]]Request struct {
	Title   string ` + "`" + `json:"title"` + "`" + `
	Content string ` + "`" + `json:"content"` + "`" + `
}

type Update[[.Pascal]]Request struct {
	Title   string ` + "`" + `json:"title"` + "`" + `
	Content string ` + "`" + `json:"content"` + "`" + `
}

func (h *[[.Pascal]]Handler) Create(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	var req Create[[.Pascal]]Request
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if err := validate[[.Pascal]](req.Title, req.Content); err != nil {
		return err
	}

	item, err := h.[[.Camel]]Service.Create(c.Request().Context(), &service.Create[[.Pascal]]Input{
		UserID:  userID,
		Title:   req.Title,
		Content: req.Content,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *[[.Pascal]]Handler) List(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	page, perPage := ParsePagination(c, h.paginationDefault, h.paginationMax)
	search := strings.TrimSpace(c.QueryParam("search"))

	result, err := h.[[.Camel]]Service.List(c.Request().Context(), userID, page, perPage, search)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, result)
}

func (h *[[.Pascal]]Handler) GetByID(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	item, err := h.[[.Camel]]Service.GetByID(c.Request().Context(), c.Param("id"), userID)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, item)
}

func (h *[[.Pascal]]Handler) Update(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	var req Update[[.Pascal]]Request
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if err := validate[[.Pascal]](req.Title, req.Content); err != nil {
		return err
	}

	item, err := h.[[.Camel]]Service.Update(c.Request().Context(), &service.Update[[.Pascal]]Input{
		[[.Pascal]]ID: c.Param("id"),
		UserID:       userID,
		Title:        req.Title,
		Content:      req.Content,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, item)
}

func (h *[[.Pascal]]Handler) Delete(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	if err := h.[[.Camel]]Service.Delete(c.Request().Context(), c.Param("id"), userID); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "[[.Pascal]] deleted"})
}

func validate[[.Pascal]](title, content string) error {
	details := make(map[string]string)

	title = strings.TrimSpace(title)
	if title == "" {
		details["title"] = "Title is required"
	} else if len(title) > 200 {
		details["title"] = "Title must be 200 characters or fewer"
	}

	if len(content) > 50000 {
		details["content"] = "Content must be 50,000 characters or fewer"
	}

	if len(details) > 0 {
		return apperror.Validation("Validation failed", details)
	}
	return nil
}
`

var interfaceTemplate = `
type [[.Camel]]Servicer interface {
	Create(ctx context.Context, input *service.Create[[.Pascal]]Input) (*service.[[.Pascal]]Detail, error)
	List(ctx context.Context, userID string, page, perPage int, search string) (*service.[[.Pascal]]ListResult, error)
	GetByID(ctx context.Context, [[.Camel]]ID, userID string) (*service.[[.Pascal]]Detail, error)
	Update(ctx context.Context, input *service.Update[[.Pascal]]Input) (*service.[[.Pascal]]Detail, error)
	Delete(ctx context.Context, [[.Camel]]ID, userID string) error
}
`

var handlerTestTemplate = `package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"

	"[[.ModulePath]]/internal/apperror"
	"[[.ModulePath]]/internal/service"
)

type mock[[.Pascal]]Service struct {
	createFn  func(ctx context.Context, input *service.Create[[.Pascal]]Input) (*service.[[.Pascal]]Detail, error)
	listFn    func(ctx context.Context, userID string, page, perPage int, search string) (*service.[[.Pascal]]ListResult, error)
	getByIDFn func(ctx context.Context, [[.Camel]]ID, userID string) (*service.[[.Pascal]]Detail, error)
	updateFn  func(ctx context.Context, input *service.Update[[.Pascal]]Input) (*service.[[.Pascal]]Detail, error)
	deleteFn  func(ctx context.Context, [[.Camel]]ID, userID string) error
}

func (m *mock[[.Pascal]]Service) Create(ctx context.Context, input *service.Create[[.Pascal]]Input) (*service.[[.Pascal]]Detail, error) {
	return m.createFn(ctx, input)
}
func (m *mock[[.Pascal]]Service) List(ctx context.Context, userID string, page, perPage int, search string) (*service.[[.Pascal]]ListResult, error) {
	return m.listFn(ctx, userID, page, perPage, search)
}
func (m *mock[[.Pascal]]Service) GetByID(ctx context.Context, [[.Camel]]ID, userID string) (*service.[[.Pascal]]Detail, error) {
	return m.getByIDFn(ctx, [[.Camel]]ID, userID)
}
func (m *mock[[.Pascal]]Service) Update(ctx context.Context, input *service.Update[[.Pascal]]Input) (*service.[[.Pascal]]Detail, error) {
	return m.updateFn(ctx, input)
}
func (m *mock[[.Pascal]]Service) Delete(ctx context.Context, [[.Camel]]ID, userID string) error {
	return m.deleteFn(ctx, [[.Camel]]ID, userID)
}

func test[[.Pascal]]Detail() *service.[[.Pascal]]Detail {
	return &service.[[.Pascal]]Detail{
		ID:        "test-id",
		Title:     "Test [[.Pascal]]",
		Content:   "Test content",
		CreatedAt: "2024-01-01T00:00:00Z",
		UpdatedAt: "2024-01-01T00:00:00Z",
	}
}

func TestCreate[[.Pascal]]_Success(t *testing.T) {
	mock := &mock[[.Pascal]]Service{
		createFn: func(ctx context.Context, input *service.Create[[.Pascal]]Input) (*service.[[.Pascal]]Detail, error) {
			return test[[.Pascal]]Detail(), nil
		},
	}
	h := &[[.Pascal]]Handler{[[.Camel]]Service: mock, paginationDefault: 20, paginationMax: 100}

	body := ` + "`" + `{"title":"New Item","content":"Some content"}` + "`" + `
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "test-user-id")

	if err := h.Create(c); err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if rec.Code != http.StatusCreated {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusCreated)
	}

	var result service.[[.Pascal]]Detail
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result.Title != "Test [[.Pascal]]" {
		t.Errorf("title = %q, want %q", result.Title, "Test [[.Pascal]]")
	}
}

func TestCreate[[.Pascal]]_ValidationError(t *testing.T) {
	h := &[[.Pascal]]Handler{[[.Camel]]Service: &mock[[.Pascal]]Service{}, paginationDefault: 20, paginationMax: 100}

	body := ` + "`" + `{"title":"","content":""}` + "`" + `
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "test-user-id")

	err := h.Create(c)
	if err == nil {
		t.Fatal("Create() expected validation error for empty title")
	}
	if !apperror.Is(err, apperror.CodeValidation) {
		t.Errorf("expected CodeValidation, got: %v", err)
	}
}

func TestList[[.PascalPlur]]_Success(t *testing.T) {
	mock := &mock[[.Pascal]]Service{
		listFn: func(ctx context.Context, userID string, page, perPage int, search string) (*service.[[.Pascal]]ListResult, error) {
			return &service.[[.Pascal]]ListResult{
				[[.PascalPlur]]: []service.[[.Pascal]]Detail{*test[[.Pascal]]Detail()},
				Total: 1, Page: 1, PerPage: 20, TotalPages: 1,
			}, nil
		},
	}
	h := &[[.Pascal]]Handler{[[.Camel]]Service: mock, paginationDefault: 20, paginationMax: 100}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/?page=1&per_page=20", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "test-user-id")

	if err := h.List(c); err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestGetByID[[.Pascal]]_NotFound(t *testing.T) {
	mock := &mock[[.Pascal]]Service{
		getByIDFn: func(ctx context.Context, [[.Camel]]ID, userID string) (*service.[[.Pascal]]Detail, error) {
			return nil, apperror.NotFound("[[.Pascal]] not found")
		},
	}
	h := &[[.Pascal]]Handler{[[.Camel]]Service: mock, paginationDefault: 20, paginationMax: 100}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "test-user-id")
	c.SetParamNames("id")
	c.SetParamValues("nonexistent-id")

	err := h.GetByID(c)
	if err == nil {
		t.Fatal("GetByID() expected not found error")
	}
	if !apperror.Is(err, apperror.CodeNotFound) {
		t.Errorf("expected CodeNotFound, got: %v", err)
	}
}

func TestDelete[[.Pascal]]_Success(t *testing.T) {
	mock := &mock[[.Pascal]]Service{
		deleteFn: func(ctx context.Context, [[.Camel]]ID, userID string) error {
			return nil
		},
	}
	h := &[[.Pascal]]Handler{[[.Camel]]Service: mock, paginationDefault: 20, paginationMax: 100}

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("user_id", "test-user-id")
	c.SetParamNames("id")
	c.SetParamValues("test-id")

	if err := h.Delete(c); err != nil {
		t.Fatalf("Delete() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}
`

var frontendTemplate = `import { createSignal, onMount, onCleanup, batch, For, Show, createEffect, on } from "solid-js";
import { Switch, Match } from "solid-js";
import { Title } from "@solidjs/meta";
import { Button, Card, Input, Spinner } from "~/components";
import { Pagination, DestructiveModal } from "~/components";
import { CAMELsApi, getErrorMessage } from "~/lib/api";
import type { PASCAL } from "~/lib/api";
import { toast } from "~/lib/stores";

export default function PASCALPage() {
  const [PLURAL, setPASCAL_PLURAL] = createSignal<PASCAL[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");
  const [title, setTitle] = createSignal("");
  const [content, setContent] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [deleteTarget, setDeleteTarget] = createSignal<PASCAL | null>(null);
  const [page, setPage] = createSignal(1);
  const [totalPages, setTotalPages] = createSignal(1);
  const [total, setTotal] = createSignal(0);
  const [search, setSearch] = createSignal("");

  let alive = true;
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => { alive = false; clearTimeout(searchTimer); });

  const fetchItems = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await CAMELsApi.list(page(), 20, search());
      if (!alive) return;
      batch(() => {
        setPASCAL_PLURAL(result.PLURAL);
        setTotalPages(result.total_pages || 1);
        setTotal(result.total || 0);
        setLoading(false);
      });
    } catch (err) {
      if (!alive) return;
      batch(() => {
        setError(getErrorMessage(err, "Failed to load PLURAL"));
        setLoading(false);
      });
    }
  };

  onMount(() => { fetchItems(); });

  createEffect(on(() => page(), () => { fetchItems(); }, { defer: true }));

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      setPage(1);
      fetchItems();
    }, 300);
  };

  const handleCreate = async () => {
    if (!title().trim()) return;
    setSaving(true);
    try {
      await CAMELsApi.create({ title: title(), content: content() });
      if (!alive) return;
      batch(() => {
        setTitle("");
        setContent("");
        setSaving(false);
      });
      toast.success("PASCAL created");
      fetchItems();
    } catch (err) {
      if (!alive) return;
      setSaving(false);
      toast.error(getErrorMessage(err, "Failed to create SINGULAR"));
    }
  };

  const handleDelete = async () => {
    const item = deleteTarget();
    if (!item) return;
    try {
      await CAMELsApi.delete(item.id);
      if (!alive) return;
      setDeleteTarget(null);
      toast.success("PASCAL deleted");
      fetchItems();
    } catch (err) {
      if (!alive) return;
      toast.error(getErrorMessage(err, "Failed to delete SINGULAR"));
    }
  };

  return (
    <div class="p-6 sm:p-10 max-w-[1400px] mx-auto w-full space-y-8">
      <Title>PASCAL_PLURAL | Golid</Title>

      <div>
        <h1 class="text-3xl font-bold font-montserrat text-foreground">PASCAL_PLURAL</h1>
        <p class="text-muted-foreground mt-1">Manage your PLURAL.</p>
      </div>

      <Card class="p-6 space-y-4">
        <Input placeholder="Title" value={title()} onInput={(e) => setTitle(e.currentTarget.value)} />
        <textarea
          class="w-full rounded-lg border border-border bg-background p-3 text-sm min-h-[100px]"
          placeholder="Content (optional)"
          value={content()}
          onInput={(e) => setContent(e.currentTarget.value)}
        />
        <Button onClick={handleCreate} disabled={saving() || !title().trim()}>
          {saving() ? "Creating..." : "Create PASCAL"}
        </Button>
      </Card>

      <Input
        placeholder="Search PLURAL..."
        value={search()}
        onInput={(e) => handleSearch(e.currentTarget.value)}
        leftIcon="search"
      />

      <Switch>
        <Match when={loading()}>
          <div class="flex justify-center py-12"><Spinner size="lg" /></div>
        </Match>
        <Match when={error()}>
          <Card class="p-6 text-center text-danger">{error()}</Card>
        </Match>
        <Match when={PLURAL().length === 0}>
          <Card class="p-6 text-center text-muted-foreground">
            {search() ? "No PLURAL match your search." : "No PLURAL yet. Create your first one above."}
          </Card>
        </Match>
        <Match when={PLURAL().length > 0}>
          <div class="space-y-3">
            <For each={PLURAL()}>
              {(item) => (
                <Card class="p-4 flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <h3 class="font-semibold text-foreground">{item.title}</h3>
                    <Show when={item.content}>
                      <p class="text-sm text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                    </Show>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item)}>Delete</Button>
                </Card>
              )}
            </For>
          </div>
        </Match>
      </Switch>

      <Show when={totalPages() > 1}>
        <Pagination
          page={page()}
          pageSize={20}
          totalItems={total()}
          onPageChange={setPage}
        />
      </Show>

      <DestructiveModal
        open={!!deleteTarget()}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Delete SINGULAR?"
        message={` + "`" + `"${deleteTarget()?.title || ""}" will be permanently deleted.` + "`" + `}
        confirmText="Delete"
      />
    </div>
  );
}
`
