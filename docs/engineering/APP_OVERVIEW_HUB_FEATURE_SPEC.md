# APP_OVERVIEW_HUB_FEATURE_SPEC

## Scope

- `public/index.html`
- `public/app.js`
- `public/styles.css`
- `scripts/visual-review.mjs`

## HTML

- detail 영역에 `overview-hub-card`와 `overview-route-grid` 추가
- stage별 요소
  - `#overview-hub-title`
  - `#overview-hub-copy`
  - `#overview-route-capture-*`
  - `#overview-route-quote-*`
  - `#overview-route-draft-*`
  - `#overview-route-confirm-*`

## JS

- `renderOverviewHub(snapshot)` 추가
- stage route 허브 카드 상태/문구/링크 생성
- `/app` overview에서만 허브를 보여주도록 제어

## CSS

- `workflow-screen-overview` 전용 layout 추가
- capture panel hidden
- overview route hub 스타일 추가
- mobile에서 detail panel order를 list보다 앞으로 조정

## QA

- `node --check public/app.js`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `node tests/customer-confirmation.test.js`
- `node scripts/visual-review.mjs`
