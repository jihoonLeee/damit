# APP_ROUTE_SPLIT_UX

## UX principle

- 한 화면에는 한 단계만 주인공처럼 보이게 한다.
- 작업 흐름은 `지금 단계`, `다음 단계`, `현재 선택된 작업 건` 세 축만 분명하면 된다.
- 데스크톱은 "목록 + 현재 단계 카드" 구조를 유지하되, 모바일은 단계별 집중도를 최우선으로 둔다.

## Route map

### `/app/capture`

- 목적:
  - 현장 기록 저장
  - 작업 건 생성/연결
- 주요 사용자:
  - STAFF, MANAGER, OWNER
- 완료 기준:
  - 현장 기록이 저장되고, 작업 건이 연결되어 다음 단계로 갈 수 있다
- 다음 이동:
  - `/app/quote`

### `/app/quote`

- 목적:
  - 변경 금액 저장
  - 추가 범위 문구 확인
- 주요 사용자:
  - MANAGER, OWNER
- 완료 기준:
  - 변경 견적이 저장되어 설명 초안 단계로 넘어갈 수 있다
- 다음 이동:
  - `/app/draft`

### `/app/draft`

- 목적:
  - 고객 설명 초안 생성
  - 복사/전달 준비
- 주요 사용자:
  - MANAGER, OWNER
- 완료 기준:
  - 고객에게 바로 보낼 수 있는 초안이 준비된다
- 다음 이동:
  - `/app/confirm`

### `/app/confirm`

- 목적:
  - 고객 확인 링크 발급
  - 합의 기록 저장
  - 최종 상태 마무리
- 주요 사용자:
  - MANAGER, OWNER
- 완료 기준:
  - 고객 확인 또는 합의 상태가 최신 상태로 기록된다
- 다음 이동:
  - 필요 시 `/ops`, `/account`

## Shared UX rules

- 상단에는 route navigation을 둔다.
- 현재 단계의 카드만 강하게 보이게 하고, 다른 단계 카드는 숨기거나 크게 약화한다.
- `caseId`가 있으면 항상 그 작업 건 기준으로 페이지가 열린다.
- `caseId`가 없으면 목록에서 먼저 작업 건을 선택하게 한다.
- `/ops`에서 넘어온 경우 "왜 이 단계가 열렸는지"를 상단 카드에서 먼저 설명한다.

## Mobile rules

- `capture`는 단일 컬럼, 상세 패널 없이 intake 중심으로 보여준다.
- `quote`, `draft`, `confirm`은 `작업 건 목록 -> 현재 단계 카드` 순으로 세로 배치한다.
- 단계 화면에서는 detail jump나 다른 단계 카드 노출을 줄인다.
- 주요 CTA는 각 화면 하단 또는 상단 action strip에서 반복적으로 보여준다.

## Copy direction

- `/app/capture`
  - "현장 기록부터 남기세요"
- `/app/quote`
  - "금액을 먼저 정리하세요"
- `/app/draft`
  - "고객에게 보낼 설명을 준비하세요"
- `/app/confirm`
  - "확인과 합의를 마지막으로 정리하세요"

## Handoff mapping

- quote 병목 -> `/app/quote`
- draft 병목 -> `/app/draft`
- 확인 링크/합의 병목 -> `/app/confirm`
- 기본 작업 진입 -> `/app/capture`
