# Domain Glossary

> Terms that mean something specific in Golid — not generic web dev vocabulary.
>
> Last updated: 2026-06-07

| Term | Meaning in Golid |
|------|------------------|
| **Selector / verifier** | Security token split: `selector` is the DB lookup key (indexed); `verifier` is the secret compared with constant-time hash. Used for password reset and email verification. Never store plaintext tokens. |
| **`IsConfigured()`** | Opt-in service gate (email, queue, OTEL, metrics). Service is always instantiated; callers check `IsConfigured()`, not `nil`. See ADR-007. |
| **Protected route** | SolidStart `(private)/` layout + `PRIVATE_ROUTES` in `constants.ts`. SSR middleware redirects unauthenticated users before hydration. |
| **Strict rate limiter** | Tighter per-IP bucket on `/auth/*` endpoints (`AUTH_RATE_LIMIT`). Separate from general API rate limiting. |
| **SSE ticket** | One-time token exchanged for an SSE stream. JWT never appears in the EventSource URL. |
| **Feature flag** | DB-backed boolean keyed by string. `IsEnabled()` returns `false` for unknown keys. Not used for authorization. |
| **Module spec** | Current-state truth at `docs/modules/{name}/spec.md`. Plans describe change; specs describe what is shipped. |
| **Slice** | One acceptance criterion implemented end-to-end (handler → service → test → spec/OpenAPI). Unit of review per `slice-and-ship`. |
| **Sweep-up commit** | Narrow exception to atomic commits: shared-file edits from parallel subagents only. See `docs/git-reference.md`. |
| **`TEST_DATABASE_URL`** | Required for `go test -tags=integration`. Must point at a database whose name contains `test`. Per-package schemas prevent cross-package TRUNCATE races. |
| **`user` vs `admin`** | `users.type` enum values. Admin unlocks `/api/v1/admin/*` routes via `RequireRole("admin")`. |
