#!/bin/sh
set -e

echo "🚀 Starting golid API..."

# Construct DATABASE_URL if not provided but components are
if [ -z "$DATABASE_URL" ] && [ -n "$DB_USER" ]; then
    echo "📦 Constructing DATABASE_URL from components..."
    
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-golid}"
    
    if [ -n "$CLOUD_SQL_INSTANCE" ]; then
        # Cloud Run: Use Unix socket
        export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${CLOUD_SQL_INSTANCE}"
    else
        # Standard TCP connection
        export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"
    fi
fi

# Run database migrations if migrate tool is available and DATABASE_URL is set
if [ -n "$DATABASE_URL" ] && [ -d "/app/migrations" ]; then
    if command -v migrate >/dev/null 2>&1; then
        echo "🔄 Running database migrations..."
        migrate -path /app/migrations -database "$DATABASE_URL" up || {
            echo "❌ Migration failed — refusing to start with a stale schema"
            exit 1
        }
    else
        echo "ℹ️  Migrate tool not found, skipping migrations"
    fi
fi

# Start the server
echo "✅ Starting server on port ${PORT:-8080}..."
exec ./server
