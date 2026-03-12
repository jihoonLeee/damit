# STAGING_ENV_SETUP

## Purpose

- Keep staging operationally separate from production.
- Define the cheapest safe path from SQLite bootstrap to external Postgres validation.

## Bootstrap Mode

Current recommended mode.

- `STORAGE_ENGINE=SQLITE`
- `MAIL_PROVIDER=FILE`
- separate Fly app, volume, and owner token

## External DB Validation Mode

Next stage after bootstrap.

- keep the staging app on Fly
- provision a Supabase Free project
- attach `DATABASE_URL`
- run `npm run pg:preflight`
- keep runtime on SQLite until adapter work is ready

## Connection choice for Supabase

Based on Supabase docs:

- use the direct connection string first for persistent VMs like Fly.io
- if direct connection is not suitable, use the session pooler connection string

## Recommended staging app name

- `field-agreement-jihoon-staging`

## Recommended staging DB project name

- `field-agreement-staging`

## Bootstrap deploy order

1. create Fly staging app
2. create Fly staging volume
3. set staging owner secrets
4. run `npm run env:check:staging`
5. deploy staging app
6. verify `GET /api/v1/health`
7. verify `GET /beta-app`
8. verify `GET /api/v1/admin/postgres-preflight`

## Supabase attach order

1. create Supabase staging project
2. open `Connect`
3. copy the direct connection string
4. set `DATABASE_URL` on Fly staging
5. set `POSTGRES_SSL_MODE=require`
6. run `npm run pg:preflight`
7. if needed, retry with the session pooler string

## Hold conditions

- do not point staging to production DB
- do not switch staging runtime to Postgres before adapter readiness
- do not move to external beta while staging mail is still `FILE`