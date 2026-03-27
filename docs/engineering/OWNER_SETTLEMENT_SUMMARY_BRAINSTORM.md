# OWNER_SETTLEMENT_SUMMARY_BRAINSTORM

## Problem

- 사장님은 현재 `/app`에서 작업 건 단위로는 합의 금액을 볼 수 있지만, 내 회사 기준으로 최종 합의 금액을 한눈에 모아 보는 표면이 없다
- `/account`는 계정, 세션, 초대 중심이라 운영 정산 감각이 비어 있다
- 실제 운영에서는 "이번 달 얼마가 합의됐는지", "최근 어떤 건이 합의됐는지"를 빠르게 확인하는 화면이 필요하다

## Options considered

### 1. `/ops`에 정산 보드 추가

- pros:
  - 운영 콘솔과 가까움
- cons:
  - `/ops`는 시스템/운영 상태 중심이고, 사장님 개인 정산 감각과는 결이 다름
- verdict:
  - 보조 노출은 가능하지만 1차 표면으로는 부적합

### 2. 새 `/settlements` 화면 생성

- pros:
  - 확장성이 좋음
- cons:
  - 지금은 화면 수만 늘고 진입 동선이 복잡해짐
  - 1차 기능치고 과함
- verdict:
  - 나중에 상세 정산 시스템이 필요할 때 검토

### 3. `/account`에 OWNER 전용 정산 요약 패널 추가

- pros:
  - 사장님이 이미 계정/회사 상태를 보는 표면 안에서 자연스럽게 확인 가능
  - 기존 `agreement_records + job_cases`로 바로 만들 수 있음
  - 새 테이블 없이 시작 가능
- cons:
  - 1차는 세금/수수료/입금 상태 같은 회계 기능까지는 다루지 못함
- verdict:
  - 채택

## Constraints

- 새 회계 시스템처럼 과도하게 확장하지 않는다
- 1차는 "합의된 금액 요약"과 "최근 합의 내역"까지만 다룬다
- OWNER가 빠르게 읽는 데 집중하고, 정식 정산/입금 관리 기능은 후속으로 남긴다
- SQLite / Postgres 둘 다 같은 결과를 내야 한다

## Brainstorm outcome

- `/api/v1/account/overview`에 `settlementSummary`를 추가한다
- `/account`에 OWNER 전용 `정산 요약` 섹션을 추가한다
- 1차 데이터는 아래만 제공한다
  - 누적 합의 금액
  - 이번 달 합의 금액
  - 누적 합의 건수
  - 이번 달 합의 건수
  - 최근 합의 내역 몇 건
