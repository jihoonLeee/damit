# SUPABASE_POSTGRES_READINESS_RUNBOOK

Date: 2026-03-27
Owner: PM

## Goal

Prepare the project for a managed Postgres target without rushing the runtime cutover.

## PM verdict

- preferred external DB target: `Supabase Postgres`
- current runtime cutover status: `HOLD`
- current preparation status: `GO`

## 1. Create the Supabase project

1. create a new Supabase project
2. keep the region close to the main user base if possible
3. keep the project name explicit, for example:
   - `damit-prod`
   - `damit-staging`

## 2. Collect the required values

You will need:

- `DATABASE_URL`
- `POSTGRES_SSL_MODE=require`
- `POSTGRES_APPLICATION_NAME`
- `POSTGRES_POOL_MAX`

Recommended:

```env
DATABASE_URL=postgres://...
POSTGRES_SSL_MODE=require
POSTGRES_APPLICATION_NAME=damit-production
POSTGRES_POOL_MAX=10
```

## 3. Run readiness before preflight

Use:

```bash
npm run pg:readiness
```

This should confirm:

- `DATABASE_URL` exists
- SSL posture is explicit
- pool sizing is explicit
- application naming is explicit
- provider looks like Supabase or is at least a valid external Postgres target

## 4. Run actual preflight

Use:

```bash
npm run pg:preflight
```

This should confirm:

- DB connection succeeds
- SSL is accepted
- migration table visibility works
- migration inventory can be read

## 5. Check migration status

Use:

```bash
npm run migrate:status
```

If migrations are pending, do not cut over the runtime yet.

## 6. Cutover gate

Only consider runtime cutover after:

1. readiness is green
2. preflight is green
3. migration status is understood
4. backup and restore steps are documented
5. a staging smoke is available

## 7. PM recommendation

Do not jump straight from SQLite to live runtime Postgres just because the DB credentials exist.

Use this sequence:

1. Supabase project
2. readiness
3. preflight
4. migration status
5. restore confidence
6. staging/runtime smoke
7. only then production cutover discussion
