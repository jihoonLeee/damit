# PRODUCTION_RESTORE_REHEARSAL_REVIEW

Date: 2026-03-12
Decision: GO for local restore rehearsal tooling

## Purpose

- close the current gap between backup creation and actual recovery
- prove that local SQLite runtime plus local uploads can be restored together
- generate PM evidence for `PROD-22` without waiting on staging infrastructure

## Participants

- `PM`
- `Feature`
- `Builder`
- `QA`

## Current state

- SQLite backup creation exists through [store.js](/D:/AI_CODEX_DESKTOP/src/store.js)
- Postgres logical backup export exists through `systemRepository.createBackup`
- reset paths exist for SQLite and Postgres operational data
- there is still no executable restore path for local SQLite data and local uploads

## Problem

- PM cannot claim operational readiness while backup files exist but restoration is still manual and unproven
- current object storage foundation still uses local volume in active runtimes, so file restore matters now, not later
- staging Postgres hold should not stop us from proving local recovery discipline

## Decision

### PM

- use the local environment to finish a real `backup -> reset -> restore -> verify` drill
- the drill must include both DB state and upload files
- keep this batch local-first and conservative

### Feature

- no product behavior change is required
- any user-facing API change is out of scope unless it directly supports safe restore operations

### Builder

- add reusable local restore helpers for SQLite DB and local upload directory snapshots
- avoid destructive defaults; restore should require explicit file paths
- add one script that performs a full local rehearsal in an isolated temp environment

### QA

- the rehearsal should prove:
  - records return after restore
  - timeline-related data survives
  - uploaded file paths exist again after restore
- the test should not depend on external services or Fly

## In scope

- SQLite DB restore helper
- local upload snapshot/restore helper
- isolated restore rehearsal script
- automated local restore rehearsal test
- runbook and readiness updates

## Out of scope

- staging restore drill
- Supabase backup restore
- object storage provider migration
- production cutover

## Acceptance criteria

- local tooling can back up SQLite DB and local uploads separately
- local tooling can restore SQLite DB and local uploads from explicit backup paths
- an automated rehearsal passes in an isolated temp environment
- PM can mark local restore rehearsal as complete while staging restore remains pending

## PM judgment

- this is the highest-value local completion step while staging remains blocked
