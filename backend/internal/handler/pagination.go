package handler

import (
	"strconv"

	"github.com/labstack/echo/v4"
)

func ParsePagination(c echo.Context, defaultPerPage, maxPerPage int) (page, perPage int) {
	page, err := strconv.Atoi(c.QueryParam("page"))
	if err != nil || page < 1 {
		page = 1
	}
	perPage, err = strconv.Atoi(c.QueryParam("per_page"))
	if err != nil || perPage < 1 || perPage > maxPerPage {
		perPage = defaultPerPage
	}
	return
}
