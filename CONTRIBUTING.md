# Contributing to Golid

Thanks for your interest in contributing! This document covers the basics.

## Development Setup

```bash
# Clone and start
git clone https://github.com/golid-ai/golid.git
cd golid
docker compose up

# Backend: http://localhost:8080
# Frontend: http://localhost:3000
```

See [docs/quick-start.md](docs/quick-start.md) for detailed setup instructions.

## Making Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure tests pass:
   ```bash
   cd backend && go build ./... && go vet ./... && go test ./...
   cd ../frontend && npm run build && npm test
   ```
4. Submit a pull request

## Code Style

- **Backend**: Follow the patterns in `docs/best-practices.md`. Use `apperror` for errors, parameterized queries only, transactions for multi-write operations.
- **Frontend**: Follow SolidJS patterns in the codebase standards. Use `Switch/Match` for content states, `batch()` for async signal updates, `onMount` + signals for data fetching.

## What Makes a Good PR

- Focused on a single concern
- Includes tests for new functionality
- Doesn't break existing tests
- Follows the existing code patterns

## Reporting Issues

Use the GitHub issue templates. Include:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Environment details (OS, Go version, Node version)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
