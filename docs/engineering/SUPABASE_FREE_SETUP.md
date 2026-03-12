# SUPABASE_FREE_SETUP

## Purpose

- Define the lowest-cost external Postgres path for this project.
- Use Supabase Free as the default staging and early-beta Postgres provider.
- Keep Fly.io as the app host while moving only the database to Supabase when needed.

## Why Supabase Free

PM decision:

- Keep the live pilot on SQLite for now.
- Use Supabase Free as the first external Postgres target instead of Fly Managed Postgres.

Why:

- lower fixed cost at the current stage
- fast way to get a real Postgres connection string
- clear dashboard for connection details and password reset
- easy path to upgrade later if usage grows

Official references:

- [Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Supabase connect to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase backup and restore using CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)

## Current recommended architecture

- App: Fly.io
- Runtime today: SQLite on Fly volume
- First external Postgres target: Supabase Free
- Mail for external beta later: Resend

## What you need from Supabase

### 1. Project

Create a new Supabase project for staging.

Recommended name:

- `damit-staging`

### 2. Database password

You need the database password for the project.

Where to get it:

- open the Supabase project dashboard
- click `Connect`
- if needed, reset the DB password in Database Settings

### 3. Connection string

You will use one of the connection strings shown under `Connect`.

Supabase official guidance:

- for persistent servers and VMs, use the direct connection string if IPv6 is supported
- for environments where direct IPv6 is not available, use the session pooler connection string

Because this app runs on Fly.io VMs, the default recommendation is:

- first try the direct connection string
- if direct connectivity fails, fall back to the session pooler connection string

Examples from Supabase docs:

- Direct:
  - `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- Session pooler:
  - `postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

## Staging setup flow

1. Create a Supabase project
2. Open `Connect`
3. Copy the direct connection string
4. Replace the placeholder password with the actual DB password
5. Set staging Fly secrets:
   - `DATABASE_URL`
   - `POSTGRES_SSL_MODE=require`
   - `POSTGRES_APPLICATION_NAME=damit-staging-app`
   - `POSTGRES_POOL_MAX=10`
6. Run `npm run pg:preflight`
7. If direct connection fails, switch `DATABASE_URL` to the session pooler string and retry
8. Only after preflight is green, start the runtime Postgres adapter batch

## Fly secret example

Use this pattern on the staging app:

- `fly secrets set DATABASE_URL=... --app field-agreement-jihoon-staging`
- `fly secrets set POSTGRES_SSL_MODE=require POSTGRES_APPLICATION_NAME=damit-staging-app POSTGRES_POOL_MAX=10 --app field-agreement-jihoon-staging`

## PM rules

- Do not cut staging runtime over to Postgres just because the connection string exists.
- Preflight must be green first.
- Runtime Postgres read/write paths must be ready first.
- Production must not share the same Supabase project as staging.

## Cost posture

At the time of writing, Supabase Free includes:

- free projects under the Free plan
- `500 MB` database size per project
- `1 GB` storage quota per project

This is enough for early staging and small beta validation, but not a long-term production target.

## When to upgrade away from Supabase Free

Consider the next step when one or more of these become true:

- staging or beta usage is no longer tiny
- DB size approaches the free quota
- external beta depends on stricter backup or network controls
- performance and connection behavior need tighter guarantees