package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestParsePagination(t *testing.T) {
	defaultPerPage := 20
	maxPerPage := 100

	tests := []struct {
		name       string
		query      string
		wantPage   int
		wantPerPg  int
	}{
		{"defaults when empty", "", 1, 20},
		{"valid values", "?page=3&per_page=50", 3, 50},
		{"page=0 defaults to 1", "?page=0", 1, 20},
		{"negative page defaults to 1", "?page=-5", 1, 20},
		{"per_page=0 defaults to 20", "?per_page=0", 1, 20},
		{"per_page over 100 defaults to 20", "?per_page=200", 1, 20},
		{"per_page=100 is allowed", "?per_page=100", 1, 100},
		{"per_page=1 is allowed", "?per_page=1", 1, 1},
		{"non-numeric page defaults", "?page=abc", 1, 20},
		{"non-numeric per_page defaults", "?per_page=xyz", 1, 20},
		{"page=1 per_page=10", "?page=1&per_page=10", 1, 10},
		{"negative per_page defaults to 20", "?per_page=-1", 1, 20},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/"+tt.query, nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			page, perPage := ParsePagination(c, defaultPerPage, maxPerPage)
			if page != tt.wantPage {
				t.Errorf("page = %d, want %d", page, tt.wantPage)
			}
			if perPage != tt.wantPerPg {
				t.Errorf("perPage = %d, want %d", perPage, tt.wantPerPg)
			}
		})
	}
}
