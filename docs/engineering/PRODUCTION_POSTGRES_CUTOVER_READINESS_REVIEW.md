# PRODUCTION_POSTGRES_CUTOVER_READINESS_REVIEW

Date: 2026-03-12
Decision: HOLD for runtime Postgres cutover

## Purpose

- judge whether the app should switch runtime storage from `SQLITE` to `POSTGRES` now
- separate `Postgres-ready in slices` from `safe to cut over today`
- capture the smallest credible next steps under PM control

## Participants

- `PM`
- `Feature`
- `Builder`
- `QA`

## Current positive signals

- Postgres preflight is green in staging
- migrations are green in staging
  - `0001_production_core`
  - `0002_customer_confirmation_state_columns`
- repository parity is in place for:
  - job case read/write core flows
  - field record create/link
  - timeline append
  - customer confirmation issue/view/ack/latest
  - admin backup/reset through `systemRepository`
- staging runtime SQLite smoke is green after each recent batch
- one-off Postgres admin smoke is green against Supabase

## Remaining blockers

### B1. Postgres auth write path is still not implemented

- `authRepository.issueChallenge`
- `authRepository.verifyChallenge`

These are still `createNotImplemented(...)` in [createPostgresRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/postgres/createPostgresRepositoryBundle.js).

### B2. Runtime auth/session stack is not proven against Postgres

- current beta auth flow still depends on SQLite-backed auth store behavior
- there is no end-to-end staging runtime where app storage itself is `POSTGRES`
- PM cannot approve cutover while login/session/company context have not survived a Postgres runtime smoke

### B3. Restore rehearsal is not complete

- backup parity is now in place
- reset parity is now in place
- but restore rehearsal for DB + files is still missing
- PM release gates in [PRODUCTION_READINESS.md](/D:/AI_CODEX_DESKTOP/docs/engineering/PRODUCTION_READINESS.md) still require this

### B4. Cross-tenant and RBAC integrated validation is still incomplete

- repository slices exist
- but PM still lacks a single cutover-grade evidence set for:
  - zero cross-company leakage
  - STAFF visibility limits
  - session/company context safety on Postgres runtime

### B5. Object storage cutover is not finished

- object storage foundation exists
- local provider is production-shaped
- but external object storage provider and restore path are still incomplete
- PM does not require this before every internal test, but does require it before broader production confidence

## Agent discussion

### PM

- `ready for another slice` is not the same as `ready to cut over`
- the project is progressing well, but cutover today would be premature
- the correct move is a tighter readiness batch, not a switch

### Feature

- user-facing core flows are stable enough to keep learning on SQLite runtime
- there is no product urgency that justifies a risky storage cutover this week
- preserving trust is more important than claiming architectural completion

### Builder

- the codebase is much closer to cutover than before
- the remaining work is narrower and clearer now:
  - Postgres auth writes
  - runtime Postgres smoke with session/company context
  - restore rehearsal
- switching now would mostly create debugging load, not user value

### QA

- evidence is strong for repository parity and staging preparedness
- evidence is not yet strong enough for runtime cutover
- the missing proof is integrated, not unit-level

## PM judgment

Decision: `HOLD`

Reason:

- the project is healthy
- the architecture is converging
- but runtime Postgres cutover still has material operational and auth-validation gaps

## Required next batch before reconsidering cutover

### Batch name

- `Postgres auth/runtime readiness`

### Required outputs

- implement Postgres auth write path
- prove challenge -> verify -> session/company context works with runtime `POSTGRES`
- run staging runtime smoke with `STORAGE_ENGINE=POSTGRES`
- document restore rehearsal plan and execute at least one DB-side restore drill
- produce one QA summary focused on cross-tenant/RBAC safety under Postgres runtime

## Re-open criteria for cutover review

PM will re-open the cutover decision only when all of the following are true:

- Postgres auth write path is implemented
- staging runtime actually runs on `POSTGRES`
- runtime smoke is green on Postgres-backed staging
- restore rehearsal evidence exists
- tenant/RBAC QA evidence exists

## Final note

- this is a healthy `HOLD`, not a failure signal
- the project is moving in the right direction
- the right next move is to reduce uncertainty further, not to force a milestone early
