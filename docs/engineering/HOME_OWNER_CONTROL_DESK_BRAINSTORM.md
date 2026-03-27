# Home Owner Control Desk Brainstorm

## Goal
- `/home`를 회사/세션 이동 시작점에서 한 단계 올려, OWNER가 하루를 시작할 때 가장 먼저 보는 운영 데스크로 만든다.

## Problem
- 현재 `/home`은 역할 구분과 이동 판단은 좋아졌지만, OWNER 입장에서는 "지금 운영상 뭐가 제일 급한가"와 "이번 달 정산 흐름이 어떤가"를 한 번에 보기 어렵다.
- 정산 요약은 `/account`에 있고 병목 신호는 `/ops`에 있어, OWNER가 두 화면을 왕복해야 한다.

## Existing Signals We Can Reuse
- `/api/v1/account/overview`
  - `settlementSummary`
  - `security`
  - `recentLoginActivity`
  - `memberships`, `invitations`, `sessions`
- `/api/v1/admin/ops-snapshot`
  - `focusCases`
  - `signals.customerConfirmations`
  - `signals.auth`
  - `runtime`
  - `release`

## Product Hypothesis
- OWNER에게는 `/home`이 "운영 출발점"이어야 하고, `/ops`는 "깊게 파고드는 점검 화면"이어야 한다.
- 따라서 `/home`에는 요약과 우선순위만 두고, 깊은 점검과 운영 작업은 `/ops`, 건별 실행은 `/app`으로 넘기는 구조가 가장 직관적이다.

## UX Direction
- 상단 summary 아래에 `Owner Control Desk` 섹션을 추가한다.
- 이 섹션은 두 가지 층으로 구성한다.
  - `오늘의 운영 판단`
  - `정산/합의 요약`
- 가장 급한 작업 건 하나만 크게 보여주고, 나머지는 `/ops`로 넘긴다.
- 정산은 카드 4개 숫자를 다시 반복하지 않고, `/account` 대비 더 간단한 headline 형태로 보여준다.

## Candidate Information Blocks
- 이번 달 합의 금액
- 이번 달 합의 건수
- 최근 합의 시각
- 가장 먼저 볼 작업 건
- 고객 확인 지연 건수
- 로그인 전달 실패 건수
- 메일/모니터링 준비도

## Decision
- `/home` OWNER 전용 control desk를 추가한다.
- 데이터는 새 API 없이 `account overview + ops snapshot`을 클라이언트에서 조합한다.
- `/home`에는 1개의 대표 focus case만 요약하고, 더 많은 운영 판단은 `/ops`로 넘긴다.
