# POSTGRES_PROVIDER_SETUP

## Purpose

- Keep this repository aligned on the current external Postgres choice.
- Replace the earlier Fly Managed Postgres-first assumption with a cheaper default.

## Current PM decision

- Live pilot runtime stays on SQLite.
- The first external Postgres provider for staging and early beta is Supabase Free.
- Fly Managed Postgres is no longer the default next step.

Primary guide:

- [SUPABASE_FREE_SETUP.md](/D:/AI_CODEX_DESKTOP/docs/engineering/SUPABASE_FREE_SETUP.md)

## Why this changed

- Fly Managed Postgres is operationally clean but too expensive for the current stage.
- Supabase Free gives us a real Postgres connection string with much lower upfront cost.
- The current code still needs runtime Postgres adapter work, so paying a fixed DB cost early is unnecessary.

## What remains the same

- `npm run pg:preflight` is still the entry point for DB readiness checks.
- `npm run migrate:pg` and `npm run migrate:status` are still the schema tools.
- Staging and production must still use separate secrets and separate databases.

## Next engineering step

- provision a Supabase staging project
- attach `DATABASE_URL` to the Fly staging app
- run preflight until green
- only then start the runtime Postgres adapter batch