package middleware

import (
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

type capturedWarn struct {
	msg   string
	attrs map[string]any
}

type testCSRFLogger struct {
	warns []capturedWarn
}

func (l *testCSRFLogger) Warn(msg string, args ...any) {
	warn := capturedWarn{msg: msg, attrs: map[string]any{}}
	for _, arg := range args {
		if attr, ok := arg.(slog.Attr); ok {
			warn.attrs[attr.Key] = attr.Value.Any()
		}
	}
	l.warns = append(l.warns, warn)
}

func assertAppErrorStatus(t *testing.T, err error, want int) {
	t.Helper()
	var appErr *apperror.AppError
	if !errors.As(err, &appErr) {
		t.Fatalf("expected *apperror.AppError, got %T: %v", err, err)
	}
	if appErr.HTTPStatus != want {
		t.Errorf("HTTPStatus = %d, want %d", appErr.HTTPStatus, want)
	}
}

func TestCSRF(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		path       string
		header     string
		enforce    bool
		wantErr    bool
		wantWarns  int
		wantStatus int
	}{
		{
			name:       "GET missing header bypasses",
			method:     http.MethodGet,
			path:       "/api/v1/me",
			enforce:    true,
			wantStatus: http.StatusOK,
		},
		{
			name:       "webhook prefix bypasses",
			method:     http.MethodPost,
			path:       "/api/v1/webhooks/example",
			enforce:    true,
			wantStatus: http.StatusOK,
		},
		{
			name:    "missing header enforce rejects",
			method:  http.MethodPost,
			path:    "/api/v1/auth/login",
			enforce: true,
			wantErr: true,
		},
		{
			name:       "valid header enforce passes",
			method:     http.MethodPost,
			path:       "/api/v1/auth/login",
			header:     "golid-app",
			enforce:    true,
			wantStatus: http.StatusOK,
		},
		{
			name:    "wrong header enforce rejects",
			method:  http.MethodPost,
			path:    "/api/v1/auth/login",
			header:  "other-value",
			enforce: true,
			wantErr: true,
		},
		{
			name:       "missing header monitor logs and passes",
			method:     http.MethodPost,
			path:       "/api/v1/auth/login",
			wantWarns:  1,
			wantStatus: http.StatusOK,
		},
		{
			name:       "valid header monitor passes silently",
			method:     http.MethodPost,
			path:       "/api/v1/auth/login",
			header:     "GOLID-APP",
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			log := &testCSRFLogger{}
			e := echo.New()
			req := httptest.NewRequest(tt.method, tt.path, nil)
			if tt.header != "" {
				req.Header.Set("X-Requested-With", tt.header)
			}
			req.Header.Set(echo.HeaderXForwardedFor, "203.0.113.9")
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			c.SetPath(tt.path)
			c.Set("user_id", "user-123")

			handler := CSRF(tt.enforce, log)(func(c echo.Context) error {
				return c.String(http.StatusOK, "ok")
			})

			err := handler(c)
			if tt.wantErr {
				assertAppErrorStatus(t, err, http.StatusForbidden)
			} else if err != nil {
				t.Fatalf("CSRF() error = %v", err)
			}
			if !tt.wantErr && rec.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			if len(log.warns) != tt.wantWarns {
				t.Fatalf("warn count = %d, want %d: %#v", len(log.warns), tt.wantWarns, log.warns)
			}
			if tt.wantWarns == 1 {
				warn := log.warns[0]
				if warn.attrs["route"] != tt.path {
					t.Errorf("logged route = %v, want %s", warn.attrs["route"], tt.path)
				}
				if warn.attrs["method"] != tt.method {
					t.Errorf("logged method = %v, want %s", warn.attrs["method"], tt.method)
				}
				if warn.attrs["caller_ip"] != "203.0.113.9" {
					t.Errorf("logged caller_ip = %v, want 203.0.113.9", warn.attrs["caller_ip"])
				}
				if warn.attrs["user_id"] != "user-123" {
					t.Errorf("logged user_id = %v, want user-123", warn.attrs["user_id"])
				}
			}
		})
	}
}
