# POSTGRES_SERVER_CUTOVER_REHEARSAL_PLAN

## Goal

- prove a reversible server-side Postgres runtime on the homelab server
- keep `damit.kr` root traffic untouched
- use `preview.damit.kr` as the only public rehearsal target

## Why this batch

- local Postgres readiness, preflight, migration status, and runtime smoke are already green
- the missing evidence is no longer code-path maturity, but server-side rollout and rollback proof

## Constraints

- current root and preview both point to the same homelab app stack on port `3210`
- a safe rehearsal must not replace the root SQLite runtime
- Cloudflare tunnel config still lives outside this repository

## Approach

### Runtime shape

- keep the current root stack on `3210`
- launch a second homelab stack for rehearsal on `3211`
- use a separate compose project name and container name
- use a separate env file for the rehearsal stack

### Preview-only public routing

- temporarily point `preview.damit.kr` to `127.0.0.1:3211`
- keep `damit.kr` on `127.0.0.1:3210`
- after the rehearsal, point preview back to `3210`

## Deliverables

- `deploy/homelab/.env.preview-postgres.example`
- reusable compose/deploy support for alternate env files and project names
- `deploy/homelab/rehearse-postgres-cutover.sh`
- `deploy/homelab/smoke-postgres-runtime.sh`
- `deploy/homelab/rollback-to-sqlite.sh`
- rollback runbook

## Rehearsal flow

1. backup the current homelab env
2. prepare a preview-only Postgres env file
3. run Postgres preflight
4. apply migrations
5. deploy the second compose stack on `3211`
6. smoke the rehearsal stack locally
7. repoint preview to `3211`
8. smoke `https://preview.damit.kr`
9. rollback:
   - point preview back to `3210`
   - stop and remove the rehearsal stack

## Exit criteria

- the rehearsal stack serves health with `storageEngine=POSTGRES`
- Postgres preflight and migration status are green on the server
- preview can be moved to Postgres and then back to SQLite without root downtime
- rollback steps are documented and scriptable
