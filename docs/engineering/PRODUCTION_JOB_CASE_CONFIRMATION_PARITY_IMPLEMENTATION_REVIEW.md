# PRODUCTION_JOB_CASE_CONFIRMATION_PARITY_IMPLEMENTATION_REVIEW

Date: 2026-03-12
Decision: GO for staging deploy and PM checkpoint

## Scope

- `POST /api/v1/job-cases`
- `POST /api/v1/job-cases/:id/customer-confirmation-links`
- `GET /api/v1/public/confirm/:token`
- `POST /api/v1/public/confirm/:token/acknowledge`
- `GET /api/v1/job-cases/:id` latest confirmation attachment
- Postgres migration `0002_customer_confirmation_state_columns`

이번 배치는 `job case create + customer confirmation parity`를 repository 기준으로 정렬한다.
핵심 목표는 app-layer direct write 와 mixed storage read/write 를 줄이고, Postgres cutover 전에 같은 계약으로 행동하게 만드는 것이다.

## Agent Discussion

### PM

- `job case create`는 더 이상 app-layer mutation 으로 남겨두면 안 된다.
- customer confirmation 은 단순 보조 기능이 아니라, 향후 evidence flow 의 핵심이므로 repository contract 가 필요하다.
- 이번 배치에서 Postgres schema gap 이 드러났기 때문에 migration 을 같이 묶는 것이 맞다.

### Feature

- API shape 는 유지되어야 한다.
- 고객 확인 링크 발급, 공개 확인, 확인 완료, 상세 최신 상태 노출이 이전과 동일하게 보여야 한다.
- public payload 는 여전히 현장 사진, 설명 초안, 변경 금액을 함께 보여야 한다.

### Builder

- `jobCaseRepository.create` 추가
- `customerConfirmationRepository` 추가
- SQLite 는 기존 confirmation store 를 감싸서 parity 를 맞추고, Postgres 는 직접 구현한다.
- public payload 도 `readDb()` 직접 참조 대신 repository detail 을 재사용한다.

### QA

- route regression 과 repository parity 둘 다 필요하다.
- SQLite / Postgres 양쪽 모두 create-link-view-ack lifecycle 을 검증해야 한다.
- staging 에서 migration 2개 applied 상태를 확인해야 PM sign-off 가 가능하다.

## Implemented

- [app.js](/D:/AI_CODEX_DESKTOP/src/app.js)
  - job case create route 를 repository 기반으로 전환
  - confirmation link issue/view/ack/detail latest 를 repository 기반으로 전환
  - public confirmation payload 를 repository detail 재사용으로 전환
- [contracts.js](/D:/AI_CODEX_DESKTOP/src/repositories/contracts.js)
  - `jobCaseRepository.create`
  - `customerConfirmationRepository.*`
- [createSqliteRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/sqlite/createSqliteRepositoryBundle.js)
  - job case create 구현
  - customer confirmation repository 구현
- [createPostgresRepositoryBundle.js](/D:/AI_CODEX_DESKTOP/src/repositories/postgres/createPostgresRepositoryBundle.js)
  - job case create 구현
  - customer confirmation repository 구현
  - confirmation state helper / event append helper 추가
- [0002_customer_confirmation_state_columns.sql](/D:/AI_CODEX_DESKTOP/src/db/migrations/postgres/0002_customer_confirmation_state_columns.sql)
  - `viewed_at`
  - `confirmed_at`
  - `confirmation_note`
  - `request_ip`
  - `user_agent`
- [job-case-confirmation-parity.test.js](/D:/AI_CODEX_DESKTOP/tests/job-case-confirmation-parity.test.js)
  - SQLite / Postgres parity 테스트 추가

## Verification

- `node D:\AI_CODEX_DESKTOP\tests\job-case-confirmation-parity.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\customer-confirmation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\field-record-timeline-parity.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\repository-write-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\postgres-repository-slice1.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\repository-batch-a.test.js`

## Notes

- `fly ssh console` 실행 자체는 Windows handle 오류로 exit code 1 이 남았지만, migration JSON 결과는 성공이었다.
- PM 판단상 이건 migration 실패가 아니라 Fly/Windows shell quirk 로 본다.
- `0002` SQL 파일은 BOM 제거 후 재배포했다.

## PM Judgment

- 이번 배치는 `GO`다.
- 이제 job case create 와 customer confirmation 이 repository parity 안으로 들어왔다.
- 남은 것은 cutover 가 아니라, Postgres write parity 를 더 좁게 닫는 다음 배치다.
