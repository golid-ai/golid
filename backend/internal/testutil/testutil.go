// Package testutil provides utilities for integration testing.
// It sets up a test database connection and provides helpers for test setup/teardown.
package testutil

import (
	"context"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// requireTestDatabaseURL resolves the integration test DB URL with a hard
// safety guard: panic if TEST_DATABASE_URL is unset or if the resolved URL's
// database name doesn't contain "test".
//
// Why this matters: integration tests call CleanAllTables, which runs
// TRUNCATE … CASCADE on `users` — wiping every dependent table. If the suite
// ever runs against the dev database (DATABASE_URL → postgres://.../golid)
// because TEST_DATABASE_URL wasn't set, the dev environment is destroyed.
//
// Parallel packages each use an isolated Postgres schema (it_<package>_<pid>)
// migrated via golang-migrate on first pool setup. Set TESTUTIL_SHARED_SCHEMA=1
// to use public instead (serial only; migrations run against public once).
//
// The "test in dbname" convention matches CI's `golid_test` configuration
// (.github/workflows/ci.yml) and docker-compose's `golid_test` service. If a
// CI environment ever uses a non-conforming name, set
// TESTUTIL_ALLOW_NONTEST_DB=1 to opt in (intentionally noisy).
func requireTestDatabaseURL() string {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		panic("TEST_DATABASE_URL is required for integration tests — refusing to fall back " +
			"to DATABASE_URL because CleanAllTables would TRUNCATE the dev DB. " +
			"Set TEST_DATABASE_URL=postgres://dev:dev@localhost:5432/golid_test?sslmode=disable " +
			"(or whatever your test DB is) before running -tags=integration tests.")
	}
	if !strings.Contains(dbURL, "test") && os.Getenv("TESTUTIL_ALLOW_NONTEST_DB") != "1" {
		panic(fmt.Sprintf("TEST_DATABASE_URL %q does not contain 'test' in the dbname — refusing "+
			"to TRUNCATE this DB. Convention: use a database name like 'golid_test'. "+
			"If your CI uses a non-conforming name, set TESTUTIL_ALLOW_NONTEST_DB=1 to bypass.", dbURL))
	}
	return dbURL
}

// TestDB holds a connection to the test database.
type TestDB struct {
	Pool   *pgxpool.Pool
	Schema string
}

// TestPasswordHash is the bcrypt-hash-of-"password" constant used by every
// integration test that inserts a user via raw SQL. Pre-refactor, this
// hash was defined (with different local names: testPasswordHash,
// taskTestPasswordHash, testBcryptHash) inside individual integration
// test files. After the service-subpackage refactor, those constants
// became inaccessible across the new package boundary — consolidated
// here so every integration test imports the single canonical
// definition.
//
// The hash decodes to the plaintext "password" and was selected
// originally for its known-good shape (bcrypt-2a, cost 10).
const TestPasswordHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// SetupTestDB creates a connection to the test database.
// TEST_DATABASE_URL is required and must reference a database whose name
// contains "test" — see requireTestDatabaseURL above for the why.
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

	schema, err := ensurePackageSchema()
	if err != nil {
		panic(fmt.Sprintf("failed to prepare integration schema: %v", err))
	}

	dbURL := requireTestDatabaseURL()

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		panic(fmt.Sprintf("failed to parse database URL: %v", err))
	}

	configurePoolSearchPath(config, schema)

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

	return &TestDB{Pool: pool, Schema: schema}
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
// Unlike SetupTestDB this is a SOFT guard — when TEST_DATABASE_URL is unset
// the test is skipped rather than the suite panicking. The DB-name "test"
// requirement still applies when TEST_DATABASE_URL is set, because the
// catastrophic-TRUNCATE failure mode is the same.
func SkipIfNoTestDB(t *testing.T) {
	t.Helper()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("Skipping integration test: TEST_DATABASE_URL is not set (refusing to fall back to DATABASE_URL — CleanAllTables would wipe the dev DB).")
		return
	}
	if !strings.Contains(dbURL, "test") && os.Getenv("TESTUTIL_ALLOW_NONTEST_DB") != "1" {
		t.Skipf("Skipping integration test: TEST_DATABASE_URL %q does not contain 'test' in the dbname (set TESTUTIL_ALLOW_NONTEST_DB=1 to bypass).", dbURL)
		return
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
