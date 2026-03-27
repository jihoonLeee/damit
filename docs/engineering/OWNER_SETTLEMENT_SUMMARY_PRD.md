# OWNER_SETTLEMENT_SUMMARY_PRD

## Goal

- 사장님이 `/account`에서 내 회사의 최종 합의 금액 흐름을 빠르게 파악할 수 있게 한다

## Why this matters

- 지금 제품은 작업 흐름은 강하지만, OWNER가 "내가 최종적으로 얼마를 합의했는지"를 모아 보는 감각이 약하다
- 운영형 제품으로 가려면 작업 단위 화면뿐 아니라 회사 단위 요약 화면이 필요하다

## Users

- OWNER 권한 사장님

## User stories

- as an owner, I want to see the total amount my company has agreed so far
- as an owner, I want to see how much was agreed this month
- as an owner, I want to quickly review the latest agreed jobs without opening every case

## Non-goals

- 세금 계산
- 입금 관리
- 미수금 추적
- 정식 회계/정산 시스템
- STAFF/MANAGER용 별도 정산 표면

## Success criteria

- `/account`에서 OWNER는 정산 요약 카드와 최근 합의 내역을 볼 수 있다
- SQLite / Postgres 모두 같은 shape의 `settlementSummary`를 반환한다
- 최근 합의 내역은 고객/현장/금액/확정 시각이 빠르게 읽힌다
- 비OWNER는 이 섹션을 보지 않는다
