package db

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/golid-ai/golid/backend/internal/logger"
)

var (
	pool     *pgxpool.Pool
	poolOnce sync.Once
)

// Config holds database configuration.
type Config struct {
	URL             string
	MaxConns        int32
	MinConns        int32
	MaxConnLifetime time.Duration
	MaxConnIdleTime time.Duration
}

// DefaultConfig returns sensible defaults for Cloud Run.
func DefaultConfig(url string) *Config {
	return &Config{
		URL:             url,
		MaxConns:        10, // Cloud Run instances should keep this low
		MinConns:        2,
		MaxConnLifetime: time.Hour,
		MaxConnIdleTime: 30 * time.Minute,
	}
}

// Init initializes the database connection pool.
func Init(ctx context.Context, cfg *Config) error {
	var initErr error

	poolOnce.Do(func() {
		poolConfig, err := pgxpool.ParseConfig(cfg.URL)
		if err != nil {
			initErr = fmt.Errorf("parse database URL: %w", err)
			return
		}

		// Apply config
		poolConfig.MaxConns = cfg.MaxConns
		poolConfig.MinConns = cfg.MinConns
		poolConfig.MaxConnLifetime = cfg.MaxConnLifetime
		poolConfig.MaxConnIdleTime = cfg.MaxConnIdleTime
		poolConfig.HealthCheckPeriod = 30 * time.Second

		// Create pool
		p, err := pgxpool.NewWithConfig(ctx, poolConfig)
		if err != nil {
			initErr = fmt.Errorf("create pool: %w", err)
			return
		}

		// Test connection
		if err := p.Ping(ctx); err != nil {
			p.Close()
			initErr = fmt.Errorf("ping database: %w", err)
			return
		}

		pool = p
		logger.Info("database connection pool initialized")
	})

	return initErr
}

// Pool returns the database connection pool.
// Panics if Init hasn't been called.
func Pool() *pgxpool.Pool {
	if pool == nil {
		panic("database pool not initialized - call db.Init first")
	}
	return pool
}

// Close closes the database connection pool.
func Close() {
	if pool != nil {
		pool.Close()
		logger.Info("database connection pool closed")
	}
}

// Health checks if the database is reachable.
func Health(ctx context.Context) error {
	if pool == nil {
		return fmt.Errorf("pool not initialized")
	}
	return pool.Ping(ctx)
}
