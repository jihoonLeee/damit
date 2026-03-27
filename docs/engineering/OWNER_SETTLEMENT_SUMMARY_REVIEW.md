# OWNER_SETTLEMENT_SUMMARY_REVIEW

## Outcome

- `/account`에 OWNER 전용 `최종 합의 금액 요약` 섹션을 추가했다
- 기존 `agreement_records + job_cases`를 재사용해서 새 테이블 없이 시작했다
- SQLite / Postgres 모두 같은 `settlementSummary` shape를 반환하도록 맞췄다

## Implemented

- backend
  - `authRepository.getSettlementSummaryByCompany(companyId)` 추가
  - `/api/v1/account/overview`에 `settlementSummary` 포함
- frontend
  - OWNER일 때만 정산 요약 섹션 노출
  - 누적/이번 달 금액 및 건수 노출
  - 최근 합의 내역 5건 노출
  - 각 최근 항목에서 `/app?caseId=...`로 바로 이어가기 가능

## Verification

- syntax
  - `node --check public/account.js`
  - `node --check src/app.js`
  - `node --check src/repositories/sqlite/createSqliteRepositoryBundle.js`
  - `node --check src/repositories/postgres/createPostgresRepositoryBundle.js`
- tests
  - `node tests/auth-foundation.test.js`
  - `node tests/postgres-repository-slice1.test.js`
  - `node tests/api.test.js`
- visual
  - `node scripts/visual-review.mjs`
  - account captures refreshed:
    - `output/visual-review/desktop-account-authenticated.png`
    - `output/visual-review/mobile-account-authenticated.png`

## PM verdict

- 이 기능은 새 회계 시스템이 아니라 `사장님 운영 요약`으로는 충분히 유용하다
- 현재 제품 단계에 맞는 최소 유용 버전이다
- 다음 확장은 아래 둘 중 하나가 자연스럽다
  - 월별 필터 / 기간 필터
  - CSV 내보내기 / 입금 상태 같은 실제 정산 기능
