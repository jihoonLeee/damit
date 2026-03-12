# RUNBOOK

## Purpose

- Provide the minimum operational checklist for local, staging, and live runs.
- Keep the steps readable so PM, Builder, and QA can use the same flow.

## Core commands

- start app: `npm start`
- health check: `GET /api/v1/health`
- seed demo data: `npm run seed:demo`
- reset local data: `npm run reset:data`
- local restore rehearsal: `npm run backup:restore:local`
- restore local DB from backup: `npm run restore:db -- --file=<backup-file>`
- restore local uploads from backup: `npm run restore:uploads -- --dir=<upload-backup-dir>`
- live smoke: `npm run smoke:live`
- Postgres preflight: `npm run pg:preflight`
- staging env check: `npm run env:check:staging`
- production env check: `npm run env:check:production`

## Current environment model

### Local

- SQLite
- local uploads
- `MAIL_PROVIDER=FILE`

### Staging

- current runtime: SQLite bootstrap on Fly
- next DB target: Supabase Free Postgres via `DATABASE_URL`
- current mail mode: `FILE`

### Production

- current runtime: SQLite pilot
- future DB target: external Postgres after adapter completion

## Staging checks

1. `GET /api/v1/health`
2. `GET /beta-app`
3. `GET /api/v1/admin/postgres-preflight` with owner token
4. confirm staging app name, owner token, and volume are separate from production

Expected current result:

- health is green
- beta app is reachable
- postgres preflight returns `POSTGRES_NOT_CONFIGURED` until Supabase is attached

## Supabase attach checklist

1. create a Supabase staging project
2. copy the connection string from `Connect`
3. set `DATABASE_URL` on the Fly staging app
4. set `POSTGRES_SSL_MODE=require`
5. set `POSTGRES_APPLICATION_NAME`
6. run `npm run pg:preflight`
7. only after preflight is green, proceed with migration and adapter work

## Incident priorities

### P0

- health endpoint fails
- field record creation fails
- agreement save fails
- auth session breaks broadly

### P1

- draft generation fails
- timeline or detail state mismatch
- staging or production secrets are misconfigured

### P2

- copy or helper UX regressions
- internal-only mail preview issues

## Rollback rule

If a deploy breaks P0 flow, return to the last known healthy release before attempting deeper fixes.

## Postgres admin smoke

- one-off script: `node scripts/postgres-admin-smoke.mjs`
- intended use: verify Postgres `systemRepository` backup/reset without switching app runtime to `POSTGRES`
- staging Fly machine example:
  - `fly ssh console -a field-agreement-jihoon-staging -C "sh -lc 'cd /app && node scripts/postgres-admin-smoke.mjs'"`
## Local restore rehearsal

1. run `npm run backup:restore:local`
2. confirm the script prints `ok: true`
3. keep the output paths for the created DB backup and upload backup when practicing manual restore

Manual restore helpers:

- DB restore: `npm run restore:db -- --file=<backup-file>`
- uploads restore: `npm run restore:uploads -- --dir=<upload-backup-dir>`

Expected local result:

- SQLite counts return after restore
- upload file count returns after restore
- photo file paths exist again on disk
