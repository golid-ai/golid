package service

import "testing"

func TestNormalizePagination(t *testing.T) {
	defaultPerPage := 20
	maxPerPage := 100

	tests := []struct {
		page, perPage   int
		wantP, wantPP   int
	}{
		{0, 0, 1, 20},
		{-1, 200, 1, 20},
		{5, 10, 5, 10},
		{1, 100, 1, 100},
		{1, 101, 1, 20},
		{1, -5, 1, 20},
		{3, 50, 3, 50},
	}
	for _, tt := range tests {
		p, pp := NormalizePagination(tt.page, tt.perPage, defaultPerPage, maxPerPage)
		if p != tt.wantP || pp != tt.wantPP {
			t.Errorf("NormalizePagination(%d, %d) = (%d, %d), want (%d, %d)",
				tt.page, tt.perPage, p, pp, tt.wantP, tt.wantPP)
		}
	}
}
