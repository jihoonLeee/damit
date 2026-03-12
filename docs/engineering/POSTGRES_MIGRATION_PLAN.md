# POSTGRES_MIGRATION_PLAN

## Purpose

- Define how the app moves from SQLite to a production-grade Postgres architecture.
- Keep the provider choice realistic for the current stage.

## PM summary

- Today: `SQLite on Fly volume`
- First external Postgres target: `Supabase Free`
- Later upgrade path: a paid managed Postgres provider once usage justifies it

## Why this plan changed

- The previous default assumed Fly Managed Postgres too early.
- At the current stage, cost discipline matters more than infrastructure symmetry.
- We still need to finish the runtime Postgres adapter, so a cheaper external Postgres target is the better first step.

## Engineering conclusion

- SQLite is still the right live runtime for pilot.
- Postgres work should continue in parallel so the codebase becomes provider-ready.
- The first real DB connection for staging should come from Supabase.

## Target architecture

### App

- Fly.io app remains the application host.
- app servers should remain stateless over time.

### Database

- staging first target: Supabase Free Postgres
- production later target: paid managed Postgres after usage and ops maturity increase
- migration-first workflow remains mandatory

### File storage

- object storage remains the target for images and backup artifacts
- preferred order:
  - `Cloudflare R2`
  - `AWS S3`
  - `Supabase Storage` only if we intentionally consolidate vendors later

## Provider notes

### Supabase direct connection

Use this first for Fly.io VMs when available.

### Supabase session pooler

Use this as fallback when direct connectivity is not suitable.

### Production later

Once external beta and paid usage are real, re-evaluate whether Supabase paid, Neon, or another managed Postgres provider is the better long-term home.

## Phases

### Phase 0. Preparation

- keep repository abstraction moving forward
- keep schema migrations versioned and explicit
- keep staging environment separate from production
- attach Supabase staging DB only after preflight is ready

### Phase 1. Parallel schema design

- design production-grade Postgres schema
- add company, membership, user, session, invitation, and audit tables
- add tenant columns to business tables

### Phase 2. Application abstraction

- separate repository interfaces from SQLite implementation
- keep contract tests shared
- make provider switching an infrastructure concern, not an app concern

### Phase 3. Staging DB validation

- provision Supabase staging project
- configure `DATABASE_URL`
- run `npm run pg:preflight`
- verify SSL and migration state
- apply migrations only after validation is green

### Phase 4. Runtime cutover rehearsal

- implement real Postgres read/write repositories
- run staging smoke tests against Postgres-backed runtime
- verify tenant isolation and auth consistency

### Phase 5. Production planning

- decide whether to keep Supabase or move to a paid provider
- define backup, restore, and rollback procedure for the chosen provider

## PM gates

### G-P1. Data integrity

- row counts match
- derived status results match
- Korean text, money fields, and photo metadata remain intact

### G-P2. Isolation safety

- zero cross-company leakage
- STAFF scope tests pass

### G-P3. Operations

- backup and restore rehearsal passes
- rollback rehearsal passes
- file storage restore path is documented

### G-P4. Cost realism

- the chosen DB provider matches current revenue stage
- no unnecessary fixed infrastructure cost is introduced before validation