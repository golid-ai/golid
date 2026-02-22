# Benchmarks

API performance benchmarks using [k6](https://k6.io/).

## Quick Start

```bash
# Install k6
brew install k6          # macOS
# or: https://k6.io/docs/getting-started/installation/

# Start the stack
docker compose up -d

# Run benchmarks
k6 run benchmarks/benchmark.js
```

## What's Tested

| Scenario | Description | Duration |
|----------|-------------|----------|
| Health check | `GET /health` at 100 req/s | 15s |
| Auth login | `POST /auth/login` at 20 req/s | 15s |
| Mixed traffic | Ramping 1-50 VUs with health/features/login mix | 40s |

## Thresholds

- `p(95) < 500ms` for all requests
- `p(99) < 1000ms` for all requests
- `p(95) < 50ms` for health checks
- Error rate `< 5%`

## Running Against a Remote Instance

```bash
k6 run -e BASE_URL=https://your-api.example.com benchmarks/benchmark.js
```
