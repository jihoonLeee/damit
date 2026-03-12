# PRODUCTION_POSTGRES_AUTH_RUNTIME_IMPLEMENTATION_REVIEW

Date: 2026-03-12
Decision: GO for local completion, HOLD for staging runtime smoke until Fly billing blocker is cleared

## Summary

This batch closed the remaining runtime auth/session/company-context dependency on direct SQLite auth helpers.

The app now routes auth persistence through `repositories.authRepository` for both SQLite and Postgres engines.

## What changed

- expanded [contracts.js](/D:/AI_CODEX_DESKTOP/src/repositories/contracts.js) so `authRepository` now covers:
  - `issueChallenge`
  - `verifyChallenge`
  - `getSessionContext`
  - `refreshSessionByRefreshToken`
  - `revokeSession`
  - `revokeSessionByRefreshToken`
  - `switchSessionCompany`
  - `createInvitation`
  - `listMembershipsByCompany`
  - `listInvitationsByCompany`
  - `listCompaniesForUser`
- wired SQLite repository delegation in [createSqliteRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/sqlite/createSqliteRepositoryBundle.js)
- implemented the same auth contract in [createPostgresRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/postgres/createPostgresRepositoryBundle.js)
- removed direct runtime auth-store dependence from [app.js](/D:/AI_CODEX_DESKTOP/src/app.js)
- updated [auth-runtime.js](/D:/AI_CODEX_DESKTOP/src/auth-runtime.js) to resolve session and refresh through repositories
- added repository-level Postgres auth parity coverage in [postgres-auth-repository-parity.test.js](/D:/AI_CODEX_DESKTOP/tests/postgres-auth-repository-parity.test.js)
- added staging-ready runtime smoke script in [postgres-runtime-auth-smoke.mjs](/D:/AI_CODEX_DESKTOP/scripts/postgres-runtime-auth-smoke.mjs)
- prepared staging runtime config switch in [fly.staging.toml](/D:/AI_CODEX_DESKTOP/fly.staging.toml)

## Local validation

The following suites passed after the refactor:

- [auth-foundation.test.js](/D:/AI_CODEX_DESKTOP/tests/auth-foundation.test.js)
- [api.test.js](/D:/AI_CODEX_DESKTOP/tests/api.test.js)
- [postgres-repository-slice1.test.js](/D:/AI_CODEX_DESKTOP/tests/postgres-repository-slice1.test.js)
- [repository-write-foundation.test.js](/D:/AI_CODEX_DESKTOP/tests/repository-write-foundation.test.js)
- [postgres-auth-repository-parity.test.js](/D:/AI_CODEX_DESKTOP/tests/postgres-auth-repository-parity.test.js)

## PM / Feature / Builder / QA discussion

### PM

- the auth boundary is finally clean enough to justify a real staging runtime smoke
- this batch reduced the biggest architectural ambiguity from the previous cutover review
- do not over-claim completion until staging runtime evidence exists

### Feature

- user-facing auth and company-context APIs stayed stable
- magic-link login, refresh, invite acceptance, and company switching still match the current beta behavior

### Builder

- SQLite remains the stable compatibility path through repository delegation
- Postgres now owns the same runtime auth responsibilities instead of only read helpers
- the new smoke script is session-based so it matches the tenant model better than the older owner-token smoke

### QA

- local regression is strong
- repository-level Postgres auth coverage is materially better than before
- the remaining missing evidence is environment-level, not code-shape-level

## External blocker

A staging deploy attempt was made with `STORAGE_ENGINE=POSTGRES`, but Fly rejected the deploy because the trial has ended and billing is required.

Observed error:

- `trial has ended, please add a credit card by visiting https://fly.io/trial`

This is an environment/account blocker, not a code blocker.

## PM judgment

Decision: `GO for staging runtime smoke once Fly billing is restored`

Current status:

- local code readiness: green
- staging runtime Postgres proof: pending external deploy unblock
- production cutover: still hold
