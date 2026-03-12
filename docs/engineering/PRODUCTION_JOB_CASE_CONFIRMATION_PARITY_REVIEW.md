# PRODUCTION_JOB_CASE_CONFIRMATION_PARITY_REVIEW

## Purpose

- move the remaining app-layer job case creation write behind repositories
- move customer confirmation link issue/view/acknowledge behavior behind repositories
- close the schema gap between SQLite customer confirmation state and Postgres customer confirmation state
- reduce the remaining uncertainty before any broader Postgres write cutover decision

## Participants

- `PM`
- `Feature`
- `Builder`
- `QA`

## Current state

- `POST /api/v1/job-cases` still writes through `updateDb()` in `app.js`
- customer confirmation flows still depend on `customer-confirmation-store.js` directly
- job case detail reads the latest customer confirmation link outside repository contracts
- public confirmation payload still reads SQLite rows directly from `readDb()`
- Postgres `0001_production_core.sql` contains customer confirmation tables, but it does not yet store:
  - `viewed_at`
  - `confirmed_at`
  - `confirmation_note`
  - `request_ip`
  - `user_agent`

## Problem

- write parity is still incomplete while job case create remains an app-layer mutation
- customer confirmation behavior cannot move to runtime Postgres safely without repository contracts
- SQLite and Postgres do not currently share the same customer confirmation state model
- PM cannot judge cutover readiness while detail, public view, and confirmation writes depend on mixed storage paths

## Decision

### PM

- this batch should still optimize for parity, not cutover
- job case creation must move into `jobCaseRepository`
- customer confirmation must gain its own repository contract
- the Postgres schema gap is a blocker for this batch and should be fixed now with a forward migration

### Feature

- user-facing API behavior must stay the same
- job case create response shape must remain stable
- customer confirmation issue/view/acknowledge responses must remain stable
- detail payload and public confirmation payload must still show the latest confirmation state

### Builder

- add `jobCaseRepository.create`
- add `customerConfirmationRepository.createLink`
- add `customerConfirmationRepository.getLatestByJobCaseId`
- add `customerConfirmationRepository.getViewByToken`
- add `customerConfirmationRepository.acknowledge`
- keep the public confirmation token model unchanged
- add a Postgres migration that aligns confirmation state columns with SQLite/runtime expectations

### QA

- route regression must stay green for:
  - job case create
  - customer confirmation issue
  - customer confirmation public view
  - customer confirmation acknowledge
  - detail latest confirmation state
- repository-level tests must cover both SQLite and Postgres implementations
- migration status must show the new confirmation-state migration as applied in staging before PM signs off

## In scope

- repository-backed job case create persistence
- repository-backed customer confirmation link create
- repository-backed customer confirmation latest-link read
- repository-backed customer confirmation public view state transition
- repository-backed customer confirmation acknowledgement state transition
- repository-backed public confirmation payload assembly
- Postgres schema migration for missing customer confirmation state columns

## Out of scope

- confirmation link token redesign
- email delivery copy changes
- full runtime Postgres cutover
- external object storage provider cutover
- owner-token removal

## Acceptance criteria

- `POST /api/v1/job-cases` no longer writes through `updateDb()` directly
- confirmation routes no longer import `customer-confirmation-store.js` from `app.js`
- job case detail gets latest confirmation state through repositories
- public confirmation payload no longer depends on `readDb()` directly
- Postgres migration status includes the new confirmation-state migration
- SQLite and Postgres repository tests cover the new methods

## PM judgment

- this is the right next batch
- after this batch, the remaining write-parity surface becomes smaller and easier to reason about
- PM should reevaluate cutover readiness only after this parity batch and one more staging smoke pass
