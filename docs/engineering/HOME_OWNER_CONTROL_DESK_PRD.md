# Home Owner Control Desk PRD

## Objective
- OWNER가 `/home`에 들어왔을 때, 오늘 운영 상태와 정산 상태를 10초 안에 파악하고 바로 다음 화면으로 이동할 수 있게 한다.

## Primary User
- OWNER

## Success Criteria
- OWNER는 `/home`에서 아래를 바로 이해할 수 있어야 한다.
  - 이번 달 합의 흐름이 어떤가
  - 지금 가장 먼저 봐야 할 작업 건이 무엇인가
  - 운영 리스크가 있는가
  - `/app`, `/ops`, `/account` 중 어디로 가야 하는가

## Non-Goals
- `/home`에서 정산 상세 필터링을 제공하지 않는다.
- `/home`에서 운영 리셋/백업 같은 쓰기 액션을 제공하지 않는다.
- `/home`에서 여러 개의 focus case를 상세히 나열하지 않는다.

## Functional Requirements
- OWNER일 때만 `Owner Control Desk` 섹션을 표시한다.
- OWNER가 아니면 기존 `/home` 흐름만 유지한다.
- Control desk는 다음을 보여준다.
  - 이번 달 합의 금액
  - 누적 합의 금액
  - 최근 합의 시각 또는 최근 합의 없음
  - 지금 가장 먼저 볼 작업 건 한 개
  - 고객 확인/로그인 전달 관련 간단한 운영 신호
- 각 카드와 안내는 아래로 연결된다.
  - 정산 요약 -> `/account`
  - 대표 focus case -> `/app/...`
  - 운영 리스크 점검 -> `/ops`

## Data Sources
- `GET /api/v1/account/overview`
- `GET /api/v1/admin/ops-snapshot` (OWNER only)

## Acceptance
- OWNER 계정에서 `/home` 진입 시 control desk가 보인다.
- MANAGER/STAFF 계정에서는 control desk가 보이지 않는다.
- focus case가 없을 때도 빈 상태 문구가 자연스럽다.
- `/home`가 `/app`과 `/ops`의 역할을 더 분명하게 설명한다.
