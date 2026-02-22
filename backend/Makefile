# Golid Backend Makefile

.PHONY: all build dev test test-unit test-integration lint sqlc swagger migrate clean help

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOTEST=$(GOCMD) test
GOMOD=$(GOCMD) mod
BINARY_NAME=server
MAIN_PATH=./cmd/server

# Default target
all: lint test build

# Build the binary
build:
	CGO_ENABLED=0 $(GOBUILD) -ldflags="-s -w" -o bin/$(BINARY_NAME) $(MAIN_PATH)

# Run in development mode with hot reload
dev:
	air -c .air.toml

# Run all tests (unit only by default)
test:
	$(GOTEST) -v -race -cover ./...

# Run unit tests only (excludes integration tests)
test-unit:
	$(GOTEST) -v -race -cover ./...

# Run integration tests (requires database)
test-integration:
	$(GOTEST) -v -race -tags=integration ./...

# Run all tests including integration tests
test-all:
	$(GOTEST) -v -race -tags=integration -cover ./...

# Run tests with coverage report (Unit only)
test-coverage:
	$(GOTEST) -v -race -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out -o coverage.html

# Run ALL tests (Unit + Integration) with coverage report
# This is the one to use for CI and final coverage numbers
test-all-coverage:
	$(GOTEST) -v -race -tags=integration -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out -o coverage.html

# Run integration tests with coverage
test-integration-coverage:
	$(GOTEST) -v -race -tags=integration -coverprofile=coverage-integration.out ./...
	$(GOCMD) tool cover -html=coverage-integration.out -o coverage-integration.html

# Run linter
lint:
	golangci-lint run ./...

# Generate sqlc code
sqlc:
	sqlc generate

# Generate swagger documentation
swagger:
	swag init -g cmd/server/main.go -o docs --parseDependency --parseInternal

# Generate TypeScript types from OpenAPI spec
generate-ts-types:
	@echo "Generating TypeScript types from OpenAPI spec..."
	../scripts/generate-types.sh

# Run database migrations
migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down 1

migrate-create:
	@read -p "Enter migration name: " name; \
	migrate create -ext sql -dir migrations -seq $$name

# Scaffold a new module (migration + service + handler + frontend route)
new-module:
	@if [ -z "$(name)" ]; then echo "Usage: make new-module name=notes"; exit 1; fi
	go run ./cmd/scaffold $(name)

# Tidy dependencies
tidy:
	$(GOMOD) tidy

# Download dependencies
deps:
	$(GOMOD) download

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html

# Install development tools
tools:
	go install github.com/air-verse/air@v1.61.0
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.1
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/swaggo/swag/cmd/swag@latest

# Show help
help:
	@echo "Available targets:"
	@echo "  all                       - Run lint, test, and build"
	@echo "  build                     - Build the binary"
	@echo "  dev                       - Run in development mode with hot reload"
	@echo "  test                      - Run unit tests"
	@echo "  test-unit                 - Run unit tests only"
	@echo "  test-integration          - Run integration tests (requires database)"
	@echo "  test-all                  - Run all tests including integration"
	@echo "  test-coverage             - Run unit tests with coverage report"
	@echo "  test-all-coverage         - Run ALL tests (unit+integration) with coverage report"
	@echo "  test-integration-coverage - Run integration tests with coverage"
	@echo "  lint                      - Run linter"
	@echo "  sqlc                      - Generate sqlc code"
	@echo "  generate-ts-types         - Generate TypeScript types from OpenAPI"
	@echo "  swagger                   - Generate swagger documentation"
	@echo "  migrate-up                - Run all pending migrations"
	@echo "  migrate-down              - Rollback last migration"
	@echo "  migrate-create            - Create a new migration"
	@echo "  tidy                      - Tidy dependencies"
	@echo "  deps                      - Download dependencies"
	@echo "  new-module name=X          - Scaffold a new CRUD module"
	@echo "  clean                     - Clean build artifacts"
	@echo "  tools                     - Install development tools"
	@echo "  help                      - Show this help"
