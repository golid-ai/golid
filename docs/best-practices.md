# Best Practices

> Codebase-specific rules for the Golid repo. Every rule references a real pattern or a real bug. No aspirational rules -- if the pattern isn't established yet, it doesn't go in until it is.

This is NOT a language tutorial. For general patterns, see the [1-page summaries](./patterns/) or official docs for [Go](https://go.dev/doc/effective_go), [SolidJS](https://www.solidjs.com/docs/latest), [PostgreSQL](https://www.postgresql.org/docs/16/).

---

## Backend (Go / PostgreSQL)

### Always use parameterized queries

Never interpolate values into SQL with `fmt.Sprintf`. Even if the value comes from a prior DB lookup, the pattern itself is dangerous and violates the discipline of the rest of the codebase.

```go
// BAD — SQL injection via string interpolation
filter = fmt.Sprintf("user_id = '%s'", userID)

// GOOD — parameterized placeholder
filter = fmt.Sprintf("user_id = $%d", argIdx)
args = append(args, userID)
argIdx++
```

Reference: parameterized query pattern across service layer

---

### Wrap multi-write operations in transactions

Any operation that performs more than one write must use `pool.Begin` / `defer tx.Rollback` / `tx.Commit`. If any step fails, the whole thing rolls back.

```go
// GOOD — all writes in a single transaction
tx, err := s.pool.Begin(ctx)
if err != nil {
    return nil, apperror.Internal(fmt.Errorf("begin tx: %w", err))
}
defer tx.Rollback(ctx)

// ... all queries use tx, not s.pool ...

if err := tx.Commit(ctx); err != nil {
    return nil, apperror.Internal(fmt.Errorf("commit tx: %w", err))
}
```

Established pattern across the service layer for any multi-write operation.

---

### Never discard errors silently

No `_ = fn()` for operations that can fail. At minimum, log the error with `logger.Error`.

```go
// BAD — error silently discarded
_, _ = s.pool.Exec(ctx, `INSERT INTO audit_log ...`, ...)

// GOOD — error logged
if _, err := s.pool.Exec(ctx, `INSERT INTO audit_log ...`, ...); err != nil {
    logger.Error("failed to write audit log",
        slog.String("entity_id", entityID),
        slog.String("error", err.Error()),
    )
}
```

Reference: error handling pattern across the service layer

---

### Fire-and-forget must still be observable

Goroutine-wrapped calls (like email sending) are a legitimate pattern. But failures must be logged so they're visible in production monitoring.

```go
// BAD — fire-and-forget with no error capture
go h.emailService.SendVerificationEmail(req.Email, token)

// GOOD — goroutine with logging wrapper
go func() {
    if err := h.emailService.SendVerificationEmail(req.Email, token); err != nil {
        logger.Error("failed to send verification email",
            slog.String("email", req.Email),
            slog.String("error", err.Error()),
        )
    }
}()
```

Reference: [backend/internal/handler/auth.go](../backend/internal/handler/auth.go) registration flow

---

### Always check DB errors before ErrNoRows

When doing lookups that might not find a row, distinguish real DB errors (return 500) from "not found" (return 404 or try the next branch). Discarding the error with `_ =` masks connection failures as auth errors.

```go
// BAD — real DB errors masked as "not found"
_ = s.pool.QueryRow(ctx, "SELECT user_id FROM items WHERE id = $1", id).Scan(&uid)
if uid == userID { ... } // silently falls through on connection error

// GOOD — check error, only ignore ErrNoRows
err := s.pool.QueryRow(ctx, "SELECT user_id FROM items WHERE id = $1", id).Scan(&uid)
if err != nil && err != pgx.ErrNoRows {
    return nil, apperror.Internal(fmt.Errorf("get item: %w", err))
}
if uid == userID { ... }
```

Reference: error-before-ErrNoRows pattern across the service layer

---

### Validate resource membership, not just role

Checking `userType == "admin"` confirms the role but not whether that specific user owns the resource. Every operation on a scoped resource must verify the user is the owner.

```go
// BAD — any admin can modify any item
if userType != "admin" {
    return apperror.Forbidden("Only admins can modify")
}

// GOOD — verify this user owns this specific resource
err := s.pool.QueryRow(ctx,
    "SELECT id FROM items WHERE id = $1 AND user_id = $2", itemID, userID,
).Scan(&id)
if errors.Is(err, pgx.ErrNoRows) {
    return apperror.NotFound("Item not found")
}
```

Reference: resource ownership verification pattern in the service layer

---

### Check parent entity status before mutations

Before modifying a child entity, verify the parent is in a valid state. For example, reject comment updates on a closed thread, or item modifications on an archived project.

```go
// GOOD — guard at the top of Update/Delete
var parentStatus string
err := s.pool.QueryRow(ctx,
    "SELECT status FROM projects WHERE id = $1", input.ProjectID,
).Scan(&parentStatus)
if parentStatus != "active" {
    return apperror.BadRequest("Can only modify items in active projects")
}
```

Reference: parent entity status guard pattern in the service layer

---

### Use `apperror` for all error responses

Never use `echo.NewHTTPError`. The `apperror` package produces consistent structured responses: `{"code":"FORBIDDEN","message":"..."}`.

```go
// BAD — inconsistent error format
return echo.NewHTTPError(http.StatusForbidden, "not allowed")

// GOOD — structured error
return apperror.Forbidden("not allowed")
```

Available constructors: `BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, `Validation`, `RateLimited`, `Internal`. See [backend/internal/apperror/](../backend/internal/apperror/).

---

## Frontend (SolidJS / SolidStart)

### Use `onMount` + signals for all page data — avoid `createResource`

Golid uses `onMount` + `createSignal` + `alive` guard + `batch` for **all** page-level data fetching. This avoids two `createResource` pitfalls:

1. **Route transitions**: `createResource` writes to its signal when the promise resolves — if the user navigated away, the write fires into a disposed tree ("computations outside createRoot" warning). The `alive` guard prevents this.
2. **Conditional components**: `createResource` inside tabs/modals/accordions triggers the route-level `<Suspense>` boundary and blanks the entire page on remount.

```tsx
// STANDARD PATTERN — used on all pages
const [data, setData] = createSignal<MyType | null>(null);
const [loading, setLoading] = createSignal(true);
const [error, setError] = createSignal("");

let alive = true;
onCleanup(() => {
  alive = false;
});

const fetchData = async () => {
  setLoading(true);
  setError("");
  try {
    const result = await myApi.list();
    if (!alive) return;
    batch(() => {
      setData(result);
      setLoading(false);
    });
  } catch (err) {
    if (!alive) return;
    batch(() => {
      setError(getErrorMessage(err));
      setLoading(false);
    });
  }
};

onMount(() => {
  fetchData();
});
```

> **Note:** `createAsync` + `query` from `@solidjs/router` is the official SolidJS recommendation going forward (heading into Solid 2.0). Golid may adopt this in a future refactor. See [SolidJS docs on createAsync](https://docs.solidjs.com/reference/basic-reactivity/create-async).

Reference: Dashboard, Settings pages. See also [SolidJS docs on resources](https://docs.solidjs.com/reference/basic-reactivity/create-resource).

---

### No reactive expressions inside `<Title>`

The `@solidjs/meta` `<Title>` component creates an internal computation to track its children. During route transitions, this computation is re-evaluated outside the component's reactive root, causing the "computations created outside createRoot" warning.

```tsx
// BAD — reactive ternary leaks during route transition
<Title>{userType() === "admin" ? "Admin" : "Dashboard"} | My App</Title>;

// GOOD — pre-compute as a memo, pass resolved string
const pageTitle = createMemo(
  () => `${userType() === "admin" ? "Admin" : "Dashboard"} | My App`,
);
<Title>{pageTitle()}</Title>;
```

Static strings like `<Title>Dashboard | My App</Title>` are fine — no reactive computation involved.

Reference: page title pattern across route components

---

### Add new private routes to `PRIVATE_ROUTES`

The SSR middleware uses this list for auth redirects. Missing entries mean unauthenticated users hit API errors instead of being cleanly redirected to login.

When adding a new protected page, always update [frontend/src/lib/constants.ts](../frontend/src/lib/constants.ts).

Reference: SSR auth redirect pattern in [frontend/src/middleware.ts](../frontend/src/middleware.ts)

---

### Use the `alive` guard for async operations

Prevents orphaned computation warnings when a user navigates away before an `await` resolves.

```tsx
let alive = true;
onCleanup(() => {
  alive = false;
});

onMount(async () => {
  const result = await fetchData();
  if (!alive) return; // component was unmounted — discard silently
  setData(result);
});
```

Established pattern across all pages with async data fetching.

---

### Signal-driven modals, not route-based

For detail views within a list page, use a signal to control the modal rather than navigating to a sub-route.

```tsx
const [activeItem, setActiveItem] = createSignal<Item | null>(null);
// When activeItem() is not null, the modal opens. On close, setActiveItem(null).
```

Reference: signal-driven modal pattern for detail views within list pages

---

### Use `DestructiveModal` for all destructive actions

Never use `window.confirm()`. Use the `DestructiveModal` component for consistent UX and styling.

```tsx
// BAD
if (!confirm("Are you sure?")) return;

// GOOD
<DestructiveModal
  open={!!deleteTarget()}
  onOpenChange={(open) => {
    if (!open) setDeleteTarget(null);
  }}
  onConfirm={handleDelete}
  title="Delete item?"
  message="This will permanently remove the item."
  confirmText="Delete"
/>;
```

Component: [frontend/src/components/molecules/Modal/DestructiveModal.tsx](../frontend/src/components/molecules/Modal/DestructiveModal.tsx)

---

### Consistent section card styling

Follow the `Section` component pattern from the settings page for bordered content sections. Reference the existing component rather than hardcoding class strings in new files.

Reference: `Section` function in [frontend/src/routes/(private)/settings/index.tsx](../frontend/src/routes/%28private%29/settings/index.tsx)

---

## Security

### Validate resource ownership, not just authentication

`requireUserID` (in the handler layer) confirms **who** the user is. Ownership checks (in the service layer) confirm **what they can touch**. Both layers are required.

```
Handler: requireUserID(c)       → "this is user X"  (authentication)
Service: WHERE user_id = $1     → "user X owns this resource"  (authorization)
```

Role checks alone are not sufficient. The user must be the _specific_ owner of _this specific_ resource.

Reference: the two-layer auth pattern across handler and service layers

---

## Database / Migrations

### Idempotent status transitions

Use `WHERE` guards on status transitions so repeated operations succeed without error.

```sql
-- GOOD — no-op if already in_progress (handles duplicate requests)
UPDATE items SET status = 'in_progress' WHERE id = $1 AND status = 'open';
```

Reference: idempotent status transition pattern in the service layer

---

### Always write a down migration

Drop in reverse dependency order: columns before tables before enums.

```sql
-- 000NNN_notes.down.sql
DROP TRIGGER IF EXISTS set_notes_updated_at ON notes;
DROP TABLE IF EXISTS notes;
```

Reference: down migration pattern in `backend/migrations/`

---

### Use JSONB for structured audit data

Store structured diffs alongside human-readable text. This enables rich UI display ("Changed status from X to Y") without string parsing.

```sql
-- audit_log has both:
action   TEXT    -- "Status changed to Complete" (for display)
metadata JSONB   -- {"field":"status","old":"open","new":"complete"} (for logic)
```

Reference: JSONB audit pattern for structured change tracking

---

## Testing

### Service-layer integration tests

Use `//go:build integration` + `testutil.WithTestDB`. These tests run against a real PostgreSQL instance and test actual SQL.

Reference: integration test pattern in `backend/internal/service/`

### Pure logic unit tests

Validation helpers, parsing functions, and other pure logic go in the same `_test.go` file without the build tag. These run on every `go test`.

Reference: unit test pattern in `backend/internal/service/` and `backend/internal/validate/`

### Seed test data with raw SQL

Use raw `INSERT` statements to set up test state, not service methods. Service methods have their own validation and side effects — tests should control the exact DB state.

```go
// GOOD — direct inserts give the test full control over DB state
var userID string
pool.QueryRow(ctx,
    `INSERT INTO users (email, password_hash, type) VALUES ($1, 'hash', 'user') RETURNING id`,
    "test@example.com",
).Scan(&userID)

var itemID string
pool.QueryRow(ctx,
    `INSERT INTO items (user_id, title, content) VALUES ($1, $2, 'Test content') RETURNING id`,
    userID, "Test Item",
).Scan(&itemID)
```

Reference: test seed helpers in integration test files

---

## Maintenance

This doc grows organically. Every time a bug is fixed that was a pattern violation, add the rule here with a bad/good example and a reference to the fix. Only codify what is actually established in the codebase.
