# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Golid, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please use [GitHub Security Advisories](https://github.com/golid-ai/golid/security/advisories/new) or email **steven@uflex.us** with:

- A description of the vulnerability
- Steps to reproduce
- Affected versions (or "latest main")
- Any potential impact assessment

We will acknowledge receipt within 48 hours and provide a fix timeline within 7 days.

## Supported Versions

| Version         | Supported |
| --------------- | --------- |
| Latest `main`   | Yes       |
| Tagged releases | Yes       |

## Security Measures

Golid includes the following security features out of the box:

- **JWT auth** with refresh token rotation and configurable expiry
- **Password hashing** with bcrypt (cost factor 10)
- **Rate limiting** on auth endpoints (configurable via `AUTH_RATE_LIMIT`)
- **Security headers** (CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff)
- **CORS** with configurable allowed origins
- **Email enumeration prevention** (same response for existing/non-existing accounts)
- **SQL injection prevention** (parameterized queries only, enforced by linter)
- **Dependency scanning** (`govulncheck` + `npm audit` in CI)
- **Body size limit** (1MB default)
- **SameSite=Lax cookies** for CSRF prevention

## Dependency Updates

Dependencies are monitored via Dependabot. Security patches are prioritized and typically merged within 48 hours.
