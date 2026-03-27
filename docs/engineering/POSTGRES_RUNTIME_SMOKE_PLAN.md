# POSTGRES_RUNTIME_SMOKE_PLAN

Date: 2026-03-27
Owner: PM
Status: proposed

## Why this batch

- Supabase readiness and preflight are now green.
- The next gate before any runtime cutover discussion is a real application smoke with `STORAGE_ENGINE=POSTGRES`.
- This smoke should validate app behavior, not just raw connectivity.

## Scope

### 1. Supabase pooler host recognition

- Treat `*.pooler.supabase.com` as a Supabase target in readiness checks.

### 2. Local Postgres runtime smoke

- Load `.env.production.local`
- Override runtime to a local isolated smoke server
- Force:
  - `STORAGE_ENGINE=POSTGRES`
  - `MAIL_PROVIDER=FILE`
  - `AUTH_DEBUG_LINKS=true`
  - `AUTH_ENFORCE_TRUSTED_ORIGIN=true`
- Validate:
  - health
  - owner login
  - second company invitation/join
  - context switching
  - job case creation
  - quote update
  - draft generation
  - agreement recording

## PM judgment

- `runtime smoke`: GO
- `production runtime cutover`: still HOLD until this smoke is green and the server-side rollout sequence is explicit
