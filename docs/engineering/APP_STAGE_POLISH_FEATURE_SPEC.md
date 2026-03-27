# APP_STAGE_POLISH_FEATURE_SPEC

## Scope

- `public/index.html`
- `public/app.js`
- `public/styles.css`
- `scripts/visual-review.mjs`

## Additions

### index.html

- `case-focus-card` 아래에 `stage-action-card` 추가
- 포함 요소
  - `#stage-action-badge`
  - `#stage-action-title`
  - `#stage-action-copy`
  - `#stage-action-completion`
  - `#stage-action-primary`
  - `#stage-action-secondary`

### app.js

- workflow snapshot과 detail 상태를 바탕으로 `stage action snapshot` 생성 함수 추가
- `renderStageAction(snapshot)` 추가
- stage action CTA 동작
  - 현재 카드로 scroll
  - 필요시 다음 stage route로 이동
- `renderWorkflowState()`에서 `renderStageAction()` 호출

### styles.css

- `stage-action-card` 스타일 추가
- mobile breakpoint에서 button stack 강제
- stage route에서 `case-progress-card`와 summary의 시각 우선순위 조정

### visual-review.mjs

- stage route 전용 캡처 추가
  - `/app/quote?caseId=jc_demo_2`
  - `/app/draft?caseId=jc_demo_1`
  - `/app/confirm?caseId=jc_demo_2`

## QA

- `node --check public/app.js`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `node tests/customer-confirmation.test.js`
- `node scripts/visual-review.mjs`

## Rollback

- 새 focus card 제거
- visual-review stage capture 제거
- route split 자체는 유지
