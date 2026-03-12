# LOCAL_RESTORE_REHEARSAL_REPORT

Date: 2026-03-12
Environment: isolated local temp environment
Decision: PASS

## Goal

- prove `backup -> reset -> restore -> verify` for the active local SQLite runtime
- include both DB state and upload files

## Executed commands

- `node D:\AI_CODEX_DESKTOP\tests\local-restore-rehearsal.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\local-restore-rehearsal.mjs`

## Verified results

- SQLite DB backup file created successfully
- upload directory backup created successfully
- reset removed operational data
- SQLite restore returned:
  - `jobCases = 1`
  - `fieldRecords = 1`
  - `agreements = 1`
- upload restore returned:
  - `fileCount = 1`
- final verification confirmed:
  - restored field record note survived
  - restored field record photo metadata survived
  - restored upload file exists on disk again

## Important implementation note

The rehearsal exposed and fixed two meaningful SQLite/local issues:

1. SQLite DB backup needed `PRAGMA wal_checkpoint(FULL)` before file copy.
2. local object storage adapter creation needed to use the current runtime config, not module-init config.

## PM judgment

- local SQLite restore rehearsal is complete
- this is sufficient to improve local operational confidence
- this does not replace staging or production restore rehearsal
