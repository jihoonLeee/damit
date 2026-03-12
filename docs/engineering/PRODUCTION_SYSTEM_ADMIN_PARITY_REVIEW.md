# PRODUCTION_SYSTEM_ADMIN_PARITY_REVIEW

## Purpose

- move admin storage operations behind `systemRepository`
- remove SQLite-only backup/reset behavior from app routes
- make operational tooling ready for a future Postgres runtime without forcing cutover yet

## Participants

- `PM`
- `Feature`
- `Builder`
- `QA`

## Current state

- `GET /api/v1/health` still calls `getStorageSummary()` directly from `store.js`
- `GET /api/v1/admin/storage-status` still calls `getStorageSummary()` directly from `store.js`
- `POST /api/v1/admin/backup` still calls `createBackup()` directly from `store.js`
- `POST /api/v1/admin/reset-data` still calls `createBackup()` and `resetDb()` directly from `store.js`
- Postgres `systemRepository` only supports `getStorageSummary`
- Postgres `createBackup` and `resetAllData` are still `createNotImplemented(...)`

## Problem

- the main app flows are increasingly repository-backed, but admin operations are still SQLite-only
- if runtime storage switches to Postgres, backup/reset routes become immediate blockers
- PM cannot approve cutover readiness while operational runbook paths depend on direct SQLite helpers

## Decision

### PM

- do not cut over runtime yet
- first make admin/storage routes repository-backed
- backup/reset parity is a conservative, high-leverage batch because it improves ops safety without changing product behavior

### Feature

- admin route response shapes should stay stable enough for current runbooks
- `health`, `storage-status`, `backup`, and `reset-data` must still work for current SQLite runtime
- no user-facing product screens should change in this batch

### Builder

- route all admin storage operations through `repositories.systemRepository`
- implement Postgres `createBackup` as a logical snapshot export written to `backupDir`
- implement Postgres `resetAllData` as an operational-data reset, not a tenant/auth reset
- keep auth/company tables untouched during Postgres reset

### QA

- SQLite behavior must remain green
- repository parity tests must cover SQLite and Postgres system operations
- staging SQLite runtime must still pass backup/reset smoke
- staging Postgres should be verifiable through a one-off admin smoke without full runtime cutover

## In scope

- repository-backed `health` and `storage-status`
- repository-backed `backup` and `reset-data`
- Postgres logical backup export for operational tables
- Postgres operational reset for product data tables only
- runbook alignment and staging verification

## Out of scope

- full runtime Postgres cutover
- auth repository migration
- tenant/auth data reset
- object storage provider cutover
- production deploy

## Postgres reset boundary

The reset should clear only product-operational tables:

- `customer_confirmation_events`
- `customer_confirmation_links`
- `audit_logs`
- `timeline_events`
- `agreement_records`
- `message_drafts`
- `scope_comparisons`
- `field_record_photos`
- `field_records`
- `job_cases`

The reset should not clear:

- `users`
- `companies`
- `memberships`
- `login_challenges`
- `sessions`
- `invitations`
- `schema_migrations`

## Acceptance criteria

- app routes no longer call direct SQLite backup/reset helpers
- SQLite admin route behavior stays green
- Postgres system repository supports `getStorageSummary`, `createBackup`, and `resetAllData`
- Postgres backup produces a real file in `backupDir`
- staging verification covers both SQLite runtime admin routes and Postgres one-off admin smoke

## PM judgment

- this is the right next batch
- after this batch, PM can judge cutover readiness with fewer operational unknowns
