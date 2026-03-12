# Production Postgres Write Foundation Review

Date: 2026-03-12
Decision: GO for write foundation slice, HOLD for write-route cutover

## Scope

- 이번 배치는 `Postgres write foundation`을 실제로 시작하되, 범위는 `견적 변경 -> 설명 초안 -> 합의 기록` 3개 쓰기만 다룬다.
- `현장 기록 생성`, `사진 업로드`, `작업 건 생성`, `현장 기록-작업 건 연결`은 이번 배치에서 제외한다.
- 이유는 파일 업로드와 object storage 전략이 아직 별도 배치로 남아 있기 때문이다.

## Round 1

### PM

- 가장 먼저 Postgres 로 옮겨야 하는 쓰기는 제품 가치의 중심인 `변경 금액`, `고객 설명`, `합의 기록`이다.
- 반대로 `사진 업로드`는 storage adapter 와 같이 가야 안전하므로 지금 배치에 넣지 않는다.
- app route 전체를 한 번에 Postgres write 로 붙이지 말고, repository foundation 을 먼저 단단하게 만든다.

### Feature

- quote write 는 `job_case`와 `scope_comparison`이 항상 같이 정리되어야 의미가 있다.
- draft write 는 `message_draft` upsert 성격이어야 하며, job case 당 최신 초안 1개 규칙을 유지해야 한다.
- agreement write 는 새 agreement record 생성과 job case current status 갱신이 함께 움직여야 한다.

### Builder

- write foundation 은 route 로직이 기대하는 복합 저장 단위를 transaction 으로 묶어야 한다.
- Postgres 는 `SELECT ... FOR UPDATE + UPDATE/INSERT` 구조로 가고, SQLite 는 현재 snapshot/update 흐름으로 같은 의미를 유지한다.
- repository contract 에 write 메서드를 추가해도 route integration 은 다음 배치에서 별도로 한다.

### QA

- fake pool 기반으로 Postgres query sequencing 을 검증해야 한다.
- SQLite bundle 도 같은 메서드를 가져야 contract drift 가 생기지 않는다.
- 기존 read integration 회귀가 깨지지 않아야 한다.

## Implemented

- [contracts.js](/D:/AI_CODEX_DESKTOP/src/repositories/contracts.js)
  - `saveQuoteRevision`, `upsertDraftMessage`, `createAgreementRecord` 추가
- [createSqliteRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/sqlite/createSqliteRepositoryBundle.js)
  - quote/scope, draft upsert, agreement write foundation 구현
- [createPostgresRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/postgres/createPostgresRepositoryBundle.js)
  - transaction 기반 quote/scope, draft upsert, agreement write foundation 구현
- [repository-write-foundation.test.js](/D:/AI_CODEX_DESKTOP/tests/repository-write-foundation.test.js)
  - SQLite/Postgres write foundation 테스트 추가

## Verification

- `node D:\AI_CODEX_DESKTOP\tests\repository-write-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\postgres-repository-slice1.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\repository-batch-a.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\postgres-runtime.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`

## Acceptance Check

- quote write 가 `job_cases`와 `scope_comparisons`를 함께 갱신한다: pass
- draft write 가 최신 초안 1개 규칙으로 upsert 된다: pass
- agreement write 가 agreement row 생성과 job case 상태 갱신을 함께 수행한다: pass
- SQLite/Postgres bundle 이 같은 의미의 결과 shape 을 반환한다: pass
- 기존 read integration, auth foundation, preflight 회귀가 모두 green 이다: pass

## Final PM Judgment

- `GO for write-route integration planning`
- 이번 배치는 foundation 기준으로 만족스럽다.
- 특히 route 를 건드리기 전에 transaction 경계와 결과 shape 을 repository 단에서 먼저 맞춘 점이 좋다.
- 다음 단계는 `write route integration + audit append linkage` 범위를 다시 잠그는 것이다.
- 단, 지금도 아직 `storageEngine=POSTGRES` 전환 허가는 아니다.
