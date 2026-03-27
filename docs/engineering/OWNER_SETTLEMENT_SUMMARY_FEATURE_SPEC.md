# OWNER_SETTLEMENT_SUMMARY_FEATURE_SPEC

## Scope

- `/api/v1/account/overview`에 `settlementSummary`를 추가한다
- SQLite / Postgres authRepository에 회사 기준 정산 요약 메서드를 추가한다
- `/account`에 OWNER 전용 정산 요약 섹션을 추가한다

## Backend contract

### New authRepository method

- `getSettlementSummaryByCompany(companyId)`

### Response shape

```json
{
  "totalConfirmedAmount": 0,
  "confirmedAmountThisMonth": 0,
  "agreementCountTotal": 0,
  "agreementCountThisMonth": 0,
  "latestConfirmedAt": null,
  "recentAgreements": [
    {
      "agreementId": "agr_123",
      "jobCaseId": "jc_123",
      "customerLabel": "잠실 리센츠",
      "siteLabel": "잠실 리센츠 1203",
      "confirmedAmount": 320000,
      "confirmedAt": "2026-03-27T10:00:00.000Z",
      "status": "AGREED"
    }
  ]
}
```

## Query rules

- 포함 대상:
  - `agreement_records.status = 'AGREED'`
  - `company_id = active company`
- 금액 합계:
  - `confirmed_amount`가 number인 행만 합산
- 이번 달 기준:
  - 서버 현재 시각 기준 해당 달의 시작 ~ 현재
- recent list:
  - 최신 `confirmed_at DESC`
  - 최대 5건

## API behavior

- `/api/v1/account/overview`
  - OWNER + active company일 때 `settlementSummary` 포함
  - 비OWNER이거나 active company가 없으면 `settlementSummary: null`

## Frontend behavior

- OWNER:
  - 정산 요약 섹션 노출
- 비OWNER:
  - 정산 요약 섹션 숨김
- empty:
  - 합의 내역이 없으면 empty-state copy 표시

## QA

- account overview API test:
  - 합의 데이터 생성 후 `settlementSummary` 숫자와 recent list 확인
- role behavior test:
  - OWNER는 보이고, STAFF/MANAGER는 null 또는 hidden
- 회귀:
  - 기존 account overview fields 유지
