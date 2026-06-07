#!/usr/bin/env bash
set -euo pipefail

: "${TEST_DATABASE_URL:=postgres://dev:dev@localhost:5432/golid_test?sslmode=disable}"

_db_url="${TEST_DATABASE_URL%%\?*}"
DB_NAME="${_db_url##*/}"
if [[ ! "$DB_NAME" =~ ^[a-zA-Z0-9_]+$ ]]; then
  echo "Invalid database name in TEST_DATABASE_URL: $DB_NAME" >&2
  exit 1
fi

psql "${TEST_DATABASE_URL%/*}/postgres" -c \
  "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
psql "${TEST_DATABASE_URL%/*}/postgres" -c "CREATE DATABASE \"${DB_NAME}\";"
