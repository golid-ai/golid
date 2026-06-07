# Manual QA — Auth Smoke

> ~10 minutes. Requires dev stack on localhost:3000 / :8080.

## Setup

- [ ] Devcontainer or `make dev` running
- [ ] `GET http://localhost:8080/health` returns 200

## Registration and login

- [ ] Register a new user at `/signup` — lands on dashboard
- [ ] Logout — returns to public shell
- [ ] Login with same credentials — dashboard loads
- [ ] Wrong password shows error toast, no crash

## Session

- [ ] Refresh page on dashboard — still authenticated (SSR cookie + tokens)
- [ ] Open private route in new tab while logged in — no redirect loop

## Profile

- [ ] Settings: update name — persists after reload
- [ ] Settings: change password — can login with new password

## Password reset (optional if Mailgun not configured)

- [ ] Forgot password submits without error
- [ ] With Mailgun: email link completes reset

## Admin (seed user)

- [ ] Login as `admin@example.com` / `Password123!` (dev seed)
- [ ] Admin feature flags page loads (`/admin/features` or equivalent)

## CSRF header (production concern)

- [ ] Network tab: API calls include `X-Requested-With: golid-app`

**Result:** PASS / FAIL — date — tester — notes
