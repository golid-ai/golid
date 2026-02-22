# Deployment Options

Golid deploys anywhere Docker runs. The multi-stage `Dockerfile.prod` files in `backend/` and `frontend/` produce optimized, non-root production images.

## Google Cloud Run (included)

The `scripts/deploy.sh` script handles full infrastructure provisioning and deployment. See [scripts/README.md](../scripts/README.md) for details.

```bash
./scripts/deploy.sh APP_NAME REGION GCP_PROJECT
```

## Fly.io

Fly.io is the simplest path for indie developers. Three commands to deploy.

### Backend

```bash
cd backend
fly launch --name myapp-api --no-deploy
fly secrets set DATABASE_URL="postgres://..." JWT_SECRET="your-secret-at-least-32-chars"
fly deploy
```

Create a `backend/fly.toml`:

```toml
app = "myapp-api"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile.prod"

[env]
  PORT = "8080"
  ENVIRONMENT = "production"
  FRONTEND_URL = "https://myapp-web.fly.dev"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  path = "/health"
  timeout = "5s"
```

### Frontend

```bash
cd frontend
fly launch --name myapp-web --no-deploy
fly secrets set BACKEND_URL="https://myapp-api.fly.dev"
fly deploy
```

Create a `frontend/fly.toml`:

```toml
app = "myapp-web"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile.prod"

[env]
  PORT = "3000"
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
```

### Database

Use Fly Postgres or any external PostgreSQL provider (Neon, Supabase, etc.):

```bash
fly postgres create --name myapp-db
fly postgres attach myapp-db --app myapp-api
```

## Railway

Railway supports Docker builds natively. Create a project with two services.

1. Create a new Railway project
2. Add a PostgreSQL database
3. Add the **backend** service:
   - Root directory: `backend`
   - Dockerfile: `Dockerfile.prod`
   - Set env vars: `DATABASE_URL` (from Railway Postgres), `JWT_SECRET`, `FRONTEND_URL`
4. Add the **frontend** service:
   - Root directory: `frontend`
   - Dockerfile: `Dockerfile.prod`
   - Set env vars: `BACKEND_URL` (internal Railway URL of backend service)

## Render

1. Create a **Web Service** for the backend:
   - Root directory: `backend`
   - Runtime: Docker
   - Health check path: `/health`
   - Environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT=8080`

2. Create a **Web Service** for the frontend:
   - Root directory: `frontend`
   - Runtime: Docker
   - Environment variables: `BACKEND_URL`, `PORT=3000`

3. Create a **PostgreSQL** database and link it to the backend service.

## Bare Metal / VPS

For any server with Docker installed:

```bash
# Build production images
docker build -t myapp-api -f backend/Dockerfile.prod backend/
docker build -t myapp-web -f frontend/Dockerfile.prod frontend/

# Run with a production compose file
docker compose -f docker-compose.yml --profile production up -d
```

Or create a `docker-compose.prod.yml` with your production database URL, Redis, and environment variables.

## Common Configuration

Regardless of platform, all deployments need these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | At least 32 characters |
| `PORT` | Yes | Backend: 8080, Frontend: 3000 |
| `ENVIRONMENT` | Recommended | `production` |
| `FRONTEND_URL` | Recommended | For CORS and email links |
| `BACKEND_URL` | Frontend only | Internal URL to backend |
| `REDIS_URL` | Optional | Enables job queue + persistent rate limiting |
| `MAILGUN_API_KEY` | Optional | Enables email delivery |
| `OTEL_ENDPOINT` | Optional | Enables distributed tracing |
| `METRICS_ENABLED` | Optional | Enables Prometheus /metrics |

### Migrations

Run migrations before the first deploy:

```bash
migrate -path backend/migrations -database "$DATABASE_URL" up
```

On Fly.io, use a release command in `fly.toml`:

```toml
[deploy]
  release_command = "migrate -path /app/migrations -database $DATABASE_URL up"
```

---

## Production Security Hardening

### Content Security Policy

The default CSP includes `'unsafe-inline'` for scripts and styles to support development convenience (inline styles from component libraries, theme initialization script in `entry-server.tsx`):

```
script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
```

For production, tighten this by setting the `CSP_POLICY` environment variable with nonce-based or hash-based policies:

```bash
CSP_POLICY="default-src 'self'; script-src 'self' 'nonce-{random}'; style-src 'self' https://fonts.googleapis.com; ..."
```

The `CSP_POLICY` field in `config.go` is loaded via `getEnv("CSP_POLICY", defaultValue)` — override it per environment without code changes.
