# SENTRY_INVITATION_HARDENING_REVIEW

Date: 2026-03-27
Owner: PM
Status: go

## What shipped

- Added optional Sentry bootstrap for runtime `5xx` reporting.
- Kept Sentry fully inert when `SENTRY_DSN` is not configured.
- Added owner/company scoped invitation create and reissue throttles.
- Surfaced Sentry readiness in `/ops` runtime status.

## Runtime behavior

- `SENTRY_DSN` empty:
  - no monitoring dependency for local or preview runtime
- `SENTRY_DSN` present:
  - server startup initializes Sentry once
  - unexpected HTTP `5xx` errors can be reported

## Invitation hardening behavior

- invitation create: `8 / 10 minutes / owner-company`
- invitation reissue: `12 / 10 minutes / owner-company`
- both return `429` with `Retry-After`
- existing repository-level email and resend cooldown checks stay in place

## Files changed

- `package.json`
- `package-lock.json`
- `server.js`
- `src/config.js`
- `src/http.js`
- `src/observability/sentry.js`
- `src/security/public-rate-limit.js`
- `src/app.js`
- `src/store.js`
- `public/ops.js`
- `tests/auth-foundation.test.js`
- `deploy/homelab/.env.example`
- `.env.production.example`
- `docs/engineering/RUNBOOK.md`
- `docs/engineering/PRODUCTION_READINESS.md`

## Validation

- `node --check src/app.js`
- `node --check src/http.js`
- `node --check src/observability/sentry.js`
- `node --check src/security/public-rate-limit.js`
- `node --check server.js`
- `node tests/auth-foundation.test.js`
- `node tests/api.test.js`
- `node tests/workspace-session.test.js`
- `node tests/customer-confirmation.test.js`
- `node scripts/visual-review.mjs`

## PM judgment

- This is a meaningful public-hardening `GO`.
- The product now has both better abuse resistance and a prepared monitoring path.
- Full public-production maturity still remains `HOLD` until a real Sentry DSN is configured and live mail cutover is proven.
