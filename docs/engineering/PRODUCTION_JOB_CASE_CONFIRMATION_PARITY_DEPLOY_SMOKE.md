# PRODUCTION_JOB_CASE_CONFIRMATION_PARITY_DEPLOY_SMOKE

Date: 2026-03-12
Environment: `field-agreement-jihoon-staging`
URL: [field-agreement-jihoon-staging.fly.dev](https://field-agreement-jihoon-staging.fly.dev/)
Decision: GO

## Deploy

- `flyctl deploy -c D:\AI_CODEX_DESKTOP\fly.staging.toml`
- staging machine updated successfully
- app health returned `200`

## Migration

- executed inside staging Fly machine:
  - `node scripts/migrate-postgres.mjs`
- result:
  - `0001_production_core` -> `already_applied`
  - `0002_customer_confirmation_state_columns` -> `applied`
- authenticated preflight response after migration:
  - `migrations.total = 2`
  - `migrations.applied = 2`
  - `migrations.pending = 0`
  - `server.serverVersion = 17.6`

## General staging smoke

- script: [live-smoke.mjs](/D:/AI_CODEX_DESKTOP/scripts/live-smoke.mjs)
- base URL: `https://field-agreement-jihoon-staging.fly.dev`
- result: passed
- verified:
  - health
  - backup
  - field record create
  - job case create
  - link
  - quote
  - draft
  - agreement
  - detail
  - timeline
  - reset

## Customer confirmation smoke

- additional staging run executed specifically for this batch
- verified:
  - field record create
  - job case create
  - quote + draft
  - confirmation link issue
  - public confirmation view
  - public confirmation acknowledge
  - detail latest confirmation status
  - timeline contains confirmation events
  - reset returns counts to zero

## Observed outputs

- confirmation link status flow:
  - `ISSUED`
  - `VIEWED`
  - `CONFIRMED`
- detail latest confirmation status:
  - `CONFIRMED`
- confirmation smoke timeline count:
  - `5`

## Known note

- `fly ssh console` printed a Windows handle error after the migration result JSON.
- migration state and preflight response confirmed the migration still applied successfully.
- PM treats this as an execution-shell quirk, not a staging blocker.

## PM Judgment

- staging is green for this batch.
- repository parity behavior holds in deployed runtime.
- Postgres migration state is now aligned with the repository expectations.
