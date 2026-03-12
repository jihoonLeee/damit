# PRODUCTION_SYSTEM_ADMIN_PARITY_DEPLOY_SMOKE

Date: 2026-03-12
Environment: `field-agreement-jihoon-staging`
URL: [field-agreement-jihoon-staging.fly.dev](https://field-agreement-jihoon-staging.fly.dev/)
Decision: GO

## Deploy

- `flyctl deploy -c D:\AI_CODEX_DESKTOP\fly.staging.toml`
- staging app deployed successfully
- live staging runtime remains `SQLITE`

## Runtime SQLite smoke

- script: [live-smoke.mjs](/D:/AI_CODEX_DESKTOP/scripts/live-smoke.mjs)
- base URL: `https://field-agreement-jihoon-staging.fly.dev`
- result: passed
- verified:
  - health route still returns launch metadata
  - backup route still returns `201`
  - field record create
  - job case create
  - link
  - quote
  - draft
  - agreement
  - detail
  - timeline
  - reset route returns zero counts

## One-off Postgres admin smoke

- script: [postgres-admin-smoke.mjs](/D:/AI_CODEX_DESKTOP/scripts/postgres-admin-smoke.mjs)
- executed inside staging Fly machine with existing `DATABASE_URL`
- result payload:
  - `summaryBefore.storageEngine = POSTGRES`
  - `summaryBefore.counts = 0/0/0`
  - backup file created under `/data/backups`
  - `summaryAfterReset.counts = 0/0/0`
- this verified:
  - Postgres logical backup export works
  - Postgres operational reset works
  - no runtime cutover was required to verify admin parity

## Known note

- `fly ssh console` again printed a Windows handle error after the success payload.
- the smoke JSON result completed successfully before that error.
- PM treats this as a shell quirk, not a functional blocker.

## PM Judgment

- staging is green for this batch.
- admin/storage parity is now strong enough for a stricter cutover-readiness review.
