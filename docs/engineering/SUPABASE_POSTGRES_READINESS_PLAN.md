# SUPABASE_POSTGRES_READINESS_PLAN

Date: 2026-03-27
Owner: PM
Status: proposed

## Why this batch

- Public domain, live mail, and production-like hosting are now in place.
- The next highest operational risk is state durability, not UI breadth.
- We should not cut over to Postgres yet, but we should make the readiness sequence precise and easy to execute.

## Scope

### 1. Add a dedicated Postgres readiness check

- validate `DATABASE_URL`
- validate SSL posture inputs
- validate pool sizing and application naming
- detect whether the target looks like Supabase
- print decision-ready next steps

### 2. Add a Supabase-first runbook

- create project
- collect connection values
- run readiness check
- run preflight
- verify migration status
- only then consider staging/runtime cutover

## PM judgment

- `readiness tooling`: GO
- `runtime cutover`: HOLD
