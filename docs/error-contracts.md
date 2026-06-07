# Error Contracts

> How errors propagate from backend to frontend. The complete chain:
> `apperror` code → HTTP status → JSON response → frontend handling.
>
> Last updated: 2026-06-06

## Error Codes

| apperror Code | String Value | HTTP Status | Response Shape | Frontend Handling |
|---|---|---|---|---|
| `CodeBadRequest` | `BAD_REQUEST` | 400 | `{"code":"BAD_REQUEST","message":"..."}` | `toast.error(message)` |
| `CodeValidation` | `VALIDATION_ERROR` | 400 | `{"code":"VALIDATION_ERROR","message":"...","details":{"field":"error"}}` | Inline field errors via `fieldErrors` signal |
| `CodeUnauthorized` | `UNAUTHORIZED` | 401 | `{"code":"UNAUTHORIZED","message":"..."}` | Auto-refresh token; if refresh fails → clear tokens, dispatch `auth:session-expired` → redirect to login |
| `CodeForbidden` | `FORBIDDEN` | 403 | `{"code":"FORBIDDEN","message":"..."}` | `toast.error(message)` |
| `CodeNotFound` | `NOT_FOUND` | 404 | `{"code":"NOT_FOUND","message":"..."}` | `Switch/Match` error state or `toast.error` |
| `CodeTimeout` | `REQUEST_TIMEOUT` | 408 | `{"code":"REQUEST_TIMEOUT","message":"..."}` | `toast.error(message)` |
| `CodeConflict` | `CONFLICT` | 409 | `{"code":"CONFLICT","message":"..."}` | `toast.error(message)` |
| `CodeRateLimited` | `RATE_LIMITED` | 429 | `{"code":"RATE_LIMITED","message":"Too many requests, please try again later"}` | `toast.error(message)` |
| `CodeInternal` | `INTERNAL_ERROR` | 500 | `{"code":"INTERNAL_ERROR","message":"An internal error occurred"}` | Generic error (real error logged server-side, never leaked) |
| `CodeServiceUnavail` | `SERVICE_UNAVAILABLE` | 503 | `{"code":"SERVICE_UNAVAILABLE","message":"..."}` | `toast.error(message)` |

`CodeServiceUnavail` has no constructor function — it is a constant only. `CodeTimeout` uses the `RequestTimeout(message)` constructor.

## Response Shape

All errors are serialized as the `AppError` struct:

```go
type AppError struct {
    Code    Code              `json:"code"`
    Message string            `json:"message"`
    Details map[string]string `json:"details,omitempty"`
}
```

`Details` is only present for `CodeValidation` errors — a map of field name to error message.

## Error Handler Chain (middleware/stack.go)

The `ErrorHandler` in `middleware/stack.go` handles three cases:

1. **`*apperror.AppError`** — serialized to JSON with its `HTTPStatus`. For `CodeInternal`, the real error is logged and the message is replaced with `"An internal error occurred"`.
2. **`*echo.HTTPError`** — wrapped as `{"code": "HTTP_ERROR", "message": "..."}` with the Echo status code.
3. **Unhandled errors** — logged and returned as 500 `{"code": "INTERNAL_ERROR", "message": "An internal error occurred"}`.

## Display Rules

- **Page load errors** → `Switch/Match` error state with `<Alert>` component
- **Form submission errors** → `toast.error()` for general, inline for field-level (`details`)
- **401** → handled automatically by `api()` — refresh token, retry once, then `auth:session-expired` event
- **500** → generic message to user, full details in server logs (never leak stack traces)
- **Network/HTML errors** → `parseError` detects HTML responses and shows "Unable to reach the server"

## Backend Usage

Use `apperror` constructors — never `echo.NewHTTPError`:

```go
// Validation with field-level details
details := make(map[string]string)
if req.Title == "" { details["title"] = "Title is required" }
if len(details) > 0 {
    return apperror.Validation("Validation failed", details)
}

// Simple errors
return apperror.BadRequest("Invalid request body")
return apperror.NotFound("user")          // → "user not found"
return apperror.Forbidden("Only admins can do this")
return apperror.Unauthorized("")          // → "Authentication required"
return apperror.Conflict("Email already registered")
return apperror.RateLimited()             // fixed message
return apperror.Internal(err)             // real error logged, generic message returned
return apperror.RequestTimeout("Query took too long")
```

Use `apperror.Is(err, apperror.CodeNotFound)` to check error types in service code. Use `apperror.Wrap(err, "context")` to add context without changing the error type.

## Frontend Usage

The `api()` function in `frontend/src/lib/api.ts` throws `ApiError` objects:

```typescript
interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, string>;
}
```

Catch errors in page components using the standard pattern:

```typescript
catch (err) {
  if (!alive) return;
  const apiErr = err as { message?: string; details?: Record<string, string> };
  batch(() => {
    setSaving(false);
    if (apiErr.details) {
      setFieldErrors(apiErr.details);   // inline errors under each input
    } else {
      toast.error(getErrorMessage(err, "Failed to save"));
    }
  });
}
```

Use `isApiError(err)` type guard and `getErrorMessage(err, fallback)` helper for safe error extraction.

### 401 Auto-Refresh Flow

1. `api()` receives 401 response
2. If a refresh token exists and request hasn't been retried → call `/auth/refresh`
3. On success → store new tokens, retry the original request with `_retried: true`
4. On failure → clear tokens, dispatch `window` event `auth:session-expired` → app redirects to `/login`
5. Concurrent 401s share a single refresh promise (deduplication via `isRefreshing` flag)
