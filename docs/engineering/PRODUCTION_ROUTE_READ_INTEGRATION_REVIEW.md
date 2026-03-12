# Production Route Read Integration Review

Date: 2026-03-12
Decision: GO for staging deploy, HOLD for write-path cutover

## Scope

- repository bundle 로 `job case list/detail/scope comparison/draft read/timeline` GET 경로를 먼저 통합한다.
- 쓰기 경로와 live runtime storage engine 은 그대로 유지한다.
- 이번 배치는 `read route integration`이 목표이며, `Postgres write path`와 `storageEngine=POSTGRES` 전환은 다음 단계다.

## Agent Discussion

### PM

- 연결과 adapter 가 준비돼도, app 라우트가 아직 store 직접 접근이면 실전 전환 리스크가 남아 있다.
- 따라서 가장 먼저 붙일 것은 사용자 체감이 큰 읽기 엔드포인트다.
- 이 배치에서 staging deploy 까지 확인되면 다음 write foundation 논의를 시작할 수 있다.

### Feature

- 사용자가 실제로 보는 목록, 상세, 설명 초안, 타임라인이 repository 기반이어야 이후 DB 교체가 투명해진다.
- detail route 는 `scopeComparisons`, `drafts`, `agreements`, `photos`, `timelineEvents`를 조합해 같은 응답 shape 을 유지해야 한다.

### Builder

- `createApp()` 단계에서 repository bundle 을 한 번만 만들고, GET read route 들이 그 bundle 을 쓰게 해야 한다.
- SQLite 와 Postgres bundle 이 같은 read shape 을 주도록 정렬돼 있어야 route 코드를 공통으로 유지할 수 있다.

### QA

- 기존 P0 happy path 가 유지되는지 먼저 봐야 한다.
- list/detail/scope/draft/timeline 읽기 경로가 실제 응답을 그대로 내는지 회귀 테스트를 추가해야 한다.

## Implemented

- [app.js](/D:/AI_CODEX_DESKTOP/src/app.js)
  - `createRepositoryBundle()` 연결
  - GET `/api/v1/job-cases`
  - GET `/api/v1/job-cases/:id`
  - GET `/api/v1/job-cases/:id/scope-comparison`
  - GET `/api/v1/job-cases/:id/draft-message`
  - GET `/api/v1/job-cases/:id/timeline`
- [createSqliteRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/sqlite/createSqliteRepositoryBundle.js)
  - scope/detail shape 정렬
- [createPostgresRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/postgres/createPostgresRepositoryBundle.js)
  - route integration 이 기대하는 read shape 제공
- [api.test.js](/D:/AI_CODEX_DESKTOP/tests/api.test.js)
  - list/detail/scope/draft/timeline 회귀 보강

## Verification

- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\repository-batch-a.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\postgres-runtime.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\postgres-repository-slice1.test.js`

## PM Judgment

- 이번 배치는 `GO`다.
- 이유는 세 가지다.
  - repository 가 이제 문서용 abstraction 이 아니라 실제 앱 읽기 경로에 연결됐다.
  - 기존 P0 파일럿 흐름이 그대로 green 이다.
  - 다음 단계인 `write path foundation`으로 갈 경계가 더 명확해졌다.
- 단, 아직 `storageEngine=POSTGRES` 전환 허가는 아니다.

## Next Best Step

1. staging 에 이번 read integration 배치를 배포한다.
2. staging smoke 로 `health`, `job-case read routes`, `postgres preflight`를 다시 확인한다.
3. 그 다음 `Postgres write foundation` 범위를 PM/Feature/Builder/QA가 다시 잠근다.
