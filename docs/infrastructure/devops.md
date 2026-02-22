# Golid DevOps Guide

## Overview

Golid runs on Google Cloud Platform with the following architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cloud Run: golid-web (Frontend)                                │
│  - SolidStart SSR                                               │
│  - Ingress: all (public)                                        │
│  - 512Mi / 1 CPU                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (VPC Connector)
┌─────────────────────────────────────────────────────────────────┐
│  Cloud Run: golid-api (Backend)                                 │
│  - Go API server                                                │
│  - Ingress: internal only                                       │
│  - 512Mi / 1 CPU                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cloud SQL: golid-db                                            │
│  - PostgreSQL 16                                                │
│  - us-central1                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## GCP Configuration

| Setting           | Value                                               |
| ----------------- | --------------------------------------------------- |
| **Project ID**    | `your-project-qa` (QA) / `your-project-prod` (prod) |
| **Region**        | `us-central1`                                       |
| **VPC Network**   | `default`                                           |
| **VPC Connector** | `golid-vpc`                                         |

### Required APIs

The deploy script enables these automatically:

- `run.googleapis.com` - Cloud Run
- `cloudbuild.googleapis.com` - Cloud Build
- `artifactregistry.googleapis.com` - Container registry
- `sqladmin.googleapis.com` - Cloud SQL Admin
- `secretmanager.googleapis.com` - Secret Manager
- `vpcaccess.googleapis.com` - VPC Access
- `servicenetworking.googleapis.com` - Service Networking
- `storage.googleapis.com` - Cloud Storage
- `cloudscheduler.googleapis.com` - Cloud Scheduler
- `cloudtrace.googleapis.com` - Cloud Trace

---

## Quick Start

### Prerequisites

