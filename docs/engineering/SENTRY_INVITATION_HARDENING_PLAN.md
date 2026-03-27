# SENTRY_INVITATION_HARDENING_PLAN

Date: 2026-03-27
Owner: PM
Status: proposed

## Why this batch now

- `damit.kr` is now publicly reachable and the product has already passed the first public rate-limit batch.
- The next highest-value gap is visibility into real runtime failures and tighter control over invitation abuse.
- This batch should stay small, reversible, and safe for the current single-node production-like runtime.

## Scope

This batch covers only two areas:

1. Sentry-based runtime error reporting
2. Invitation create/reissue abuse hardening

## Goals

- Capture unexpected server-side failures without changing the normal happy path.
- Keep Sentry optional:
  - if `SENTRY_DSN` is missing, runtime stays fully functional
  - if `SENTRY_DSN` is present, unexpected `5xx` paths are reported
- Add owner/company scoped throttling on invitation actions on top of the existing repository-level email checks.

## Implementation approach

### 1. Add a small observability module

- Introduce a dedicated `observability` module for Sentry bootstrap.
- Initialize Sentry once at server startup.
- Use env-based toggles only; do not require Sentry for local development.
- Report:
  - unexpected uncaught server errors
  - internal `5xx` errors handled through the normal HTTP error path
- Do not report expected `4xx` product errors.

### 2. Keep invitation throttling small and operator-readable

- Keep the existing repository protections:
  - per-email recent invitation check on create
  - short resend cooldown on reissue
- Add a higher-level in-memory limiter keyed by:
  - `companyId`
  - `owner userId`
  - action type (`create`, `reissue`)
- Return stable `429` application codes with `Retry-After`.

## Proposed defaults

- invitation create:
  - `8 requests / 10 minutes / owner-company`
- invitation reissue:
  - `12 requests / 10 minutes / owner-company`

These defaults are intentionally conservative for low-volume public rollout and can be tuned later from real operator usage.

## Acceptance criteria

- `SENTRY_DSN` absent:
  - server still boots and behaves exactly as before
- `SENTRY_DSN` present:
  - Sentry initializes once and internal server failures are capturable
- invitation create/reissue can hit deterministic `429` responses with `Retry-After`
- existing invitation success flow still passes
- docs explain how to enable Sentry safely in public runtime

## Explicit non-goals

- no distributed limiter or Redis in this batch
- no CAPTCHA/Turnstile in this batch
- no public mail cutover in this batch
- no Postgres migration in this batch
