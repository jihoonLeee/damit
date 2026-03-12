# PRODUCTION_POSTGRES_AUTH_RUNTIME_READINESS_REVIEW

Date: 2026-03-12
Decision: GO for auth/session/company-context repository parity

## Purpose

- remove the remaining SQLite-only auth/session/company-context dependency from runtime paths
- make staging runtime Postgres validation credible without forcing full cutover yet
- keep product behavior stable while moving auth persistence behind repository contracts

## Participants

- `PM`
- `Feature`
- `Builder`
- `QA`

## Current state

- auth routes in [app.js](/D:/AI_CODEX_DESKTOP/src/app.js) still import SQLite auth helpers directly from [auth-store.js](/D:/AI_CODEX_DESKTOP/src/auth-store.js)
- [auth-runtime.js](/D:/AI_CODEX_DESKTOP/src/auth-runtime.js) still resolves session and refresh through SQLite auth helpers
- Postgres schema already contains the required auth tables:
  - `users`
  - `companies`
  - `memberships`
  - `login_challenges`
  - `sessions`
  - `invitations`
- Postgres repository support is incomplete because [createPostgresRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/postgres/createPostgresRepositoryBundle.js) still leaves auth writes unimplemented

## Problem

- PM cannot approve runtime Postgres smoke while auth/session/company context still runs through SQLite-only code paths
- partial migration of only `issueChallenge` and `verifyChallenge` would still leave refresh, logout, company switching, and invitation management on a different persistence path
- that mixed runtime would create misleading proof and make the next cutover review noisy

## Decision

### PM

- do not do a half-step auth migration
- move the full runtime auth/session/company-context surface behind `authRepository`
- keep external behavior stable, but remove app/runtime dependence on direct `auth-store.js`

### Feature

- preserve current route response shapes for:
  - `POST /api/v1/auth/challenges`
  - `POST /api/v1/auth/verify`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/me`
  - `GET /api/v1/companies`
  - `POST /api/v1/companies/:id/switch-context`
  - `GET /api/v1/companies/:id/memberships`
  - `GET /api/v1/companies/:id/invitations`
  - `POST /api/v1/companies/:id/invitations`
- keep magic-link only login behavior
- keep owner-token fallback for pilot/admin behavior unchanged

### Builder

- expand `authRepository` to cover the runtime auth/session/company-context surface
- make SQLite repository delegate to `auth-store.js` so current behavior stays stable
- implement the same contract in Postgres using existing auth tables
- update `app.js` and `auth-runtime.js` to use repositories instead of direct auth-store imports
- keep invitation acceptance inside verify flow so first login + invite acceptance still works end-to-end

### QA

- existing auth foundation behavior must stay green on SQLite runtime
- repository-level auth parity tests must cover SQLite and Postgres implementations
- Postgres auth runtime readiness must be provable in-process before any staging cutover attempt
- PM sign-off for the next cutover review requires one integrated proof set, not isolated unit passes only

## In scope

- `authRepository.issueChallenge`
- `authRepository.verifyChallenge`
- `authRepository.getSessionContext`
- `authRepository.refreshSessionByRefreshToken`
- `authRepository.revokeSession`
- `authRepository.revokeSessionByRefreshToken`
- `authRepository.switchSessionCompany`
- `authRepository.createInvitation`
- `authRepository.listMembershipsByCompany`
- `authRepository.listInvitationsByCompany`
- `authRepository.listCompaniesForUser`
- route/runtime migration from direct auth store imports to repository usage
- SQLite/Postgres auth parity tests

## Out of scope

- external mail provider cutover
- object storage provider cutover
- production runtime cutover
- restore drill
- removal of owner-token pilot mode

## Acceptance criteria

- [app.js](/D:/AI_CODEX_DESKTOP/src/app.js) no longer imports runtime auth write/session helpers from [auth-store.js](/D:/AI_CODEX_DESKTOP/src/auth-store.js)
- [auth-runtime.js](/D:/AI_CODEX_DESKTOP/src/auth-runtime.js) resolves session and refresh through repositories
- SQLite runtime auth tests remain green
- Postgres repository auth parity tests cover login, refresh, invitation acceptance, company switch, and listing APIs
- PM can schedule a staging `STORAGE_ENGINE=POSTGRES` smoke next without unresolved mixed-auth ambiguity

## PM judgment

- this is the right next batch
- it is larger than the last parity slices, but still conservative because it closes one boundary completely instead of splitting it again
- once this batch is green, PM can review whether staging runtime Postgres smoke is now worth executing
