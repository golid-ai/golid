# Example Module: Notes

> A step-by-step walkthrough for adding a complete CRUD feature to Golid. Follow this to build your first module in ~20 minutes.

None of these files exist in the repo — this is a reference spec. Copy the code, adjust the names, and you have a working module.

---

## Overview

We'll build a "notes" module: authenticated users can create, list, view, update, and delete personal notes. This touches every layer of the stack:

```
Migration → Query → Service → Handler → main.go → API client → Frontend route → Seed data
```

---

## 1. Migration

Create `backend/migrations/000006_notes.up.sql`:

```sql
CREATE TABLE notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE TRIGGER set_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

Create `backend/migrations/000006_notes.down.sql`:

```sql
DROP TRIGGER IF EXISTS set_notes_updated_at ON notes;
DROP TABLE IF EXISTS notes;
```

Run: `migrate -path migrations -database "$DATABASE_URL" up`

---

## 2. Service

Create `backend/internal/service/note.go`:

```go
package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

type NoteService struct {
	pool              *pgxpool.Pool
	paginationDefault int
	paginationMax     int
}

func NewNoteService(pool *pgxpool.Pool, paginationDefault, paginationMax int) *NoteService {
	return &NoteService{pool: pool, paginationDefault: paginationDefault, paginationMax: paginationMax}
}

// Input/output types — defined in the service file, not a separate models file.

type CreateNoteInput struct {
	UserID  string
	Title   string
	Content string
}

type UpdateNoteInput struct {
	NoteID  string
	UserID  string
	Title   string
	Content string
}

type NoteDetail struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type NoteListResult struct {
	Notes      []NoteDetail `json:"notes"`
	Total      int          `json:"total"`
	Page       int          `json:"page"`
	PerPage    int          `json:"per_page"`
	TotalPages int          `json:"total_pages"`
}

// Create inserts a new note.
func (s *NoteService) Create(ctx context.Context, input *CreateNoteInput) (*NoteDetail, error) {
	var note NoteDetail
	var createdAt, updatedAt time.Time

	err := s.pool.QueryRow(ctx,
		`INSERT INTO notes (user_id, title, content)
		 VALUES ($1, $2, $3)
		 RETURNING id, title, content, created_at, updated_at`,
		input.UserID, input.Title, input.Content,
	).Scan(&note.ID, &note.Title, &note.Content, &createdAt, &updatedAt)

	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("create note: %w", err))
	}

	note.CreatedAt = createdAt.Format(time.RFC3339)
	note.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &note, nil
}

// List returns paginated notes for a user.
func (s *NoteService) List(ctx context.Context, userID string, page, perPage int, search string) (*NoteListResult, error) {
	page, perPage = NormalizePagination(page, perPage, s.paginationDefault, s.paginationMax)
	offset := (page - 1) * perPage

	// Count total (with optional search filter)
	var total int
	if search != "" {
		err := s.pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM notes WHERE user_id = $1 AND title ILIKE '%' || $2 || '%'`,
			userID, search,
		).Scan(&total)
		if err != nil {
			return nil, apperror.Internal(fmt.Errorf("count notes: %w", err))
		}
	} else {
		err := s.pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM notes WHERE user_id = $1`, userID,
		).Scan(&total)
		if err != nil {
			return nil, apperror.Internal(fmt.Errorf("count notes: %w", err))
		}
	}

	// Fetch page (with optional search filter)
	var query string
	var args []any
	if search != "" {
		query = `SELECT id, title, content, created_at, updated_at
		 FROM notes WHERE user_id = $1 AND title ILIKE '%' || $2 || '%'
		 ORDER BY created_at DESC
		 LIMIT $3 OFFSET $4`
		args = []any{userID, search, perPage, offset}
	} else {
		query = `SELECT id, title, content, created_at, updated_at
		 FROM notes WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3`
		args = []any{userID, perPage, offset}
	}

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("list notes: %w", err))
	}
	defer rows.Close()

	var notes []NoteDetail
	for rows.Next() {
		var n NoteDetail
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&n.ID, &n.Title, &n.Content, &createdAt, &updatedAt); err != nil {
			return nil, apperror.Internal(fmt.Errorf("scan note: %w", err))
		}
		n.CreatedAt = createdAt.Format(time.RFC3339)
		n.UpdatedAt = updatedAt.Format(time.RFC3339)
		notes = append(notes, n)
	}

	if err := rows.Err(); err != nil {
		return nil, apperror.Internal(fmt.Errorf("iterate notes: %w", err))
	}

	if notes == nil {
		notes = []NoteDetail{}
	}

	totalPages := (total + perPage - 1) / perPage
	return &NoteListResult{
		Notes:      notes,
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
	}, nil
}