1. Install [gcloud CLI](https://cloud.google.com/sdk/docs/install)
2. Authenticate: `gcloud auth login`
3. Set project: `gcloud config set project your-project-qa`
4. Set region: `gcloud config set run/region us-central1`
5. Enable the Secret Manager API (the deploy script enables all other APIs automatically, but secrets must exist _before_ the first deploy):
   ```bash
   gcloud services enable secretmanager.googleapis.com --project=your-project-qa
   ```
6. Create required secrets in GCP Secret Manager (see [Secrets Management](#secrets-management) below)

### Deploy Everything

```bash
./scripts/deploy.sh              # QA, both services (default)
./scripts/deploy.sh prod         # Prod, both services
```

### Deploy Individual Components

```bash
./scripts/deploy.sh qa api       # QA, backend only
./scripts/deploy.sh qa web       # QA, frontend only
./scripts/deploy.sh prod api     # Prod, backend only
```

### Validate Before Deploying

```bash
./scripts/deploy.sh check        # Verify secrets and config for QA
./scripts/deploy.sh check prod   # Verify secrets and config for prod
```

---

## Secrets Management

Secrets are stored in GCP Secret Manager and injected into Cloud Run services at deploy time.
Non-sensitive config (`ENVIRONMENT`, `FRONTEND_URL`, `MAILGUN_DOMAIN`, etc.) stays in `config/.env.{qa,prod}`.

### Naming Convention

`{project}-{secret-name}-{env}` — e.g. `golid-jwt-secret-qa`, `golid-db-password-prod`.

The env suffix prevents collisions when QA and prod share a GCP project.

### How Secrets Are Injected

| Secret                       | Env Var                            | Method            | Notes                                                                  |
| ---------------------------- | ---------------------------------- | ----------------- | ---------------------------------------------------------------------- |
| `golid-jwt-secret-{env}`     | `JWT_SECRET`                       | `--set-secrets`   | Required. Cloud Run injects at startup.                                |
| `golid-db-password-{env}`    | (used to construct `DATABASE_URL`) | Deploy-time fetch | Required. Fetched by `deploy.sh`, combined with Cloud SQL socket path. |
| `golid-mailgun-key-{env}`    | `MAILGUN_API_KEY`                  | `--set-secrets`   | Optional. Skipped if not in SM.                                        |
| `golid-stripe-secret-{env}`  | `STRIPE_SECRET_KEY`                | `--set-secrets`   | Optional. Skipped if not in SM.                                        |
| `golid-stripe-webhook-{env}` | `STRIPE_WEBHOOK_SECRET`            | `--set-secrets`   | Optional. Skipped if not in SM.                                        |

**`--set-secrets`**: Cloud Run resolves the secret at container startup. The value never appears in `gcloud run services describe` output.

**Deploy-time fetch**: `deploy.sh` calls `gcloud secrets versions access` and passes the resolved value as `--set-env-vars`. Used only for `DB_PASSWORD` because `DATABASE_URL` is a composite value (password + Cloud SQL connection name + username).

### Adding a New Secret

For project-specific secrets (e.g. BoldSign, future integrations), follow the same pattern:

1. Create the secret: `echo -n "value" | gcloud secrets create golid-{name}-{env} --data-file=- --project=PROJECT`
2. Add a `secret_exists` guard + append to the `secrets` string in `ship_api()` in `deploy.sh`
3. Add the field to `config.go` + pass from `cfg` in `main.go`

### View Existing Secrets

```bash
gcloud secrets list --project=your-project-qa
```

### Create Required Secrets (One-Time Setup)

```bash
# Enable Secret Manager API (must be done before creating secrets)
gcloud services enable secretmanager.googleapis.com --project=your-project-qa

# JWT secret
openssl rand -base64 32 | gcloud secrets create golid-jwt-secret-qa --data-file=- --project=your-project-qa

# DB password (also auto-created by deploy.sh if provisioning a new database)
echo -n 'your-db-password' | gcloud secrets create golid-db-password-qa --data-file=- --project=your-project-qa

# Optional: Mailgun API key
echo -n 'mg-api-key' | gcloud secrets create golid-mailgun-key-qa --data-file=- --project=your-project-qa
```

### Rotate a Secret

Add a new version and redeploy. `--set-secrets` uses `:latest`, so the new version is picked up automatically.

```bash
echo -n 'new-value' | gcloud secrets versions add golid-jwt-secret-qa --data-file=- --project=your-project-qa
./scripts/deploy.sh qa api
```

Old versions can be disabled: `gcloud secrets versions disable VERSION --secret=SECRET_NAME --project=PROJECT`

### View Secret Value

```bash
gcloud secrets versions access latest --secret=golid-jwt-secret-qa --project=your-project-qa
```

### Pre-Deploy Validation

```bash
./scripts/deploy.sh check qa
```

This validates that required secrets are **accessible** (not just that they exist), catching permission errors and disabled versions before a real deploy.

---

## Database (Cloud SQL)

### Current Instance

| Property          | Value                                  |
| ----------------- | -------------------------------------- |
| **Instance Name** | `golid-db-qa` (QA) / `golid-db` (prod) |
| **Version**       | PostgreSQL 16                          |
| **Tier**          | `db-g1-small`                          |
| **Region**        | `us-central1`                          |
| **Database**      | `golid`                                |
| **User**          | `golid_user`                           |

### Connect via Cloud SQL Proxy

```bash
# Install proxy
brew install cloud-sql-proxy

# Connect (in separate terminal)
cloud-sql-proxy your-project-qa:us-central1:golid-db-qa

# Then connect with psql
psql "postgres://golid_user:PASSWORD@localhost:5432/golid"
```

### Connect via gcloud

```bash
gcloud sql connect golid-db-qa --user=golid_user --project=your-project-qa
```

### Create New Database Instance

```bash
# Generate password
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')

# Create instance
gcloud sql instances create golid-db-qa \
  --database-version=POSTGRES_16 \
  --edition=ENTERPRISE \
  --tier=db-g1-small \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --availability-type=zonal \
  --project=your-project-qa

# Create database
gcloud sql databases create golid --instance=golid-db-qa --project=your-project-qa

# Create user
gcloud sql users create golid_user \
  --instance=golid-db-qa --password="${DB_PASSWORD}" --project=your-project-qa

# Store password in Secret Manager
echo -n "${DB_PASSWORD}" | gcloud secrets create golid-db-password-qa \
  --data-file=- --project=your-project-qa
```

### Delete Instance (⚠️ Destructive)

```bash
gcloud sql instances delete golid-db-qa --project=your-project-qa --quiet
```

---

## Cloud Storage

### Bucket

| Property   | Value                                           |
| ---------- | ----------------------------------------------- |
| **Name**   | `golid-data-qa` (QA) / `golid-data-prod` (prod) |
| **Region** | `us-central1`                                   |
| **CORS**   | Enabled (all origins, standard methods)         |

The bucket is provisioned automatically by `deploy.sh`. The `golid-gcs` service account has `roles/storage.objectAdmin` on the bucket. The backend API creates signed URLs via `roles/iam.serviceAccountTokenCreator` on the storage SA.

### View Bucket

```bash
gsutil ls -b gs://golid-data-qa
```

---

## Service Accounts

| Account       | Email                                               | Purpose                         |
| ------------- | --------------------------------------------------- | ------------------------------- |
| Backend API   | `golid-api@your-project-qa.iam.gserviceaccount.com` | Runs backend Cloud Run service  |
| Frontend Web  | `golid-web@your-project-qa.iam.gserviceaccount.com` | Runs frontend Cloud Run service |
| Cloud Storage | `golid-gcs@your-project-qa.iam.gserviceaccount.com` | Object storage operations       |

### Backend SA Roles

- `roles/logging.logWriter` - Write logs
- `roles/cloudsql.client` - Connect to Cloud SQL
- `roles/secretmanager.secretAccessor` - Access secrets from Secret Manager
- `roles/iam.serviceAccountTokenCreator` (on `golid-gcs` SA) - Create signed URLs for file uploads

---

## Cloud Run Services

### View Services

```bash
gcloud run services list --project=your-project-qa --region=us-central1
```

### View Logs

```bash
# Backend logs
gcloud run services logs read golid-api-qa --region=us-central1 --project=your-project-qa

# Frontend logs
gcloud run services logs read golid-web-qa --region=us-central1 --project=your-project-qa

# Stream logs (tail -f)
gcloud run services logs tail golid-api-qa --region=us-central1 --project=your-project-qa
```

### Get Service URLs

```bash
# Frontend (public)
gcloud run services describe golid-web-qa --region=us-central1 --format='value(status.url)' --project=your-project-qa

# Backend (internal only)
gcloud run services describe golid-api-qa --region=us-central1 --format='value(status.url)' --project=your-project-qa
```

### Delete Service

```bash
gcloud run services delete SERVICE_NAME --region=us-central1 --project=your-project-qa --quiet
```

---

## VPC & Networking

### VPC Connector

The VPC connector allows Cloud Run services to communicate with each other internally.

| Property     | Value         |
| ------------ | ------------- |
| **Name**     | `golid-vpc`   |
| **Network**  | `default`     |
| **IP Range** | `10.9.0.0/28` |

### Check Connector Status

```bash
gcloud compute networks vpc-access connectors list --region=us-central1 --project=your-project-qa
```

### Firewall Rules

| Rule             | Direction | Ports          | Purpose            |
| ---------------- | --------- | -------------- | ------------------ |
| `golid-vpc-dns`  | EGRESS    | 53/tcp, 53/udp | DNS resolution     |
| `golid-internal` | INGRESS   | 8080/tcp       | Frontend → Backend |

---

## Artifact Registry

Container images are stored in Artifact Registry.

```bash
# List repositories
gcloud artifacts repositories list --location=us-central1 --project=your-project-qa

# List images
gcloud artifacts docker images list us-central1-docker.pkg.dev/your-project-qa/golid --project=your-project-qa

# Delete old images (keep last 5)
gcloud artifacts docker images list us-central1-docker.pkg.dev/your-project-qa/golid \
  --sort-by=~CREATE_TIME --limit=999 --format='value(DIGEST)' | \
  tail -n +6 | \
  xargs -I {} gcloud artifacts docker images delete us-central1-docker.pkg.dev/your-project-qa/golid@{} --quiet
```

---

## Troubleshooting

### VPC Connector CIDR Conflict

If you see:

```
Invalid IP CIDR range was provided. It conflicts with an existing subnetwork.
```

List existing connectors and delete the broken one:

```bash
gcloud compute networks vpc-access connectors list --region=us-central1 --project=your-project-qa
gcloud compute networks vpc-access connectors delete CONNECTOR_NAME --region=us-central1 --project=your-project-qa --quiet
```

### Backend Not Reachable from Frontend

1. Check VPC connector is in READY state
2. Verify backend ingress is set to `internal`
3. Check firewall rule `golid-internal` exists
4. Ensure frontend uses VPC connector with `--vpc-egress all-traffic`

### Database Connection Failed

1. Verify Cloud SQL instance is running:

   ```bash
   gcloud sql instances list --project=your-project-qa
   ```

2. Check DB password secret exists and is accessible:

   ```bash
   gcloud secrets versions access latest --secret=golid-db-password-qa --project=your-project-qa
   ```

3. Ensure backend SA has `roles/cloudsql.client` role

### Missing Secrets

Run the secrets check:

```bash
./scripts/deploy.sh check
```

---

## Image Tags

Images are tagged with: `{git-short-hash}-{epoch-seconds}`

Example: `6f7e558-1736639691`

This ensures:

- Unique tags for every build
- Traceability back to git commit
- Chronological ordering
