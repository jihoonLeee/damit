# HOME_APP_ROLE_PARITY_REVIEW

## PM verdict

- GO

## What changed

- `/home`를 `운영 출발점`으로 다시 설명했다.
- `/app` overview를 `건별 실행 허브`로 다시 설명했다.
- self-host deploy 이후 `.env.preview-postgres`가 있으면 preview Postgres stack도 최신 코드 기준으로 다시 빌드/스모크하도록 경로를 추가했다.

## UX effect

- 운영자는 `/home`에서 회사, 세션, 멤버, 초대, 이동 판단을 먼저 보고,
- 실제 견적/초안/합의 작업은 `/app`에서 처리한다는 점을 더 빨리 이해할 수 있다.
- preview Postgres 검수도 production 최신 프론트와 덜 어긋난다.

## Implementation

- new script: `deploy/homelab/refresh-preview-postgres-stack.sh`
- workflow update: `.github/workflows/self-host-deploy.yml`
- surface clarity:
  - `public/home.html`
  - `public/home.js`
  - `public/index.html`
  - `public/app.js`
  - `public/styles.css`
  - `scripts/visual-review.mjs`

## Validation

- `node --check public/home.js`
- `node --check public/app.js`
- `node --check scripts/visual-review.mjs`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `node tests/customer-confirmation.test.js`
- `node scripts/visual-review.mjs`

## Evidence

- `D:\AI_CODEX_DESKTOP\output\visual-review\desktop-home-authenticated.png`
- `D:\AI_CODEX_DESKTOP\output\visual-review\mobile-home-authenticated.png`
- `D:\AI_CODEX_DESKTOP\output\visual-review\desktop-app-authenticated.png`
- `D:\AI_CODEX_DESKTOP\output\visual-review\mobile-app-overview-hub.png`

## Next recommendation

- preview Postgres stack가 self-host deploy 이후 실제로 최신 프론트를 계속 따라오는지 live에서 한 번 더 확인
- 그 다음 `/home`에서 정산/운영 요약을 얼마나 더 키울지 판단
