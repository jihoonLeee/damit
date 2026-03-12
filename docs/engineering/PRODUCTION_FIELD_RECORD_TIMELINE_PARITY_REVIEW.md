# PRODUCTION_FIELD_RECORD_TIMELINE_PARITY_REVIEW

## Purpose

- move the remaining storage-heavy field record writes behind repositories
- remove SQLite-only timeline write behavior from core job-case routes
- increase Postgres runtime parity without forcing full cutover yet

## Participants

- `PM`
- `Feature`
- `Builder`
- `QA`

## Current state

- `POST /api/v1/field-records` still writes through `updateDb()` directly
- `POST /api/v1/field-records/{id}/link-job-case` still writes through `updateDb()` directly
- `quote`, `draft`, and `agreement` routes already use repositories for core writes, but timeline write is still a SQLite-only helper
- customer confirmation timeline writes also still bypass repositories

## Problem

- runtime Postgres cannot reach write parity while field record and timeline writes remain in app-layer SQLite mutations
- route behavior is split between repository-backed business writes and special-case local timeline writes
- PM cannot safely judge cutover readiness while this split remains

## Decision

### PM

- this batch should focus on parity, not cutover
- all timeline writes should go through one repository contract
- customer confirmation timeline writes should join the same contract now to avoid leaving another special path behind

### Feature

- API behavior must stay the same
- field record create still returns the same payload shape
- link, quote, draft, agreement, and customer confirmation timeline entries should still appear in the same timeline feed

### Builder

- add `fieldRecordRepository.createCapturedRecord`
- add `fieldRecordRepository.getById`
- add `fieldRecordRepository.linkToJobCase`
- add `timelineEventRepository.append`
- keep object storage file write in app layer for now, but persist metadata through repositories

### QA

- existing P0 happy path must stay green
- timeline count and event presence must remain stable
- repository-level tests must cover both SQLite and Postgres transaction shape for new write methods

## In scope

- repository-backed field record create persistence
- repository-backed field record link persistence
- repository-backed timeline append for:
  - field record link
  - quote update
  - draft create
  - agreement record create
  - customer confirmation link create
  - customer confirmation acknowledgement

## Out of scope

- external object storage provider integration
- field record photo migration utility
- Postgres runtime cutover
- signed customer confirmation links redesign

## Acceptance criteria

- no route uses `appendLocalTimelineEventIfNeeded`
- field record create works in SQLite and remains compatible with Postgres runtime shape
- timeline feed still includes the same key event types
- repository contract tests prove SQLite and Postgres implementations cover the new methods

## PM judgment

- this is the right next batch
- after this batch, the remaining blocker before broader Postgres write rollout becomes narrower and easier to reason about
