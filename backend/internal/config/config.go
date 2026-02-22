package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds all application configuration.
// Values are loaded from environment variables with sensible defaults.
type Config struct {
	// Server
	Port        string
	Environment string // "development", "staging", "production"

	// Database
	DatabaseURL string

	// JWT
	JWTSecret          string
	JWTAccessDuration  time.Duration
	JWTRefreshDuration time.Duration

	// Rate Limiting
	RateLimitRequests     int           // requests per window (general API)
	RateLimitWindow       time.Duration // window duration
	AuthRateLimitRequests int           // auth endpoint requests per minute (login, register, etc.)

	// CORS
	AllowedOrigins []string

	// Application
	AppName string // Used in emails, branding (default: "Golid")

	// Redis (optional — enables job queue + persistent rate limiting)
	RedisURL string

	// Observability (optional)
	OTELEndpoint    string  // empty = no tracing
	OTELServiceName string  // default: "golid-api"
	OTELSampleRatio float64 // 0.0-1.0, default 1.0 (all requests). Use 0.1 for production.
	MetricsEnabled  bool    // false = no /metrics endpoint

	// HTTP
	RequestTimeout time.Duration
	CSPPolicy      string // Content-Security-Policy header value

	// Pagination
	PaginationDefault int           // default per_page (default: 20)
	PaginationMax     int           // max per_page (default: 100)

	// Feature Flags
	FeatureCacheTTL time.Duration

	// Email (Mailgun)
	MailgunAPIKey    string
	MailgunDomain    string
	MailgunBaseURL   string
	DevEmailOverride string
	FrontendURL      string

	// Database Pool
	DBMaxConns int32
	DBMinConns int32

	// Worker
	WorkerConcurrency int

	// Password Reset
	PasswordResetTTL time.Duration

	// Operational Tuning
	ShutdownTimeout      time.Duration
	EmailTimeout         time.Duration
	SSETicketTTL         time.Duration
	SSEKeepaliveInterval time.Duration
	RetryAttempts        int
	RetryDelay           time.Duration
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		Environment:        getEnv("ENVIRONMENT", "development"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		JWTAccessDuration:  getDuration("JWT_ACCESS_DURATION", 15*time.Minute),
		JWTRefreshDuration: getDuration("JWT_REFRESH_DURATION", 7*24*time.Hour),
		RateLimitRequests:     getInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:      getDuration("RATE_LIMIT_WINDOW", time.Minute),
		AuthRateLimitRequests: getInt("AUTH_RATE_LIMIT", 5),
		RequestTimeout:    getDuration("REQUEST_TIMEOUT", 30*time.Second),
		// Default CSP allows 'unsafe-inline' for scripts/styles because the SPA inlines
		// critical CSS and some libraries inject script tags. Override via CSP_POLICY env
		// var in production for stricter policies (nonce-based, etc).
		CSPPolicy:         getEnv("CSP_POLICY", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.googleapis.com https://storage.googleapis.com; connect-src 'self' https://*.mailgun.org"),
		PaginationDefault: getInt("PAGINATION_DEFAULT", 20),
		PaginationMax:     getInt("PAGINATION_MAX", 100),
		FeatureCacheTTL:    getDuration("FEATURE_CACHE_TTL", 30*time.Second),
		AppName:            getEnv("APP_NAME", "Golid"),
		RedisURL:           os.Getenv("REDIS_URL"),
		OTELEndpoint:       os.Getenv("OTEL_ENDPOINT"),
		OTELServiceName:    getEnv("OTEL_SERVICE_NAME", "golid-api"),
		OTELSampleRatio:    getFloat("OTEL_SAMPLE_RATIO", 1.0),
		MetricsEnabled:     os.Getenv("METRICS_ENABLED") == "true",
		AllowedOrigins:     getAllowedOrigins(),
		DBMaxConns:        int32(getInt("DB_MAX_CONNS", 10)),
		DBMinConns:        int32(getInt("DB_MIN_CONNS", 2)),
		WorkerConcurrency: getInt("WORKER_CONCURRENCY", 5),
		MailgunAPIKey:      os.Getenv("MAILGUN_API_KEY"),
		MailgunDomain:      os.Getenv("MAILGUN_DOMAIN"),
		MailgunBaseURL:     getEnv("MAILGUN_BASE_URL", "https://api.mailgun.net"),
		DevEmailOverride:   os.Getenv("DEV_EMAIL_OVERRIDE"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:3000"),
		PasswordResetTTL:     getDuration("PASSWORD_RESET_TTL", 1*time.Hour),
		ShutdownTimeout:      getDuration("SHUTDOWN_TIMEOUT", 10*time.Second),
		EmailTimeout:         getDuration("EMAIL_TIMEOUT", 30*time.Second),
		SSETicketTTL:         getDuration("SSE_TICKET_TTL", 30*time.Second),
		SSEKeepaliveInterval: getDuration("SSE_KEEPALIVE_INTERVAL", 30*time.Second),
		RetryAttempts:        getInt("RETRY_ATTEMPTS", 3),
		RetryDelay:           getDuration("RETRY_DELAY", time.Second),
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	if len(c.JWTSecret) < 32 {
		return fmt.Errorf("JWT_SECRET must be at least 32 characters")
	}
	if strings.HasPrefix(c.JWTSecret, "CHANGE_ME") {
		return fmt.Errorf("JWT_SECRET contains the placeholder value — generate a real secret with: openssl rand -hex 32")
	}
	return nil
}

// IsDevelopment returns true if running in development mode.
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// IsProduction returns true if running in production mode.
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return fallback
}

func getDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return fallback
}

func getFloat(key string, fallback float64) float64 {
	if value := os.Getenv(key); value != "" {
		if f, err := strconv.ParseFloat(value, 64); err == nil {
			return f
		}
	}
	return fallback
}

func getAllowedOrigins() []string {
	env := getEnv("ENVIRONMENT", "development")
	if env == "development" {
		return []string{"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"}
	}
	if origins := os.Getenv("ALLOWED_ORIGINS"); origins != "" {
		var result []string
		for _, o := range strings.Split(origins, ",") {
			if trimmed := strings.TrimSpace(o); trimmed != "" {
				result = append(result, trimmed)
			}
		}
		return result
	}
	return []string{}
}
