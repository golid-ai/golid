#!/usr/bin/env bash
set -euo pipefail

: "${TEST_DATABASE_URL:=postgres://dev:dev@localhost:5432/golid_test?sslmode=disable}"

psql "${TEST_DATABASE_URL%/*}/postgres" -c \
  "SELECT 1 FROM pg_database WHERE datname = 'golid_test'" | grep -q 1 || \
psql "${TEST_DATABASE_URL%/*}/postgres" -c "CREATE DATABASE golid_test;"
