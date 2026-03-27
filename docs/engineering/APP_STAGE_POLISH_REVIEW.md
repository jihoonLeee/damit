# APP_STAGE_POLISH_REVIEW

## PM verdict

- GO

## What changed

- `quote`, `draft`, `confirm` 화면에 상단 `stage-action-card`를 추가했다.
- 각 stage 화면에서
  - 지금 해야 할 행동
  - 완료 기준
  - 현재 카드로 이동하는 CTA
  - 다음 단계로 이어지는 CTA
  를 바로 보여주도록 정리했다.
- 모바일에서 stage action CTA를 세로 stack으로 바꿔 탭하기 쉽게 만들었다.
- visual review에 stage route 전용 캡처를 추가했다.
  - `mobile-quote-stage.png`
  - `mobile-draft-stage.png`
  - `mobile-confirm-stage.png`
- stage review용 demo case를 visual review seed에 추가했다.

## UX effect

- `quote` 화면은 금액 저장 전/후를 더 분명하게 읽을 수 있다.
- `draft` 화면은 초안 생성 전과 생성 후의 다음 행동이 더 직접적으로 보인다.
- `confirm` 화면은 링크 발급/합의 기록/보류/완료 상태를 더 짧게 이해할 수 있다.
- 모바일에서 기존 카드 내부 액션보다 상단 stage CTA가 먼저 보여, 단계 화면처럼 느껴진다.

## Validation

- `node --check public/app.js`
- `node --check scripts/visual-review.mjs`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `node tests/customer-confirmation.test.js`
- `node scripts/visual-review.mjs`

## Evidence

- `D:\AI_CODEX_DESKTOP\output\visual-review\mobile-quote-stage.png`
- `D:\AI_CODEX_DESKTOP\output\visual-review\mobile-draft-stage.png`
- `D:\AI_CODEX_DESKTOP\output\visual-review\mobile-confirm-stage.png`

## Next recommendation

- `/app` 호환 경로를 장기적으로 `overview hub`로 더 명확히 만들지 판단
- stage별 CTA 문구를 실제 owner 사용 기준으로 한 번 더 짧게 다듬기
- 이후에는 `confirm` 단계의 고객 알림 채널 확장(카카오/문자)과 같이 맞물려 polish
