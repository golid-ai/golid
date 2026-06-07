// Package wire collects every constructor call the API process makes at
// startup. Splitting service construction, handler construction, and
// route registration out of cmd/server/main.go keeps main.go focused on
// process lifecycle (config → DB → background goroutines → server start
// → shutdown order) and removes main.go as the single largest source of
// merge conflicts on parallel feature work.
//
// The split is intentionally three thin functions, not a DI framework.
// Layout:
//
//   - services.go: BuildServices(ctx, cfg, pool) → *Services
//   - handlers.go: BuildHandlers(svcs, cfg, jobQueue) → *Handlers
//   - routes.go:   RegisterRoutes(e, h, svcs, cfg, jwtMW)
//
// Context ownership: the ctx passed into BuildServices is the bootstrap
// context constructed in main.go. wire/* never invents or wraps it; it
// only forwards it to constructors that need a long-lived ctx. Per-request
// handlers continue to use c.Request().Context() from Echo, never the
// bootstrap ctx.
//
// JWT middleware ownership: main.go constructs middleware.JWTAuth with
// the configured secret and passes the resulting echo.MiddlewareFunc to
// RegisterRoutes; wire/* never reads cfg.JWTSecret directly.
package wire
