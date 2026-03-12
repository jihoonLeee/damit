# Production Postgres Runtime Slice 1 Review

Date: 2026-03-12
Decision: GO for slice 1 implementation, HOLD for runtime cutover

## Scope

- staging Supabase preflight 와 base migration 이 green 인 상태를 전제로 한다.
- 이번 배치는 `PROD-06` 전체가 아니라 `read parity + audit foundation + auth company list`까지만 구현한다.
- app runtime 의 기본 저장 엔진은 계속 `SQLITE`로 유지하고, Postgres adapter 는 계약/테스트 관점으로 먼저 단단하게 만든다.

## Round 1

### PM

- 지금 가장 위험한 선택은 `연결이 됐으니 바로 runtime 을 Postgres 로 바꾸는 것`이다.
- 먼저 열어야 하는 것은 `읽기 경로`, `감사 로그`, `회사 목록`처럼 계약이 분명하고 회귀 영향이 낮은 부분이다.
- `magic link 발급/검증`, `tenantized write path`, `storage adapter`는 아직 같은 배치로 묶지 않는다.

### Feature

- Postgres repository 가 최소한 SQLite repository 와 같은 수준의 `job case list/detail`, `field record photo`, `company list` 데이터를 줄 수 있어야 다음 단계 app 통합이 가능하다.
- STAFF visibility 규칙은 이번 배치 쿼리에도 반영돼야 한다.
- detail 응답은 다음 tenantized workspace 통합을 고려해 `scopeComparisons`, `timelineEvents`까지 담아두는 것이 낫다.

### Builder

- `pg.Pool` 생성을 강제하면 테스트가 어렵기 때문에 injected pool 을 받을 수 있어야 한다.
- read 쿼리는 lateral join / ordered subquery 로 latest agreement, latest field record 를 안정적으로 읽어야 한다.
- audit append 는 append-only insert 하나로 고정하고, JSON payload 는 Postgres JSONB 로 저장한다.

### QA

- 실제 DB 없이도 repository contract 을 검증할 수 있게 fake pool 기반 테스트가 필요하다.
- `DATABASE_URL` 없이 bundle 생성이 실패하는 기존 guard 는 유지돼야 한다.
- migration/preflight green 과 별개로 repository mapping 이 깨지지 않았는지 독립 테스트가 있어야 한다.

## Batch Decision

### In

- `jobCaseRepository.listByScope`
- `jobCaseRepository.getDetailById`
- `fieldRecordRepository.listByJobCaseId`
- `fileAssetRepository.listByFieldRecordId`
- `authRepository.listCompaniesForUser`
- `auditLogRepository.append`
- `auditLogRepository.listByCompany`
- Postgres bundle testability 개선
- SQLite read shape 정렬

### Out

- `authRepository.issueChallenge`
- `authRepository.verifyChallenge`
- app runtime Postgres cutover
- object storage adapter 연동
- customer confirmation Postgres persistence 전환

## Round 2

### Builder 반영

- [createPostgresRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/postgres/createPostgresRepositoryBundle.js) 에 Postgres read/audit 구현 추가
- [createRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/createRepositoryBundle.js) 에 injected pool 전달 경로 추가
- [createSqliteRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/sqlite/createSqliteRepositoryBundle.js) 에 scope/detail shape 정렬 반영
- [postgres-repository-slice1.test.js](/D:/AI_CODEX_DESKTOP/tests/postgres-repository-slice1.test.js) 추가

### Feature 재검증

- Postgres list query 가 `latest agreement`, `latest field record`, `STAFF visibility`를 함께 반영한다.
- detail shape 이 `jobCase + fieldRecords + agreements + drafts + scopeComparisons + timelineEvents`로 다음 통합 배치를 받을 수 있다.
- company context 에 필요한 `listCompaniesForUser`가 Postgres 쪽에서도 같은 의미를 가진다.

### QA 재검증

- fake pool 기반 Postgres repository slice 테스트: pass
- foundation repository test: pass
- Postgres runtime helper test: pass
- pilot API regression test: pass
- auth foundation regression test: pass

### PM 재검토

- 이번 배치는 `연결 검증`에서 `실제 adapter foundation` 단계로 진전했다.
- 아직 runtime cutover 를 할 수준은 아니지만, 다음 배치에서 route integration 또는 write path 중 하나를 선택해도 될 만큼 경계가 선명해졌다.
- staging Supabase preflight 는 여전히 green 이고 migration 도 적용 완료 상태다.

## Verification

- `node D:\AI_CODEX_DESKTOP\tests\postgres-repository-slice1.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\repository-batch-a.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\postgres-runtime.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- staging `GET /api/v1/health`: 200
- staging `GET /api/v1/admin/postgres-preflight`: `ok=true`, `applied=1`, `pending=0`

## Acceptance Check

- SQLite bundle 과 같은 핵심 read shape 을 Postgres bundle 도 반환한다: pass
- STAFF visibility filter 가 Postgres list query 에 반영된다: pass
- audit log append/list 가 JSON payload 를 잃지 않는다: pass
- fake pool 기반 테스트와 기존 foundation 테스트가 모두 green 이다: pass
- PM 이 `runtime cutover 전 준비 상태`로 보수적으로 봐도 만족한다: pass

## Final PM Judgment

- `GO for next integration batch`
- 다만 지금 단계의 `GO`는 `storageEngine=POSTGRES 전환 허가`가 아니라 `다음 통합 배치 진행 허가`를 의미한다.
- 가장 좋은 다음 단계는 둘 중 하나다.
  - `tenantized workspace read route integration`
  - `Postgres write path foundation`
- PM 추천은 첫 번째다. 이미 읽기 경로가 정리됐기 때문에 다음엔 `app route 일부를 repository bundle 기반으로 읽도록` 붙이는 쪽이 더 안전하다.
