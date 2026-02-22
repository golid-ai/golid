# Cloud Run Networking: Core Principles

This document summarizes the essential networking architecture for a secure, two-service Cloud Run deployment with a public frontend and private backend.

**Framework-agnostic:** These are infrastructure patterns that apply regardless of application stack.

---

## Principle 1: Internal DNS Resolution

### Required Configuration

- Both services **MUST** run in `--execution-environment=gen2`
- Frontend service **MUST** use a VPC Connector
- Nginx **MUST** use `resolver 169.254.169.254 ipv6=off;` (Google's metadata server)
- Frontend **MUST** deploy with `--vpc-egress=all`
- VPC firewall rule **MUST** allow TCP from Serverless VPC Access range (`10.128.0.0/9`)
- Nginx **MUST** use a variable to force DNS resolution at request time
- Backend API router **MUST** match the proxied path

### Rationale

- Internal-only Cloud Run services resolve to Google-owned **public** IP addresses
- Without `--vpc-egress=all`, the frontend egresses to public internet and gets rejected by `ingress: internal`
- Setting `--vpc-egress=all` forces requests through the VPC connector

---

## Principle 2: IAM vs. Ingress

### Configuration

- Backend with `ingress: internal` is firewalled at the network level
- Cloud Run also enforces IAM-based authentication by default
- Nginx does **not** automatically generate Google-signed identity tokens
- Backend **MUST** allow unauthenticated invocations (`allUsers` + `roles/run.invoker`)
- Security is provided by the network boundary, not the IAM layer

---

## Known Failure Modes

| Symptom | Cause | Solution |
|---------|-------|----------|
| `403 Forbidden` on API calls | IAM check failing | Ensure `allUsers` has invoker role |
| Nginx DNS resolution fails | IPv6 issue | Add `ipv6=off` to resolver directive |
| `upstream timed out` | Missing firewall rule | Allow traffic from VPC connector range |
| Inconsistent deployments | Command-line flag bugs | Use YAML files with `gcloud run services replace` |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC INTERNET                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Cloud Run - Public)                                  │
│  ┌─────────────┐    ┌──────────────────────────────────────┐   │
│  │   Nginx     │───▶│  /api/* → proxy_pass to backend      │   │
│  │   (proxy)   │    │  /*     → serve static/SSR           │   │
│  └─────────────┘    └──────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ VPC Connector (vpc-egress=all)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Cloud Run - Private, ingress: internal)               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Express / FastAPI / Go / NestJS / etc.                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Cloud SQL Proxy / Direct
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  DATABASE (Cloud SQL - Private IP)                              │
└─────────────────────────────────────────────────────────────────┘
```
