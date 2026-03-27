# APP_ROUTE_SPLIT_FEATURE_SPEC

## Scope

- 새 단계 경로 추가
  - `/app/capture`
  - `/app/quote`
  - `/app/draft`
  - `/app/confirm`
- `/app`는 compatibility route로 유지
- 기존 `index.html + app.js` shared runtime을 재사용하되, pathname 기준으로 stage-focused presentation을 적용
- 주요 진입 링크(`/home`, `/ops`, `/account`)를 새 단계 경로에 맞게 갱신

## Static route changes

### `src/http/static-routes.js`

- 아래 pathname을 `index.html`로 매핑한다
  - `/app/capture`
  - `/app/quote`
  - `/app/draft`
  - `/app/confirm`

## Runtime screen model

### screen key

- `overview`
  - pathname `/app`
- `capture`
  - pathname `/app/capture`
- `quote`
  - pathname `/app/quote`
- `draft`
  - pathname `/app/draft`
- `confirm`
  - pathname `/app/confirm`

### `public/app.js`

- pathname 기반 screen key 계산
- `document.body`에 `workflow-screen-${screenKey}` class 추가
- route navigation href 생성
- 선택된 `caseId`가 있으면 route navigation에도 같은 `caseId`를 유지
- 작업 건 선택 시 현재 pathname을 유지하면서 query param `caseId`를 URL에 반영

## Navigation rules

### home

- 기본 작업 진입 경로를 `/app/capture`로 변경

### ops

- reason/target 기준으로 단계 경로 결정
  - `quote-card` -> `/app/quote?caseId=...`
  - `draft-card` -> `/app/draft?caseId=...`
  - `customer-confirm-card`, `agreement-card`, `timeline-card` -> `/app/confirm?caseId=...`
  - 기본 -> `/app/capture`

### account

- 일반 작업 화면 링크 -> `/app/capture`
- 최근 합의 내역 링크 -> `/app/confirm?caseId=...`

### login

- next destination 문구에 `/app/capture`를 작업 기본 진입으로 반영

## Presentation rules

### `/app/capture`

- 유지:
  - hero
  - route navigation
  - workflow banner
  - capture panel
- 숨김:
  - panel-list
  - panel-detail

### `/app/quote`

- 유지:
  - route navigation
  - panel-list
  - panel-detail 상단 요약
  - `quote-card`
- 숨김:
  - panel-capture
  - `draft-card`
  - `customer-confirm-card`
  - `agreement-card`
  - `records-card`
  - `timeline-card`
  - detail jump

### `/app/draft`

- 유지:
  - route navigation
  - panel-list
  - panel-detail 상단 요약
  - `quote-card` (read-only context)
  - `draft-card`
- 숨김:
  - panel-capture
  - `customer-confirm-card`
  - `agreement-card`
  - `records-card`
  - `timeline-card`
  - detail jump

### `/app/confirm`

- 유지:
  - route navigation
  - panel-list
  - panel-detail 상단 요약
  - `customer-confirm-card`
  - `agreement-card`
  - `timeline-card`
- 숨김:
  - panel-capture
  - `draft-card`
  - `records-card`
  - detail jump

## QA

- 새 경로 정적 응답 확인
  - `/app/capture`
  - `/app/quote`
  - `/app/draft`
  - `/app/confirm`
- `/home`에서 `/app/capture`로 진입 확인
- `/ops` handoff가 이유에 맞는 단계 경로를 여는지 확인
- `/account` 최근 합의 링크가 `/app/confirm?caseId=...`로 여는지 확인
- `caseId`를 포함한 상태에서 경로 이동 시 작업 건 선택이 유지되는지 확인
- 모바일 visual review에서 각 단계 화면 과밀도가 기존보다 줄었는지 확인
