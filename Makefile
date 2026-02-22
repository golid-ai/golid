.PHONY: help setup dev test test-backend test-frontend lint lint-backend lint-frontend build build-backend build-frontend check new-module verify-scaffold rename migrate-up migrate-down seed benchmark clean
.DEFAULT_GOAL := help

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Copy .env.example, generate JWT secret, install frontend deps
	@cp config/.env.example config/.env.local
	@JWT=$$(openssl rand -hex 32) && \
		perl -pi -e "s/CHANGE_ME_64_CHAR_HEX_STRING_AT_LEAST_32_CHARS/$$JWT/" config/.env.local
	@echo "✓ config/.env.local created with secure JWT secret"
	@cd frontend && npm install
	@echo "✓ frontend dependencies installed"

dev: ## Start DB + backend with Docker Compose
	@test -f config/.env.local || $(MAKE) setup
	docker compose up

test: test-backend test-frontend ## Run all tests (backend + frontend)

test-backend: ## Run backend Go tests with race detector
	cd backend && go test -race ./...

test-frontend: ## Run frontend Vitest tests
	cd frontend && npm run test:run

lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Run golangci-lint on backend
	cd backend && golangci-lint run ./...

lint-frontend: ## Run ESLint + typecheck on frontend
	cd frontend && npm run lint && npm run typecheck

build: build-backend build-frontend ## Build both backend and frontend

build-backend: ## Build Go backend
	cd backend && go build -p 4 ./...

build-frontend: ## Build SolidStart frontend
	cd frontend && npm run build

check: lint test build ## Run lint + test + build (full CI check)

new-module: ## Generate a new CRUD module (usage: make new-module name=notes)
ifndef name
	$(error Usage: make new-module name=notes)
endif
	cd backend && go run ./cmd/scaffold $(name)

verify-scaffold: ## Verify scaffold-generated code compiles (used by CI)
	@echo "=== Generating test module..."
	@cd backend && go run ./cmd/scaffold scaffoldtests
	@echo "=== Building backend..."
	@cd backend && go build ./...
	@echo "=== Cleaning up generated files..."
	@rm -f backend/migrations/*_scaffoldtests.up.sql backend/migrations/*_scaffoldtests.down.sql
	@rm -f backend/internal/service/scaffoldtest.go
	@rm -f backend/internal/handler/scaffoldtest.go backend/internal/handler/scaffoldtest_test.go
	@rm -rf "frontend/src/routes/(private)/scaffoldtests"
	@git checkout -- backend/internal/handler/interfaces.go
	@echo "✓ Scaffold output compiles"

rename: ## Rename the project (usage: make rename name=myapp module=github.com/user/myapp/backend)
ifndef name
	$(error Usage: make rename name=myapp module=github.com/myuser/myapp/backend)
endif
ifndef module
	$(error Usage: make rename name=myapp module=github.com/myuser/myapp/backend)
endif
	cd backend && go run ./cmd/rename $(name) $(module)

migrate-up: ## Run database migrations (requires DATABASE_URL)
	cd backend && migrate -path migrations -database "$$DATABASE_URL" up

migrate-down: ## Rollback last migration (requires DATABASE_URL)
	cd backend && migrate -path migrations -database "$$DATABASE_URL" down 1

seed: ## Seed development data (requires DATABASE_URL)
	cd backend && psql "$$DATABASE_URL" < seeds/dev_seed.sql

benchmark: ## Run k6 load test
	k6 run benchmarks/benchmark.js

clean: ## Remove build artifacts and caches
	cd backend && rm -rf bin/ tmp/ server rename scaffold coverage.out coverage.html
	cd frontend && rm -rf .output dist coverage test-results playwright-report app.config.timestamp_*.js
