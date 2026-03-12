# Production Write Route Integration Review

Date: 2026-03-12
Decision: GO for staging deploy, HOLD for Postgres runtime cutover

## Scope

- `PATCH /job-cases/:id/quote`
- `POST /job-cases/:id/draft-message`
- `POST /job-cases/:id/agreement-records`

이번 배치는 위 3개 쓰기 라우트를 repository 기반 write foundation 으로 연결한다.
추가로 company context 가 있는 경우 audit append 를 같이 남긴다.
단, timeline persistence 는 현재 runtime 이 `SQLITE`일 때만 기존 방식으로 유지하고, Postgres timeline write 는 다음 배치로 남긴다.

## Agent Discussion

### PM

- 지금은 `runtime Postgres 전환`보다 `route 가 repository abstraction 을 실제로 타는지`가 더 중요하다.
- owner-token 파일럿 흐름은 깨지면 안 되므로, company context 가 없는 경우 audit 는 건너뛴다.
- timeline 을 지금 억지로 Postgres 까지 확장하지 말고, write route integration 범위를 넘지 않게 자른다.

### Feature

- quote/draft/agreement 는 이미 제품 핵심 가치 흐름이다.
- 이 3개가 repository 로 묶이면, 사용자가 체감하는 핵심 로직은 DB 교체에 덜 민감해진다.
- audit 는 session/company 기반 beta 흐름에서만 강하게 의미를 가진다.

### Builder

- route 에서 직접 snapshot 을 수정하던 부분을 repository method 호출로 바꾼다.
- SQLite runtime 에서는 timeline 을 보존하기 위해 local timeline append helper 를 유지한다.
- company scope 가 있을 때만 audit append 를 호출한다.

### QA

- 기존 P0 happy path 가 그대로 통과해야 한다.
- 계약 테스트와 auth/read regression 이 모두 green 이어야 한다.
- staging deploy 후 health 와 preflight 는 그대로 green 이어야 한다.

## Implemented

- [app.js](/D:/AI_CODEX_DESKTOP/src/app.js)
  - quote/draft/agreement write route 를 repository 기반으로 전환
  - company-aware audit append helper 추가
  - SQLite runtime 전용 local timeline helper 추가
- [store.js](/D:/AI_CODEX_DESKTOP/src/store.js)
  - SQLite audit log persistence 추가
- [createSqliteRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/sqlite/createSqliteRepositoryBundle.js)
  - SQLite audit repository 구현
- [repository-write-foundation.test.js](/D:/AI_CODEX_DESKTOP/tests/repository-write-foundation.test.js)
  - SQLite audit repository 검증 추가

## Verification

- `node D:\AI_CODEX_DESKTOP\tests\repository-write-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\postgres-repository-slice1.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\repository-batch-a.test.js`

## PM Judgment

- 로컬 기준으로 `GO`다.
- 이번 배치로 read 와 write 의 핵심 라우트가 모두 repository 중심으로 움직이기 시작했다.
- 다만 Postgres timeline write 와 full runtime cutover 는 아직 별도 배치가 필요하다.
