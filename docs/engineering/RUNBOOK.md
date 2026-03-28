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
- preview Postgres rehearsal: `bash deploy/homelab/rehearse-postgres-cutover.sh`
- preview Postgres smoke: `bash deploy/homelab/smoke-postgres-runtime.sh`
- preview Postgres refresh after normal deploy: `bash deploy/homelab/refresh-preview-postgres-stack.sh`
- preview Postgres checksum repair: `node scripts/repair-postgres-migration-checksums.mjs --env-file=deploy/homelab/.env.preview-postgres`
- preview Postgres rollback: `bash deploy/homelab/rollback-to-sqlite.sh`
- preview QA bootstrap: `npm run qa:preview:bootstrap:production-local`

## Current environment model

### Local

- SQLite
- local uploads
- `MAIL_PROVIDER=FILE`
- `AUTH_DEBUG_LINKS=true`

### Preview

- current runtime: homelab preview on `https://preview.damit.kr`
- current DB mode: Postgres rehearsal on preview
- root still remains on SQLite
- current mail mode: `RESEND`
- current customer confirmation delivery mode:
  - Kakao AlimTalk primary when provider/template config is present
  - SMS fallback when Kakao send fails and SMS sender config is present
  - manual follow-up when phone or provider config is missing
- current auth mode: `SameSite=Strict` session cookies, refresh CSRF required, trusted-origin enforcement ON

### Production

- current runtime: homelab public root on `https://damit.kr`
- current DB mode: SQLite pilot
- next DB target: external Postgres after preview rehearsal
- current mail mode: `MAIL_PROVIDER=RESEND`
- current customer confirmation delivery mode:
  - automated delivery foundation is live in code
  - live trust still depends on `SOLAPI_*` credentials and Kakao template parity
- current auth mode: `AUTH_DEBUG_LINKS=false`, `AUTH_ENFORCE_TRUSTED_ORIGIN=true`

## Auth hardening defaults

- refresh endpoint requires `x-csrf-token`
- refresh rotates both session id and refresh token
- session cookies default to `SameSite=Strict`
- idle timeout default is 12 hours
- login challenge TTL default is 15 minutes
- proxy-derived client IP is trusted only when the request comes from a trusted local/private proxy hop
- JSON body limit default is `64 KiB`
- multipart request body limit default is `15 MiB`
- single upload file limit default is `10 MiB`
- auth challenge public rate limit default is `5 / 10 minutes / IP`
- auth verify public rate limit default is `12 / 10 minutes / IP`
- customer confirmation read public rate limit default is `30 / 10 minutes / IP`
- customer confirmation acknowledge public rate limit default is `6 / 10 minutes / IP`
- invitation create rate limit default is `8 / 10 minutes / owner-company`
- invitation reissue rate limit default is `12 / 10 minutes / owner-company`

## Public abuse hardening check

1. hit `/api/v1/auth/challenges` repeatedly from the same IP and confirm `429`
2. hit `/api/v1/public/confirm/:token` repeatedly from the same IP and confirm `429`
3. confirm `Retry-After` is present on rate-limited responses
4. keep real mail cutover disabled until sender-domain verification is complete

## Invitation abuse hardening check

1. create several invitations from the same owner/company in a short window and confirm `429`
2. reissue several invitations from the same owner/company in a short window and confirm `429`
3. confirm `Retry-After` is present on invitation create/reissue throttles
4. keep the repository-level per-email and per-invitation cooldown behavior intact

## Preview checks

1. `GET /api/v1/health`
2. open `https://preview.damit.kr`
3. confirm login, home, app, ops, account, admin load on preview
4. confirm preview env values differ from root before any DB rehearsal

Expected current result:

- health is green
- preview app is reachable
- preview health reports `storageEngine=POSTGRES`
- root health reports `storageEngine=SQLITE`

## Home/App surface rule

- `/home` is the operational starting point
- `/app` is the selected-job execution hub
- use `/home` for:
  - company context
  - session state
  - memberships
  - invitations
  - deciding where to go next
- use `/app` for:
  - capture
  - quote
  - draft
  - confirm

## Supabase attach checklist

1. create a Supabase project for preview rehearsal
2. copy the connection string from `Connect`
3. set `DATABASE_URL` on the preview/homelab env
4. set `POSTGRES_SSL_MODE=require`
5. set `POSTGRES_APPLICATION_NAME`
6. run `npm run pg:readiness`
7. run `npm run pg:preflight`
8. run `npm run migrate:status`
9. only after readiness and preflight are green, proceed with migration and runtime cutover discussion

## Preview Postgres rehearsal

1. keep root runtime on `3210`
2. prepare a separate preview env and stack on `3211`
3. run:
   - `bash deploy/homelab/rehearse-postgres-cutover.sh`
4. confirm local health reports `storageEngine=POSTGRES`
5. temporarily point `preview.damit.kr` to `127.0.0.1:3211` in `/etc/cloudflared/config.yml`
6. restart `cloudflared`
7. confirm:
   - `curl https://preview.damit.kr/api/v1/health`
