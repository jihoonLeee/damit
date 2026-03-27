# PUBLIC_RATE_LIMIT_HARDENING_PLAN

Date: 2026-03-27
Owner: PM
Status: proposed

## Why this batch now

- `damit.kr` is now publicly reachable.
- The strongest remaining public-production gap is abuse resistance on exposed flows.
- The product does not need broader scope first; it needs explicit guardrails on the endpoints that can be spammed.

## Scope

This batch hardens only the public-facing write and pre-write flows:

1. `POST /api/v1/auth/challenges`
2. `POST /api/v1/auth/verify`
3. `GET /api/v1/public/confirm/:token`
4. `POST /api/v1/public/confirm/:token/acknowledge`

## Goals

- Add explicit, operator-readable rate limits before broader public usage.
- Keep the implementation small and reversible.
- Preserve the existing email-based SQLite/Postgres auth challenge throttling and add a generic public-edge limiter on top.

## Implementation approach

### 1. Add a small in-memory public rate limiter

- Use IP + route-scoped keys.
- Use short rolling windows with simple counters.
- Return `429` with stable application error codes.
- Include `Retry-After` so the client and operator can understand the cooldown.

### 2. Keep the existing auth repository throttle

- Do not remove the current per-email challenge guard.
- Layer the new limiter in `src/app.js` so public routes get a fast front-door block first.

### 3. Cover both auth and customer confirmation

- auth challenge:
  - stronger guard on repeated public requests from one IP
- auth verify:
  - light guard against repeated token verification attempts
- public confirmation read:
  - modest guard to reduce token scraping or refresh floods
- public confirmation acknowledge:
  - strict guard because it mutates state

## Proposed defaults

- auth challenge: `5 requests / 10 minutes / IP`
- auth verify: `12 requests / 10 minutes / IP`
- confirmation read: `30 requests / 10 minutes / IP`
- confirmation acknowledge: `6 requests / 10 minutes / IP`

These are conservative enough for a low-volume public rollout and can be tuned later from real traffic.

## Acceptance criteria

- repeated public requests hit `429` with deterministic error codes
- `Retry-After` header is present on rate-limited responses
- existing success paths still pass for auth and customer confirmation
- docs reflect that public abuse resistance moved from `HOLD` toward `GO`

## Explicit non-goals

- no CAPTCHA or Turnstile in this batch
- no Redis or distributed rate limiter in this batch
- no mail-provider cutover in this batch
- no Postgres migration in this batch