// GetByID returns a single note, verifying ownership.
func (s *NoteService) GetByID(ctx context.Context, noteID, userID string) (*NoteDetail, error) {
	var note NoteDetail
	var createdAt, updatedAt time.Time

	err := s.pool.QueryRow(ctx,
		`SELECT id, title, content, created_at, updated_at
		 FROM notes WHERE id = $1 AND user_id = $2`,
		noteID, userID,
	).Scan(&note.ID, &note.Title, &note.Content, &createdAt, &updatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperror.NotFound("Note not found")
	}
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("get note: %w", err))
	}

	note.CreatedAt = createdAt.Format(time.RFC3339)
	note.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &note, nil
}

// Update modifies a note, verifying ownership.
func (s *NoteService) Update(ctx context.Context, input *UpdateNoteInput) (*NoteDetail, error) {
	var note NoteDetail
	var createdAt, updatedAt time.Time

	err := s.pool.QueryRow(ctx,
		`UPDATE notes SET title = $1, content = $2
		 WHERE id = $3 AND user_id = $4
		 RETURNING id, title, content, created_at, updated_at`,
		input.Title, input.Content, input.NoteID, input.UserID,
	).Scan(&note.ID, &note.Title, &note.Content, &createdAt, &updatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperror.NotFound("Note not found")
	}
	if err != nil {
		return nil, apperror.Internal(fmt.Errorf("update note: %w", err))
	}

	note.CreatedAt = createdAt.Format(time.RFC3339)
	note.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &note, nil
}

// Delete removes a note, verifying ownership.
func (s *NoteService) Delete(ctx context.Context, noteID, userID string) error {
	result, err := s.pool.Exec(ctx,
		`DELETE FROM notes WHERE id = $1 AND user_id = $2`,
		noteID, userID,
	)
	if err != nil {
		return apperror.Internal(fmt.Errorf("delete note: %w", err))
	}
	if result.RowsAffected() == 0 {
		return apperror.NotFound("Note not found")
	}
	return nil
}

```

Key patterns used:
- Constructor takes `*pgxpool.Pool` + pagination config
- Input/output structs defined in the same file
- Timestamps scanned as `time.Time`, formatted to RFC3339 strings for JSON
- Ownership verified in every query (`WHERE user_id = $2`)
- `apperror` for all errors, `pgx.ErrNoRows` checked explicitly
- Parameterized queries only (`$1`, `$2`, never `fmt.Sprintf` with values)

---

## 3. Handler

Create `backend/internal/handler/note.go`:

```go
package handler

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
	"github.com/golid-ai/golid/backend/internal/service"
)

type NoteHandler struct {
	noteService       noteServicer
	paginationDefault int
	paginationMax     int
}

func NewNoteHandler(noteService *service.NoteService, paginationDefault, paginationMax int) *NoteHandler {
	return &NoteHandler{noteService: noteService, paginationDefault: paginationDefault, paginationMax: paginationMax}
}

type CreateNoteRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type UpdateNoteRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// Create handles POST /api/v1/notes
func (h *NoteHandler) Create(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	var req CreateNoteRequest
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if err := validateNote(req.Title, req.Content); err != nil {
		return err
	}

	note, err := h.noteService.Create(c.Request().Context(), &service.CreateNoteInput{
		UserID:  userID,
		Title:   req.Title,
		Content: req.Content,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, note)
}

// List handles GET /api/v1/notes
func (h *NoteHandler) List(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	page, perPage := ParsePagination(c, h.paginationDefault, h.paginationMax)
	search := strings.TrimSpace(c.QueryParam("search"))

	result, err := h.noteService.List(c.Request().Context(), userID, page, perPage, search)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, result)
}

// GetByID handles GET /api/v1/notes/:id
func (h *NoteHandler) GetByID(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	note, err := h.noteService.GetByID(c.Request().Context(), c.Param("id"), userID)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, note)
}

