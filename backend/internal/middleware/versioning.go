package middleware

import "github.com/labstack/echo/v4"

// APIVersion adds an X-API-Version response header to every request in the group.
func APIVersion(version string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Response().Header().Set("X-API-Version", version)
			return next(c)
		}
	}
}
