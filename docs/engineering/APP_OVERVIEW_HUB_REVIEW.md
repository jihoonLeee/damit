# APP_OVERVIEW_HUB_REVIEW

## PM verdict

- GO

## What changed

- `/app` overview를 full workspace 호환 화면보다 `overview hub`로 재정의했다.
- overview에서 capture 입력 패널을 숨기고, 선택된 작업 건 기준 stage route 카드 4개를 먼저 보여준다.
- overview에서는 직접 편집 카드 대신
  - 현재 작업 건 요약
  - overview hub
  - 단계 이동 카드
  - 진행 단계
  - 금액 요약
  순서로 읽히게 정리했다.
- 모바일에서는 detail hub가 목록보다 먼저 보이도록 순서를 조정했다.
- visual review에 `mobile-app-overview-hub.png`를 추가했다.

## UX effect

- `/app`에 들어갔을 때 "어느 단계로 가야 하는지"가 먼저 보인다.
- 작업 건이 선택된 상태에서는 quote/draft/confirm 중 어디가 막혀 있는지 더 짧게 읽힌다.
- 모바일에서도 이전보다 허브 성격이 훨씬 분명하다.

## Validation

- `node --check public/app.js`
- `node --check scripts/visual-review.mjs`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `node tests/customer-confirmation.test.js`
- `node scripts/visual-review.mjs`

## Evidence

- `D:\AI_CODEX_DESKTOP\output\visual-review\mobile-app-overview-hub.png`
- `D:\AI_CODEX_DESKTOP\output\visual-review\desktop-app-authenticated.png`

## Next recommendation

- `/home`와 `/app`의 역할 차이를 한 번 더 정리해, 둘 다 허브로 보이지 않게 다듬기
- `confirm` 단계의 고객 알림 채널 확장과 함께 마지막 단계 CTA를 더 또렷하게 polish
