# PUBLIC_RATE_LIMIT_HARDENING_REVIEW

Date: 2026-03-27
Owner: PM
Status: go

## What shipped

- Added a small in-memory public rate limiter for exposed routes.
- Kept the existing auth repository email throttle in place.
- Added explicit `429` responses with `Retry-After`.
- Added regression coverage for auth and public customer confirmation flows.

## Endpoints now covered

1. `POST /api/v1/auth/challenges`
2. `POST /api/v1/auth/verify`
3. `GET /api/v1/public/confirm/:token`
4. `POST /api/v1/public/confirm/:token/acknowledge`

## Runtime defaults

- auth challenge: `5 / 10 minutes / IP`
- auth verify: `12 / 10 minutes / IP`
- confirmation read: `30 / 10 minutes / IP`
- confirmation acknowledge: `6 / 10 minutes / IP`

## Files changed

- `src/security/public-rate-limit.js`
- `src/app.js`
- `src/http.js`
- `src/config.js`
- `tests/auth-foundation.test.js`
- `tests/customer-confirmation.test.js`

## Validation

- `node tests/auth-foundation.test.js`
- `node tests/customer-confirmation.test.js`
- `node tests/api.test.js`

## PM judgment

- The product still is not ready to claim full public-production maturity.
- But the biggest previously unproven abuse gap on public login and confirmation routes is now materially better than before.
- This batch is a meaningful `GO` toward public hardening, not the final security gate.
