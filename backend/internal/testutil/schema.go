package testutil

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	// "GOLD" high word + 2: serialize DB-wide extension setup across parallel packages.
	integrationExtensionsLockKey int64 = 0x474F4C4400000002
)

var (
	packageSchemaOnce sync.Once
	packageSchemaName string
	packageSchemaErr  error

	migrationsDirOnce sync.Once
	migrationsDir     string
	migrationsDirErr  error
)

// integrationPackageDir returns the Go package directory name for the calling
// integration test (e.g. "job", "payment", "handler").
func integrationPackageDir() string {
	for skip := 2; skip <= 12; skip++ {
		_, file, _, ok := runtime.Caller(skip)
		if !ok {
			break
		}
		dir := filepath.Base(filepath.Dir(file))
		if dir == "testutil" || dir == "sync" {
			continue
		}
		return dir
	}
	return "unknown"
}

func sanitizeSchemaIdent(s string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(s) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == '-' || r == '.':
			b.WriteRune('_')
		default:
			b.WriteRune('_')
		}
	}
	if b.Len() == 0 {
		return "pkg"
	}
	return b.String()
}

func quoteIdent(name string) string {
	return `"` + strings.ReplaceAll(name, `"`, `""`) + `"`
}

func findMigrationsDir() (string, error) {
	migrationsDirOnce.Do(func() {
		if env := os.Getenv("TEST_MIGRATIONS_PATH"); env != "" {
			abs, err := filepath.Abs(env)
			if err != nil {
				migrationsDirErr = fmt.Errorf("resolve TEST_MIGRATIONS_PATH: %w", err)
				return
			}
			if info, err := os.Stat(abs); err == nil && info.IsDir() {
				migrationsDir = abs
				return
			}
			// Relative paths like backend/migrations resolve from each package's
			// cwd during go test — fall through to file-relative discovery.
		}

		// go test runs each package with cwd = that package's source dir, so
		// relative "migrations" only works by accident. Resolve from this file:
		// backend/internal/testutil/schema.go -> backend/migrations.
		_, file, _, ok := runtime.Caller(0)
		if !ok {
			migrationsDirErr = fmt.Errorf("resolve testutil path for migrations dir")
			return
		}
		candidate := filepath.Join(filepath.Dir(file), "..", "..", "migrations")
		abs, err := filepath.Abs(candidate)
		if err != nil {
			migrationsDirErr = fmt.Errorf("resolve migrations dir: %w", err)
			return
		}
		info, err := os.Stat(abs)
		if err != nil || !info.IsDir() {
			migrationsDirErr = fmt.Errorf("migrations dir not found at %s (set TEST_MIGRATIONS_PATH)", abs)
			return
		}
		migrationsDir = abs
	})
	return migrationsDir, migrationsDirErr
}

func migrateDatabaseURL(baseURL, schema string) (string, error) {
	u, err := url.Parse(baseURL)
	if err != nil {
		return "", fmt.Errorf("parse database URL: %w", err)
	}
	// golang-migrate's pgx/v5 driver registers as "pgx5"; postgres:// selects lib/pq.
	switch u.Scheme {
	case "postgres", "postgresql":
		u.Scheme = "pgx5"
	}
	q := u.Query()
	if schema != "" && schema != "public" {
		q.Set("search_path", schema+",public")
	}
	u.RawQuery = q.Encode()
	return u.String(), nil
}

func migrateSchemaUp(baseURL, schema string) error {
	migrationsDir, err := findMigrationsDir()
	if err != nil {
		return err
	}

	migrateURL, err := migrateDatabaseURL(baseURL, schema)
	if err != nil {
		return err
	}

	sourceURL := "file://" + filepath.ToSlash(migrationsDir)
	m, err := migrate.New(sourceURL, migrateURL)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}
	defer func() {
		if srcErr, dbErr := m.Close(); srcErr != nil || dbErr != nil {
			if err == nil {
				err = fmt.Errorf("close migrator: source=%v db=%v", srcErr, dbErr)
			}
		}
	}()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrate schema %s: %w", schema, err)
	}

	return nil
}

// ensureDatabaseExtensions installs shared extensions into public before any
// per-package migration. With search_path it_<pkg>,public, bare CREATE EXTENSION
// in migrations lands in the package schema; parallel packages then hit IF NOT
// EXISTS while functions like uuid_generate_v4() / gen_random_bytes() are missing.
func ensureDatabaseExtensions(ctx context.Context, pool *pgxpool.Pool) error {
	if _, err := pool.Exec(ctx, "SELECT pg_advisory_lock($1)", integrationExtensionsLockKey); err != nil {
		return fmt.Errorf("acquire extension setup lock: %w", err)
	}
	defer func() {
		_, _ = pool.Exec(ctx, "SELECT pg_advisory_unlock($1)", integrationExtensionsLockKey)
	}()

	// Keep in sync with CREATE EXTENSION in backend/migrations/*.up.sql
	for _, ext := range []string{"uuid-ossp", "pg_trgm", "pgcrypto"} {
		sql := fmt.Sprintf("CREATE EXTENSION IF NOT EXISTS %s SCHEMA public", quoteIdent(ext))
		if _, err := pool.Exec(ctx, sql); err != nil {
			return fmt.Errorf("ensure extension %s in public: %w", ext, err)
		}
	}
	return nil
}

func ensurePackageSchema() (string, error) {
	packageSchemaOnce.Do(func() {
		baseURL := requireTestDatabaseURL()
		ctx := context.Background()

		adminCfg, err := pgxpool.ParseConfig(baseURL)
		if err != nil {
			packageSchemaErr = fmt.Errorf("parse admin database URL: %w", err)
			return
		}
		adminPool, err := pgxpool.NewWithConfig(ctx, adminCfg)
		if err != nil {
			packageSchemaErr = fmt.Errorf("create admin pool: %w", err)
			return
		}
		defer adminPool.Close()

		if err := ensureDatabaseExtensions(ctx, adminPool); err != nil {
			packageSchemaErr = fmt.Errorf("ensure database extensions: %w", err)
			return
		}

		if os.Getenv("TESTUTIL_SHARED_SCHEMA") == "1" {
			packageSchemaName = "public"
			if err := migrateSchemaUp(baseURL, "public"); err != nil {
				packageSchemaErr = fmt.Errorf("migrate public schema: %w", err)
			}
			return
		}

		pkgDir := integrationPackageDir()
		packageSchemaName = fmt.Sprintf("it_%s_%d", sanitizeSchemaIdent(pkgDir), os.Getpid())

		if _, err := adminPool.Exec(ctx, fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", quoteIdent(packageSchemaName))); err != nil {
			packageSchemaErr = fmt.Errorf("create schema %s: %w", packageSchemaName, err)
			return
		}

		if err := migrateSchemaUp(baseURL, packageSchemaName); err != nil {
			packageSchemaErr = fmt.Errorf("migrate schema %s: %w", packageSchemaName, err)
			return
		}
	})

	return packageSchemaName, packageSchemaErr
}

func configurePoolSearchPath(config *pgxpool.Config, schema string) {
	if schema == "" || schema == "public" {
		return
	}
	config.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
		_, err := conn.Exec(ctx, fmt.Sprintf("SET search_path TO %s, public", quoteIdent(schema)))
		return err
	}
}
