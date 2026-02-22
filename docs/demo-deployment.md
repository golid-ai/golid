# Live Demo Deployment

Deploy a live demo instance for framework evaluation.

## Strategy

- **Mutations enabled** -- visitors can create, edit, and delete items to experience the full CRUD flow
- **Hourly seed reset** -- a cron job re-runs `seeds/dev_seed.sql` every hour to restore demo data
- **Demo banner** -- `DEMO_MODE=true` env var shows a persistent info banner in the app

## Fly.io Deployment

```bash
# Deploy backend
cd backend
fly launch --name golid-demo-api
fly secrets set \
  DATABASE_URL="postgres://..." \
  JWT_SECRET="demo-jwt-secret-at-least-32-characters" \
  ENVIRONMENT="production" \
  FRONTEND_URL="https://golid-demo-web.fly.dev"
fly deploy

# Deploy frontend
cd ../frontend
fly launch --name golid-demo-web
fly secrets set \
  BACKEND_URL="https://golid-demo-api.fly.dev" \
  VITE_DEMO_MODE="true"
fly deploy
```

## Hourly Seed Reset

Create a Fly Machine cron job or use an external scheduler:

```bash
# Using Fly Machine scheduled task
fly machine run postgres:16 \
  --schedule "0 * * * *" \
  --env DATABASE_URL="$DATABASE_URL" \
  --command "psql $DATABASE_URL < /seeds/dev_seed.sql"
```

Alternative: Use a Cloud Scheduler job, GitHub Actions cron, or any external cron service to hit a reset endpoint.

## Demo Banner

Set `VITE_DEMO_MODE=true` on the frontend. The app shows a persistent banner:

> **Live demo** -- Data resets hourly. Accounts: admin@example.com / user@example.com (Password123!)

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Password123! | Admin (component showcase access) |
| user@example.com | Password123! | Regular user |
