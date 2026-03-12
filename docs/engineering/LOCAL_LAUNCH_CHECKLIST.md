# LOCAL_LAUNCH_CHECKLIST

## Purpose

Use this checklist before any local demo, PM review, or internal pilot rehearsal.

This checklist assumes:

- runtime is `SQLite`
- uploads use `LOCAL_VOLUME`
- auth is either `OWNER token` for pilot workspace or `SESSION` for beta flows

## Preflight

- confirm `.env` or local config still points to `STORAGE_ENGINE=SQLITE`
- confirm app starts with `npm start`
- confirm `GET /api/v1/health` returns `status=ok`
- confirm `storageEngine` in health payload is `SQLITE`
- confirm browser opens `/app` and `/login` without server errors

## Data hygiene

- decide whether the walkthrough should use a clean workspace or seeded demo data
- if clean:
  - run `node scripts/reset-data.mjs`
  - confirm `jobCases=0` in `/api/v1/health`
- if seeded:
  - run `node scripts/seed-demo-data.mjs`
  - verify at least one job case appears in `/app`

## Critical flow

- create a field record with photo, primary reason, and note
- create a new job case and link the field record
- save a revised quote
- generate a draft message
- copy the draft successfully
- save an agreement record
- confirm timeline shows the expected progression

## Auth flow

- verify `/login` loads
- verify magic-link challenge/verify flow works in local beta mode
- verify `/beta-home` loads current company context
- verify invite or company switch still works if testing beta auth

## Operations

- run `node scripts/local-restore-rehearsal.mjs`
- confirm the rehearsal ends with `ok: true`
- verify at least one backup file exists in `data/backups`
- verify upload backup directory is created during rehearsal

## Regression gate

- run `node tests/api.test.js`
- run `node tests/auth-foundation.test.js`
- run `node tests/beta-workspace.test.js`

## PM decision rule

Mark local release `GO` only if:

- P0 flow completes end-to-end
- health is green
- auth regression is green
- restore rehearsal is green
- no new Korean text corruption is introduced in the tested path

Mark local release `HOLD` if:

- backup or restore drill fails
- draft copy or agreement save fails
- auth session/company context regresses
- UI changes require unexplained manual workarounds
