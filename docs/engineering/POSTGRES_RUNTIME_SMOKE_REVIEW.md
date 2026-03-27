# POSTGRES_RUNTIME_SMOKE_REVIEW

Date: 2026-03-27
Owner: PM
Status: complete

## What changed

- Supabase pooler hosts now count as Supabase in readiness checks.
- Added `production-local` readiness, preflight, and migration-status commands that read `.env.production.local`.
- Added a dedicated local runtime smoke for `STORAGE_ENGINE=POSTGRES`.
- Fixed a Postgres `getDetailById` placeholder offset bug that surfaced during the smoke.
- Updated the smoke flow so it follows the real happy path:
  - owner login
  - owner invite/join
  - company switch
  - job case create
  - field record create
  - field record link
  - quote update
  - draft generation
  - agreement recording

## Smoke coverage

The local Postgres runtime smoke now validates:

1. health reports `POSTGRES`
2. owner login/session works
3. second company invitation and join works
4. company context switch works
5. job case creation works
6. field record creation and linking works
7. quote update works
8. draft generation works
9. agreement recording works

## Evidence

- `node tests/postgres-repository-slice1.test.js`
- `node tests/postgres-readiness.test.js`
- `npm run pg:readiness:production-local`
- `npm run pg:preflight:production-local`
- `npm run migrate:status:production-local`
- `npm run smoke:pg:production-local`

## PM judgment

- `Postgres runtime smoke`: GO
- `runtime cutover`: still HOLD until the server-side env switch and rollback path are also documented