// Update handles PUT /api/v1/notes/:id
func (h *NoteHandler) Update(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	var req UpdateNoteRequest
	if err := c.Bind(&req); err != nil {
		return apperror.BadRequest("Invalid request body")
	}

	if err := validateNote(req.Title, req.Content); err != nil {
		return err
	}

	note, err := h.noteService.Update(c.Request().Context(), &service.UpdateNoteInput{
		NoteID:  c.Param("id"),
		UserID:  userID,
		Title:   req.Title,
		Content: req.Content,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, note)
}

// Delete handles DELETE /api/v1/notes/:id
func (h *NoteHandler) Delete(c echo.Context) error {
	userID, err := requireUserID(c)
	if err != nil {
		return err
	}

	if err := h.noteService.Delete(c.Request().Context(), c.Param("id"), userID); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Note deleted"})
}

func validateNote(title, content string) error {
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
```

Key patterns used:
- Thin handler: validate, delegate to service, return JSON
- `requireUserID(c)` at the top of every method
- Request structs with `json` tags in the handler file
- `apperror.Validation` with field-level details map
- `201 Created` for POST, `200 OK` for GET/PUT/DELETE

---

## 4. Wire in main.go

Add these lines to `backend/cmd/server/main.go`:

```go
// In the services block:
noteService := service.NewNoteService(pool, cfg.PaginationDefault, cfg.PaginationMax)

// In the handlers block:
noteHandler := handler.NewNoteHandler(noteService, cfg.PaginationDefault, cfg.PaginationMax)

// In the protected routes block:
protected.POST("/notes", noteHandler.Create)
protected.GET("/notes", noteHandler.List)
protected.GET("/notes/:id", noteHandler.GetByID)
protected.PUT("/notes/:id", noteHandler.Update)
protected.DELETE("/notes/:id", noteHandler.Delete)
```

---

## 5. Frontend API client

Add to `frontend/src/lib/api.ts`:

```typescript
// Types
export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NoteListResult {
  notes: Note[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// API module
export const notesApi = {
  create: (data: { title: string; content: string }) =>
    post<Note>("/notes", data),
  list: (page = 1, perPage = 20, search = "") =>
    get<NoteListResult>(`/notes?page=${page}&per_page=${perPage}${search ? `&search=${encodeURIComponent(search)}` : ""}`),
  getById: (id: string) =>
    get<Note>(`/notes/${id}`),
  update: (id: string, data: { title: string; content: string }) =>
    put<Note>(`/notes/${id}`, data),
  delete: (id: string) =>
    del<{ message: string }>(`/notes/${id}`),
};
```

---

## 6. Frontend route

Create `frontend/src/routes/(private)/notes/index.tsx`:

```tsx
import { createSignal, onMount, onCleanup, batch, For, Show, createEffect, on } from "solid-js";
import { Switch, Match } from "solid-js";
import { Title } from "@solidjs/meta";
import { Button, Card, Input, Spinner } from "~/components";
import { DestructiveModal, Pagination } from "~/components";
import { notesApi, getErrorMessage } from "~/lib/api";
import type { Note } from "~/lib/api";
import { toast } from "~/lib/stores";

export default function NotesPage() {
  const [notes, setNotes] = createSignal<Note[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");
  const [page, setPage] = createSignal(1);
  const [totalPages, setTotalPages] = createSignal(1);
  const [total, setTotal] = createSignal(0);
  const [search, setSearch] = createSignal("");

  // Create form
  const [title, setTitle] = createSignal("");
  const [content, setContent] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = createSignal<Note | null>(null);

  let alive = true;
  onCleanup(() => { alive = false; });

  const fetchNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await notesApi.list(page(), 20, search());
      if (!alive) return;
      batch(() => {
        setNotes(result.notes);
        setTotalPages(result.total_pages);
        setTotal(result.total || 0);
        setLoading(false);
      });
    } catch (err) {
      if (!alive) return;
      batch(() => {
        setError(getErrorMessage(err, "Failed to load notes"));
        setLoading(false);
      });
    }
  };

  onMount(() => { fetchNotes(); });

  createEffect(on(() => page(), () => { fetchNotes(); }, { defer: true }));

  let searchTimer: ReturnType<typeof setTimeout>;
  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      setPage(1);
      fetchNotes();
    }, 300);
  };
  onCleanup(() => clearTimeout(searchTimer));

  const handleCreate = async () => {
    if (!title().trim()) return;
    setSaving(true);
    try {
      await notesApi.create({ title: title(), content: content() });
      if (!alive) return;
      batch(() => {
        setTitle("");
        setContent("");
        setSaving(false);
      });
      toast.success("Note created");
      fetchNotes();
    } catch (err) {
      if (!alive) return;
      setSaving(false);
      toast.error(getErrorMessage(err, "Failed to create note"));
    }
  };

  const handleDelete = async () => {
    const note = deleteTarget();
    if (!note) return;
    try {
      await notesApi.delete(note.id);
      if (!alive) return;
      setDeleteTarget(null);
      toast.success("Note deleted");
      fetchNotes();
    } catch (err) {
      if (!alive) return;
      toast.error(getErrorMessage(err, "Failed to delete note"));
    }
  };

  return (
    <div class="p-6 sm:p-10 max-w-[1400px] mx-auto w-full space-y-8">
      <Title>Notes | Golid</Title>

      <div>
        <h1 class="text-3xl font-bold font-montserrat text-foreground">Notes</h1>
        <p class="text-muted-foreground mt-1">Your personal notes.</p>
      </div>

      {/* Create form */}
      <Card class="p-6 space-y-4">
        <Input
          placeholder="Title"
          value={title()}
          onInput={(e) => setTitle(e.currentTarget.value)}
        />
        <textarea
          class="w-full rounded-lg border border-border bg-background p-3 text-sm min-h-[100px]"
          placeholder="Content (optional)"
          value={content()}
          onInput={(e) => setContent(e.currentTarget.value)}
        />
        <Button onClick={handleCreate} disabled={saving() || !title().trim()}>
          {saving() ? "Creating..." : "Create Note"}
        </Button>
      </Card>

      {/* Search */}
      <Input
        placeholder="Search notes..."
        value={search()}
        onInput={(e) => handleSearch(e.currentTarget.value)}
      />

      {/* Notes list — flat Switch/Match, never nested Show */}
      <Switch>
        <Match when={loading()}>
          <div class="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </Match>
        <Match when={error()}>
          <Card class="p-6 text-center text-danger">{error()}</Card>
        </Match>
        <Match when={notes().length === 0}>
          <Card class="p-6 text-center text-muted-foreground">
            No notes yet. Create your first one above.
          </Card>
        </Match>
        <Match when={notes().length > 0}>
          <div class="space-y-3">
            <For each={notes()}>
              {(note) => (
                <Card class="p-4 flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <h3 class="font-semibold text-foreground">{note.title}</h3>
                    <Show when={note.content}>
                      <p class="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {note.content}
                      </p>
                    </Show>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(note)}
                  >
                    Delete
                  </Button>
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

      {/* Delete confirmation — never window.confirm() */}
      <DestructiveModal
        open={!!deleteTarget()}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Delete note?"
        message={`"${deleteTarget()?.title}" will be permanently deleted.`}
        confirmText="Delete"
      />
    </div>
  );
}
```

Key patterns used:
- `onMount` + `createSignal` + `alive` guard + `batch` (never `createResource`)
- `Switch/Match` for content states (never nested `Show`)
- `DestructiveModal` for delete (never `window.confirm()`)
- Signal-driven modal (`deleteTarget` signal)
- Components from barrel import (`~/components`)
- Page container: `p-6 sm:p-10 max-w-[1400px] mx-auto w-full`

---

## 7. Update constants

Add the route to `frontend/src/lib/constants.ts`:

```typescript
export const PRIVATE_ROUTES = ["/dashboard", "/settings", "/components", "/notes"];
```

Without this, unauthenticated users hitting `/notes` will see an API error instead of being redirected to login.

---

## 8. Seed data

Add to `backend/seeds/dev_seed.sql`:

```sql
-- Notes for the test user
INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000002',
   'Welcome Note',
   'This is your first note. Edit or delete it.',
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000002',
   'Project Ideas',
   'Build a todo app. Try the SSE demo. Deploy to Cloud Run.',
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content;
```

Stable UUIDs (`b0...`) so re-running the seed is idempotent.

---

## Checklist

After following all 8 steps:

- [ ] `cd backend && go build ./...` compiles
- [ ] `cd backend && go test ./...` passes
- [ ] `cd frontend && npm run build` compiles
- [ ] Login → navigate to `/notes` → create, view, delete works
- [ ] Unauthenticated `/notes` redirects to login (PRIVATE_ROUTES)

---

## Next steps

This example covers the basics. For a more complex module, you'd add:

- **Advanced filters** — the scaffold generates basic search; add additional filters (date range, status) using the `argIdx` pattern from `go-service.mdc`
- **Pagination UI** — use the `Pagination` component with the `total_pages` response field
- **Detail modal** — use a signal-driven modal (`activeNote` signal) instead of a sub-route
- **Edit form** — open a modal with pre-filled fields, call `notesApi.update`
- **SSE integration** — broadcast a "note_created" event from the service, show a toast on the frontend
- **Background jobs** — dispatch work via the job queue with goroutine fallback:
  ```go
  if h.queue.IsConfigured() {
      task, err := queue.NewTask("notes:notify", payload)
      if err != nil {
          logger.Error("failed to create task", slog.String("error", err.Error()))
      } else if err := h.queue.Enqueue(task); err != nil {
          logger.Error("failed to enqueue task", slog.String("error", err.Error()))
      }
  } else {
      go func() { /* inline fallback */ }()
  }
  ```
- **Feature flags** — gate new behavior behind a flag:
  ```go
  if s.features.IsEnabled(ctx, "notes_v2") {
      // new logic
  }
  ```
