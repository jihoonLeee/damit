# POST_LOGIN_EXCEPTION_POLISH_REVIEW

## PM verdict

- `GO`

## What changed

- 로그인 화면에서 `next` 목적지를 읽어, 로그인 후 어디로 돌아가는지 문장으로 바로 보이게 정리했다.
- `session-expired`, `logged-out` 복귀 메시지가 단순 상태 안내가 아니라 다음 이동 경로와 연결되도록 바꿨다.
- 운영 홈 상단에 복귀 배너와 행동 버튼을 추가해, `owner-required`와 `company-switched` 상태에서 바로 다음 화면으로 넘어갈 수 있게 했다.
- 회사 전환 안내, 역할 기반 추천 경로, `/app`과 `/ops`의 차이를 더 짧고 분명한 문장으로 다시 정리했다.
- 운영 콘솔에서 권한이 부족할 때 `/home?reason=owner-required&next=/app`로 보내도록 바꿔, 막힘보다 대안을 먼저 보이게 했다.

## UX assessment

- 예외 흐름이 더 이상 “막힌 상태”처럼 보이지 않고, 같은 제품 안의 정상 분기처럼 읽힌다.
- 로그인 화면은 이제 메일 링크 요청 이후 목적지까지 예측 가능하다.
- 운영 홈은 요약 화면을 넘어, 역할과 회사 컨텍스트에 맞는 handoff 화면 역할을 더 잘 수행한다.

## Validation

- `node --check public/login.js`
- `node --check public/home.js`
- `node --check public/ops.js`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `node tests/api.test.js`
- `node scripts/visual-review.mjs`

## Remaining follow-up

- `/home` 자체의 authenticated 시각 캡처를 별도 기준으로 남기면 이후 UX 회귀 검수가 더 쉬워진다.
- 메일 로그인 cutover는 계속 `HOLD`다. 실제 발신 도메인 검증 전까지는 운영 준비만 유지하는 판단이 맞다.
