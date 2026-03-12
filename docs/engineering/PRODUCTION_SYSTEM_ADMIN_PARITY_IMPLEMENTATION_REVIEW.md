# PRODUCTION_SYSTEM_ADMIN_PARITY_IMPLEMENTATION_REVIEW

Date: 2026-03-12
Decision: GO for staging verification

## Scope

- `GET /api/v1/health`
- `GET /api/v1/admin/storage-status`
- `POST /api/v1/admin/backup`
- `POST /api/v1/admin/reset-data`
- Postgres `systemRepository.createBackup`
- Postgres `systemRepository.resetAllData`
- one-off Postgres admin smoke script

이번 배치는 운영 경로를 repository 기준으로 정렬한다.
핵심 목표는 admin/storage routes 가 더 이상 SQLite helper 에 묶이지 않게 만드는 것이다.

## Agent Discussion

### PM

- cutover 전에 운영 경로가 SQLite-only 인 상태를 남겨두면 안 된다.
- 사용자 기능이 아니라 운영/복구 경로를 먼저 안전하게 만드는 것이 더 보수적이고 옳다.

### Feature

- 유저가 직접 보는 UX 는 바뀌지 않아야 한다.
- 현재 runbook 과 pilot 운영 방식은 그대로 유지되어야 한다.

### Builder

- app routes 는 `repositories.systemRepository`만 보게 한다.
- SQLite 는 기존 store 구현을 그대로 쓰고, Postgres 는 logical backup + operational reset 을 추가한다.
- reset 은 tenant/auth foundation 을 건드리지 않고 product-operational tables 만 지운다.

### QA

- SQLite admin route regression 이 유지되어야 한다.
- Postgres system repository 는 file creation 과 reset count 를 실제로 검증해야 한다.
- staging 에서는 runtime SQLite smoke 와 one-off Postgres smoke 를 나눠서 본다.

## Implemented

- [app.js](/D:/AI_CODEX_DESKTOP/src/app.js)
  - `health`, `storage-status`, `backup`, `reset-data`를 repository 기반으로 전환
- [createSqliteRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/sqlite/createSqliteRepositoryBundle.js)
  - `resetAllData()`가 summary shape 를 반환하도록 정렬
- [createPostgresRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/postgres/createPostgresRepositoryBundle.js)
  - `getStorageSummary()` 확장
  - `createBackup()` 구현
  - `resetAllData()` 구현
  - backup snapshot export helper 추가
- [system-repository-admin-parity.test.js](/D:/AI_CODEX_DESKTOP/tests/system-repository-admin-parity.test.js)
  - SQLite / Postgres parity 테스트 추가
- [postgres-admin-smoke.mjs](/D:/AI_CODEX_DESKTOP/scripts/postgres-admin-smoke.mjs)
  - staging one-off smoke 스크립트 추가

## Verification

- `node D:\AI_CODEX_DESKTOP\tests\system-repository-admin-parity.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\field-record-timeline-parity.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\job-case-confirmation-parity.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\repository-write-foundation.test.js`

## PM Judgment

- 이번 배치는 `GO`다.
- 운영 경로가 repository 기준으로 정렬되면서 cutover readiness 판단이 더 쉬워졌다.
- 다음은 runtime 전환이 아니라, auth/tenant/storage 까지 포함한 `cutover readiness review`를 한 번 더 보수적으로 하는 것이 맞다.
