# Deployment Scripts

> **Note:** These scripts are bash-based infrastructure automation optimized for fast initial setup and small-team deployments. For production environments with multiple teams, consider migrating to Terraform, Pulumi, or CDK for auditable, version-controlled infrastructure.

## Scripts

| Script | Purpose |
|--------|---------|
| `deploy.sh` | Provision infrastructure + deploy to Cloud Run |
| `teardown.sh` | Remove Cloud Run services and (optionally) shared infra |

---

## Quick Start

```bash
# Validate config without deploying
./scripts/deploy.sh check qa

# Deploy everything to QA
./scripts/deploy.sh

# Deploy everything to production
./scripts/deploy.sh prod
```

---

## Usage

Both scripts use **positional arguments** (no flags):

### deploy.sh

```bash
./scripts/deploy.sh [env] [target]
```

| Argument | Values | Default |
|----------|--------|---------|
| env | `qa`, `prod` | `qa` |
| target | `all`, `api`, `web` | `all` |

```bash
./scripts/deploy.sh              # qa, both services
./scripts/deploy.sh prod         # prod, both services
./scripts/deploy.sh qa api       # qa, backend only
./scripts/deploy.sh prod web     # prod, frontend only
./scripts/deploy.sh check        # validate config only
./scripts/deploy.sh check prod   # validate prod config only
```

Production deploys require typing the GCP project ID to confirm.

### teardown.sh

```bash
./scripts/teardown.sh [env] [scope]
```

| Argument | Values | Default |
|----------|--------|---------|
| env | `qa`, `prod` | `qa` |
| scope | `services`, `full` | `services` |

```bash
./scripts/teardown.sh            # remove QA services + service accounts
./scripts/teardown.sh prod       # remove prod services
./scripts/teardown.sh qa full    # also remove registry, VPC, firewall
```

Cloud SQL and GCS buckets are **never** deleted by the script (data loss risk). Delete them manually in the GCP console if needed.

---

## What Gets Created

| Resource | QA Name | Prod Name |
|----------|---------|-----------|
| Cloud Run (API) | `golid-api-qa` | `golid-api` |
| Cloud Run (Web) | `golid-web-qa` | `golid-web` |
| Cloud SQL | `golid-db-qa` | `golid-db` |
| GCS Bucket | `golid-data-qa` | `golid-data-prod` |
| Artifact Registry | `golid` | `golid` |
| VPC Connector | `golid-vpc` | `golid-vpc` |

---

## Environment Differences

| Setting | QA | Production |
|---------|-----|------------|
| Min Instances | 0 (scale to zero) | 1 (always warm) |
| Max Instances | 3 | 10 |
| Backend Ingress | internal | internal |
| Prod Confirmation | not required | must type project ID |

---

## Configuration

The deploy script loads environment-specific config from `config/`:

```bash
# Copy the template and fill in your values
cp config/.env.example config/.env.qa
cp config/.env.example config/.env.prod
```

### Required Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | 32+ character secret for JWT signing |
| `DB_PASSWORD` | PostgreSQL user password |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `MAILGUN_API_KEY` | Email delivery (Mailgun) |
| `MAILGUN_DOMAIN` | Mailgun sending domain |
| `PROJECT_ID` | Override GCP project ID |
| `REGION` | Override GCP region (default: us-central1) |

---

## Deploy Pipeline

The deploy script runs these phases in order:

1. **Pre-flight** — validate config, authenticate gcloud, confirm production
2. **Test gates** — `go build` + `go test` (backend), `tsc --noEmit` (frontend)
3. **Provision** — APIs, registry, service accounts, storage, VPC, Cloud SQL, IAM
4. **Ship API** — Cloud Build, run migrations (Cloud Run Job), deploy service
5. **Ship Web** — Cloud Build, deploy service, update API with frontend URL

All provisioning is idempotent — safe to re-run.

---

## Adapting for a New Project

Change one line in `deploy.sh`:

```bash
PROJECT_NAME="your-project"
```

All resource names, service accounts, and bucket names derive from this value. Then create your env files in `config/` and deploy.

---

## Troubleshooting

### "Permission denied"

```bash
chmod +x scripts/*.sh
```

### "API service not found" (web-only deploy)

Deploy the API first:

```bash
./scripts/deploy.sh qa api
./scripts/deploy.sh qa web
```

### "Not authenticated"

```bash
gcloud auth login
gcloud auth application-default login
```
