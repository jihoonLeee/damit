# OWNER_SETTLEMENT_SUMMARY_UX

## Placement

- `/account` 상단 신호 카드 아래, 본문 초반에 OWNER 전용 `정산 요약` 섹션을 둔다
- 세션/초대보다 앞에 배치해서 "회사 운영 숫자"가 먼저 읽히게 한다

## UX principles

- 회계 프로그램처럼 무겁게 보이지 않는다
- "지금까지 얼마나 합의됐는지"와 "이번 달 흐름"을 먼저 보여준다
- 상세 표보다는 요약 + 최근 내역 중심으로 간결하게 구성한다

## Information hierarchy

### Summary cards

- 누적 합의 금액
- 이번 달 합의 금액
- 누적 합의 건수
- 이번 달 합의 건수

### Supporting copy

- 최근 합의가 언제 있었는지
- 최근 30일 기준인지, 이번 달 기준인지 한 줄로 설명

### Recent agreement list

- 고객/현장 라벨
- 최종 합의 금액
- 합의 시각
- 현재 상태

## Empty state

- 아직 합의된 작업이 없으면 "아직 합의 금액이 쌓이지 않았습니다"와 함께 `/app`으로 이동하는 맥락을 보여준다

## Role behavior

- OWNER:
  - 정산 섹션 노출
- MANAGER/STAFF:
  - 정산 섹션 숨김

## Copy tone

- 회계 용어보다 운영 용어에 가깝게 간다
- "정산"보다는 "최종 합의 금액"과 "최근 합의 내역"을 함께 써서 의미를 분명히 한다
