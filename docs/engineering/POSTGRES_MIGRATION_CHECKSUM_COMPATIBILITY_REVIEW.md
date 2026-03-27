# POSTGRES_MIGRATION_CHECKSUM_COMPATIBILITY_REVIEW

## Verdict

- GO

## What changed

- normalized Postgres migration checksums to LF line endings
- added explicit legacy checksum compatibility for the already-applied `0001_production_core` migration
- added a repair script for `schema_migrations.checksum`
- extended migration status to expose `checksumState`
- updated the preview rehearsal script to build first and run checksum repair before migration apply

## Why this was necessary

- the preview Postgres rehearsal was blocked by a checksum mismatch on `0001_production_core`
- the mismatch came from a legacy checksum recorded from a non-canonical working-tree variant, not from a schema/content drift

## Evidence

- local repair against the Supabase rehearsal database succeeded:
  - `0001_production_core` repaired from `248c...` to `2aa6...`
- `npm run migrate:status:production-local` now reports:
  - `checksumState=match` for both migrations
- the server-side preview rehearsal now reaches:
  - readiness
  - preflight
  - checksum repair
  - migration apply/status
  - preview Postgres container health on `127.0.0.1:3211`

## Remaining gap

- public preview cutover is still waiting on the manual `sudo` step to repoint `/etc/cloudflared/config.yml` from `3210` to `3211`
- rollback proof is still pending until that public switch is exercised and then reverted