8. when the rehearsal is complete or fails:
   - `bash deploy/homelab/rollback-to-sqlite.sh`
9. point `preview.damit.kr` back to `127.0.0.1:3210`
10. confirm preview is back on SQLite

## Preview Postgres acceptance gate

1. create an authenticated QA artifact without enabling debug links:
   - `npm run qa:preview:bootstrap:production-local`
2. confirm the artifact targets `https://preview.damit.kr`
3. use the returned cookie bundle for browser QA
4. verify at minimum:
   - `/home`
   - `/account`
   - `/app`
   - `/ops`
5. if invite/join proof is needed, run the bootstrap script again with:
   - `--invite-email=...`
   - `--invite-display-name=...`
6. do not discuss root Postgres cutover until preview acceptance and rollback are both proven

### Env hygiene note

- when updating homelab env files, prefer helper scripts that replace an existing key instead of appending another line
- duplicated keys can leave the live runtime with the last unexpected value even when an earlier line looks correct

### Tunnel hygiene note

- before switching preview between `3210` and `3211`, confirm there is only one active `cloudflared` process for the tunnel
- a stale user-run `cloudflared` process can keep serving an old ingress mapping even after the systemd service is restarted

## Preview QA bootstrap

1. keep preview on Postgres
2. keep `AUTH_DEBUG_LINKS=false`
3. run:
   - `npm run qa:preview:bootstrap:production-local`
4. note the generated JSON artifact path
5. use `owner.cookies` or `invitee.cookies` for browser-based preview QA
6. verify:
   - `/home`
   - `/account`
   - `/app`
   - `/ops`
7. do not add any public runtime shortcut for QA

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

## Local Postgres runtime smoke

1. keep Supabase connection values in `.env.production.local`
2. use a valid Postgres connection string, not the dashboard `https://` URL
3. run:
   - `npm run pg:readiness:production-local`
   - `npm run pg:preflight:production-local`
   - `npm run migrate:status:production-local`
   - `npm run smoke:pg:production-local`
4. confirm the smoke reports:
   - `health`
   - owner login
   - invitation/join
   - company switch
   - job case create
   - field record create/link
   - quote update
   - draft generation
   - agreement record
5. do not discuss runtime cutover until all four commands are green
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

## Customer confirmation auto-delivery cutover

1. set `KAKAO_BIZMESSAGE_PROVIDER=SOLAPI`
2. set `SMS_PROVIDER=SOLAPI`
3. set `SOLAPI_API_KEY`
4. set `SOLAPI_API_SECRET`
5. set `SOLAPI_SENDER_NUMBER`
6. set `SOLAPI_KAKAO_PFID`
7. set `SOLAPI_KAKAO_TEMPLATE_ID`
8. confirm the Kakao template variables match the app contract:
   - `#{서비스명}`
   - `#{고객명}`
   - `#{현장명}`
   - `#{확인링크}`
   - `#{만료시각}`
   - `#{확정금액}`
9. issue a customer confirmation link on preview and confirm one of:
   - `AUTO_DELIVERED`
   - `AUTO_DELIVERED_FALLBACK_SMS`
10. confirm `/app/confirm`, `/ops`, and `/account` read the delivery result correctly before trusting the path on root
6. keep `AUTH_ENFORCE_TRUSTED_ORIGIN=true`
7. optionally add `TRUSTED_ORIGINS` only when more than one trusted browser origin is intentionally allowed
8. verify login challenge delivery from `/login` without relying on any debug link

Current result:

- live public runtime already uses `MAIL_PROVIDER=RESEND`
- `AUTH_DEBUG_LINKS=false` should remain true for public and preview unless an isolated debug drill is intentional
- next mail work is not initial delivery, but monitoring and channel expansion


## Ops auth/mail readiness check

1. open /ops as owner
2. confirm the login delivery mode matches the current environment
3. confirm debug login link exposure is OFF before real-mail cutover
4. confirm trusted-origin enforcement is ON before real-mail cutover
5. if MAIL_PROVIDER=RESEND, confirm both MAIL_FROM and RESEND_API_KEY are shown as configured

## Sentry enablement

1. set `SENTRY_DSN`
2. optionally set `SENTRY_ENVIRONMENT` and `SENTRY_RELEASE`
3. redeploy the app
4. confirm `/ops` no longer shows the monitoring-disabled warning
5. keep Sentry optional in local development by leaving `SENTRY_DSN` empty

## Local real mail smoke

1. keep real mail credentials in `.env.production.local`
2. set `MAIL_PROVIDER=RESEND`, `MAIL_FROM`, `RESEND_API_KEY`, and `MAIL_SMOKE_TEST_EMAIL`
3. keep `AUTH_DEBUG_LINKS=false` and `AUTH_ENFORCE_TRUSTED_ORIGIN=true`
4. run `npm run smoke:mail:production-local`
5. confirm the command returns `delivery.provider=RESEND`
6. manually open the recipient inbox and verify the login email arrived
