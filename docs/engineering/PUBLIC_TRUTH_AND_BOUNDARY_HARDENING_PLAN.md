# PUBLIC_TRUTH_AND_BOUNDARY_HARDENING_PLAN

## Goal

- Align public copy and operator docs with the real live runtime.
- Close the most immediate boundary-hardening gaps on public unauthenticated routes.
- Leave deeper infra work to the next Postgres rehearsal batch.

## Why now

- `damit.kr` is publicly reachable and real mail delivery is working.
- The next risk is no longer feature breadth, but mismatch between product messaging, runtime truth, and public boundary safety.

## Scope

### Product truth pass

- update stale login/footer messaging in `public/login.html`
- confirm `public/start.html` is UTF-8 safe and leave it unchanged unless actual corruption is found
- update `docs/engineering/PRODUCTION_READINESS.md`
- update `docs/engineering/RUNBOOK.md`

### Boundary hardening

- make public customer confirmation read responses non-cacheable
- stop exposing provider failure detail on public login challenge failures
- add explicit JSON request body size limits
- make proxy-header trust more explicit for public IP-based throttling
- keep multipart upload size limits configurable and consistent

## Out of scope

- durable/shared rate limiting
- Cloudflare edge bot mitigation
- server-side Postgres cutover rehearsal
- SQLite -> Postgres data import

## Exit criteria

- public login copy reads truthfully for the current live environment
- readiness/runbook docs reflect current homelab + Cloudflare + Resend reality
- `/api/v1/public/confirm/:token` returns `Cache-Control: no-store`
- oversized JSON requests fail early with `413`
- `MAIL_DELIVERY_FAILED` no longer leaks provider internals to public callers
- proxy-derived IP lookup no longer trusts forwarded headers unconditionally
