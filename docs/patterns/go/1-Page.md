# Go — 1-Page

**Thesis**: Simplicity is the ultimate sophistication. Explicit > clever.

**Refrain**: If it's not obvious, make it obvious. If it's repeated, extract it. If it can fail, handle it.

---

### Mental Model

```
EXPLICIT OVER MAGIC
├── No hidden control flow (no exceptions, no DI magic)
├── Error returns force handling
├── Interfaces are implicit (define at consumer, not provider)
└── Concurrency is explicit (goroutines + channels)
```

### The 5 Patterns That Matter

| Pattern | When | Code |
|---------|------|------|
| **Singleton Pool** | DB connections in serverless | `sync.Once` + `pgxpool` |
| **Interface at Consumer** | Testing, mocking | Define small interfaces where used |
| **Wrap Errors** | Debugging | `fmt.Errorf("context: %w", err)` |
| **Context Everywhere** | Timeouts, cancellation | First param, always |
| **Structured Logging** | Production observability | `slog.Info("msg", slog.String("key", val))` |

### Cloud Run Essentials

```go
// Health check (required)
e.GET("/health", func(c echo.Context) error {
    return c.String(200, "ok")
})

// Graceful shutdown (required)
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
e.Shutdown(ctx)
```

### sqlc > ORM

```sql
-- name: GetUser :one
SELECT * FROM users WHERE id = $1;

-- name: CreateUsersBatch :copyfrom
INSERT INTO users (name, email) VALUES ($1, $2);
```

Why: Type-safe, no runtime overhead, SQL is the source of truth.

### Anti-Patterns

| Don't | Why | Do Instead |
|-------|-----|------------|
| `data, _ := fn()` | Silent failures | Always check `err != nil` |
| Naked goroutines | Panics crash app | `defer recover()` or errgroup |
| Global state | Testing nightmare | Pass dependencies |
| Fat interfaces | Hard to mock | Small, focused (1-3 methods) |
| `panic` in libraries | Breaks callers | Return errors |

### Error Handling

```go
// Wrap with context
return fmt.Errorf("get user %s: %w", id, err)

// Check specific errors
if errors.Is(err, sql.ErrNoRows) { return nil }

// Type assertion
var appErr *AppError
if errors.As(err, &appErr) { ... }
```

### Concurrency

```go
// Worker pool (bounded concurrency)
sem := make(chan struct{}, 10)
var wg sync.WaitGroup

for _, item := range items {
    wg.Add(1)
    sem <- struct{}{}
    go func(item Item) {
        defer wg.Done()
        defer func() { <-sem }()
        process(item)
    }(item)
}
wg.Wait()
```

### Project Structure

```
cmd/server/main.go    # Entrypoint
internal/
  api/                # Generated (oapi-codegen)
  handlers/           # HTTP handlers
  service/            # Business logic
  db/                 # sqlc generated
migrations/           # SQL migrations
```

### OpenAPI → End-to-End Type Safety

```bash
# Go server
oapi-codegen -config oapi-codegen.yaml openapi.yaml

# TypeScript client (same spec!)
npx openapi-typescript-codegen --input ./openapi.yaml --output ./frontend/src/lib/api-client
```

Types match at compile time — no manual sync.

### Auth (JWT)

```go
claims := &Claims{
    UserID: userID,
    RegisteredClaims: jwt.RegisteredClaims{
        ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
    },
}
token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
return token.SignedString([]byte(secret))
```

### Quick Commands

```bash
sqlc generate                    # Regenerate DB code
migrate -database $DB up         # Run migrations
oapi-codegen -config cfg.yaml api.yaml  # Regenerate API
go test -cover ./...             # Test with coverage
CGO_ENABLED=0 go build -o app    # Static binary
air                              # Hot reload dev server
```

### When to Use Go vs Other Backends

| Scenario | Go? | Why |
|----------|-----|-----|
| High-throughput APIs | ✅ Yes | Goroutines scale to 100k+ concurrent |
| Cloud Run / serverless | ✅ Yes | 15MB image, 10ms cold start |
| CPU-bound processing | ✅ Yes | Native performance, easy parallelism |
| Quick prototyping | ⚠️ Maybe | More boilerplate than Python/Node |
| Heavy ORM needs | ❌ No | sqlc is great, but no Prisma equivalent |
| Dynamic typing preferred | ❌ No | Go is statically typed |

### Definition of Done

- [ ] `go vet ./...` passes
- [ ] `go test ./...` passes with coverage > 70%
- [ ] `golangci-lint run` clean
- [ ] Health check endpoint exists
- [ ] Graceful shutdown implemented
- [ ] All errors wrapped with context
- [ ] Structured logging in place

---
