// Package testutil provides utilities for integration testing.
// It sets up a test database connection and provides helpers for test setup/teardown.
package testutil

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TestDB holds a connection to the test database.
type TestDB struct {
	Pool *pgxpool.Pool
}

// SetupTestDB creates a connection to the test database.
// It uses the DATABASE_URL environment variable or defaults to the local Docker database.
//
// Usage:
//
//	func TestMain(m *testing.M) {
//	    testDB := testutil.SetupTestDB()
//	    defer testDB.Close()
//	    os.Exit(m.Run())
//	}
func SetupTestDB() *TestDB {
	ctx := context.Background()

	// Get database URL from environment or use default
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	if dbURL == "" {
		// Default to local Docker database
		dbURL = "postgres://dev:dev@localhost:5432/golid?sslmode=disable"
	}

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		panic(fmt.Sprintf("failed to parse database URL: %v", err))
	}

	// Configure pool for testing
	config.MaxConns = 5
	config.MinConns = 1
	config.MaxConnLifetime = 5 * time.Minute
	config.MaxConnIdleTime = 1 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		panic(fmt.Sprintf("failed to create pool: %v", err))
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		panic(fmt.Sprintf("failed to ping database: %v", err))
	}

	return &TestDB{Pool: pool}
}

// Close closes the database connection pool.
func (db *TestDB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

// CleanTables truncates the specified tables.
// Use this to reset state between tests.
func (db *TestDB) CleanTables(ctx context.Context, tables ...string) error {
	for _, table := range tables {
		_, err := db.Pool.Exec(ctx, fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		if err != nil {
			return fmt.Errorf("truncate %s: %w", table, err)
		}
	}
	return nil
}

// CleanAllTables truncates all application tables.
func (db *TestDB) CleanAllTables(ctx context.Context) error {
	// Order matters due to foreign key constraints
	tables := []string{
		"refresh_tokens",
		"feature_flags",
		"users",
	}
	return db.CleanTables(ctx, tables...)
}

// SkipIfNoTestDB skips the test if the test database is not available.
func SkipIfNoTestDB(t *testing.T) {
	t.Helper()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	if dbURL == "" {
		dbURL = "postgres://dev:dev@localhost:5432/golid?sslmode=disable"
	}

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		t.Skipf("Skipping integration test: database not available: %v", err)
		return
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		t.Skipf("Skipping integration test: database not reachable: %v", err)
	}
}

// WithTestDB is a helper that sets up a test database connection for a single test.
// It cleans up the tables after the test completes.
//
// Usage:
//
//	func TestMyFeature(t *testing.T) {
//	    testutil.WithTestDB(t, func(pool *pgxpool.Pool) {
//	        // Run your test with the database
//	    })
//	}
func WithTestDB(t *testing.T, fn func(pool *pgxpool.Pool)) {
	t.Helper()
	SkipIfNoTestDB(t)

	ctx := context.Background()
	db := SetupTestDB()
	defer db.Close()

	// Clean before test
	if err := db.CleanAllTables(ctx); err != nil {
		t.Fatalf("failed to clean tables: %v", err)
	}

	// Run test
	fn(db.Pool)

	// Clean after test
	if err := db.CleanAllTables(ctx); err != nil {
		t.Errorf("failed to clean tables after test: %v", err)
	}
}
