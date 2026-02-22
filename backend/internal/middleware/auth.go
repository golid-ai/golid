package middleware

import (
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/golid-ai/golid/backend/internal/apperror"
)

// Claims represents JWT claims.
type Claims struct {
	UserID   string `json:"sub"`
	UserType string `json:"type"` // "user", "admin"
	jwt.RegisteredClaims
}

// JWTAuth returns JWT authentication middleware.
func JWTAuth(secret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return apperror.Unauthorized("Missing authorization header")
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				return apperror.Unauthorized("Invalid authorization header format")
			}

			tokenString := parts[1]

			token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, apperror.Unauthorized("Invalid signing method")
				}
				return []byte(secret), nil
			})

			if err != nil {
				return apperror.Unauthorized("Invalid token")
			}

			claims, ok := token.Claims.(*Claims)
			if !ok || !token.Valid {
				return apperror.Unauthorized("Invalid token claims")
			}

			c.Set("user_id", claims.UserID)
			c.Set("user_type", claims.UserType)

			return next(c)
		}
	}
}

// RequireRole returns middleware that requires a specific user type.
func RequireRole(roles ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			userType, ok := c.Get("user_type").(string)
			if !ok {
				return apperror.Unauthorized("User type not found")
			}

			for _, role := range roles {
				if userType == role {
					return next(c)
				}
			}

			return apperror.Forbidden("Insufficient permissions")
		}
	}
}

// GenerateToken creates a new JWT access token for a user.
func GenerateToken(secret, userID, userType, issuer string, accessDuration time.Duration) (string, error) {
	claims := &Claims{
		UserID:   userID,
		UserType: userType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(accessDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    issuer,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// GenerateRefreshToken creates a new refresh token with a unique ID to prevent
// hash collisions when multiple tokens are generated in the same second.
func GenerateRefreshToken(secret, userID, issuer string, refreshDuration time.Duration) (string, error) {
	claims := &jwt.RegisteredClaims{
		ID:        uuid.New().String(),
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(refreshDuration)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Issuer:    issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ParseToken validates and parses a JWT token.
func ParseToken(secret, tokenString string) (*jwt.RegisteredClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}

	return claims, nil
}
