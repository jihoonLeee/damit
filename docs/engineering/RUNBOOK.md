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
- real mail smoke: `npm run smoke:mail:production-local`

## Current environment model

### Local

- SQLite
- local uploads
- `MAIL_PROVIDER=FILE`
- `AUTH_DEBUG_LINKS=true`

### Staging

- current runtime: SQLite bootstrap on Fly
- next DB target: Supabase Free Postgres via `DATABASE_URL`
- current mail mode: `FILE`
- current auth mode: `SameSite=Strict` session cookies, refresh CSRF required

### Production

- current runtime: SQLite pilot
- future DB target: external Postgres after adapter completion
- target mail mode: `MAIL_PROVIDER=RESEND`
- target auth mode: `AUTH_DEBUG_LINKS=false`, `AUTH_ENFORCE_TRUSTED_ORIGIN=true`

## Auth hardening defaults

- refresh endpoint requires `x-csrf-token`
- refresh rotates both session id and refresh token
- session cookies default to `SameSite=Strict`
- idle timeout default is 12 hours
- login challenge TTL default is 15 minutes
- auth challenge public rate limit default is `5 / 10 minutes / IP`
- auth verify public rate limit default is `12 / 10 minutes / IP`
- customer confirmation read public rate limit default is `30 / 10 minutes / IP`
- customer confirmation acknowledge public rate limit default is `6 / 10 minutes / IP`

## Public abuse hardening check

1. hit `/api/v1/auth/challenges` repeatedly from the same IP and confirm `429`
2. hit `/api/v1/public/confirm/:token` repeatedly from the same IP and confirm `429`
3. confirm `Retry-After` is present on rate-limited responses
4. keep real mail cutover disabled until sender-domain verification is complete

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


## Real mail login cutover

1. set `MAIL_PROVIDER=RESEND`
2. set `RESEND_API_KEY`
3. set `MAIL_FROM` to a verified sending domain
4. set `APP_BASE_URL` to the real service origin
5. keep `AUTH_DEBUG_LINKS=false`
6. keep `AUTH_ENFORCE_TRUSTED_ORIGIN=true`
7. optionally add `TRUSTED_ORIGINS` only when more than one trusted browser origin is intentionally allowed
8. verify login challenge delivery from `/login` without relying on any debug link


## Ops auth/mail readiness check

1. open /ops as owner
2. confirm the login delivery mode matches the current environment
3. confirm debug login link exposure is OFF before real-mail cutover
4. confirm trusted-origin enforcement is ON before real-mail cutover
5. if MAIL_PROVIDER=RESEND, confirm both MAIL_FROM and RESEND_API_KEY are shown as configured

## Local real mail smoke

1. keep real mail credentials in `.env.production.local`
2. set `MAIL_PROVIDER=RESEND`, `MAIL_FROM`, `RESEND_API_KEY`, and `MAIL_SMOKE_TEST_EMAIL`
3. keep `AUTH_DEBUG_LINKS=false` and `AUTH_ENFORCE_TRUSTED_ORIGIN=true`
4. run `npm run smoke:mail:production-local`
5. confirm the command returns `delivery.provider=RESEND`
6. manually open the recipient inbox and verify the login email arrived
