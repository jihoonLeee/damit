# POSTGRES_MIGRATION_CHECKSUM_COMPATIBILITY_PLAN

## Goal

- unblock the server-side preview Postgres rehearsal without weakening migration integrity
- make Postgres migration checksums stable across Windows and Linux working trees
- provide a safe repair path for already-applied legacy checksums

## Problem

- `migrate-postgres` fails on the rehearsal server with `Migration checksum mismatch for 0001_production_core`
- the current migration status command only reports applied/pending and does not expose checksum drift
- the mismatch is caused by a legacy checksum that was recorded from a non-canonical working-tree variant

## Constraints

- existing Supabase data should not be wiped or recreated just to satisfy checksum drift
- current production root remains on SQLite
- the fix should preserve strict mismatch detection for truly incompatible migration content

## Approach

### Canonical checksum

- compute migration checksums from SQL normalized to LF line endings
- use the canonical checksum for all future migration inserts and verification

### Legacy compatibility

- allow a small explicit compatibility list for known legacy checksums that were already applied
- treat those as repairable, not silently ignorable

### Repair path

- add a repair script that updates `schema_migrations.checksum` to the canonical checksum only when the old checksum is in the approved legacy list
- fail hard for unknown mismatches

### Better status output

- extend migration status to report checksum state:
  - `match`
  - `legacy_compatible`
  - `mismatch`

## Deliverables

- canonical checksum helper in `src/db/postgres-migrator.js`
- migration checksum compatibility test coverage
- `scripts/repair-postgres-migration-checksums.mjs`
- rehearsal script updated to run checksum repair before migration apply
- review doc with server rehearsal implications
