# HOME_APP_ROLE_PARITY_FEATURE_SPEC

## Scope A. Preview parity

- add `deploy/homelab/refresh-preview-postgres-stack.sh`
- self-host deploy workflow에서 `.env.preview-postgres`가 존재하면 preview refresh를 조건부 실행
- preview refresh는:
  - latest code build
  - preview env 유지
  - local Postgres smoke 실행

## Scope B. Home/App role clarity

### /home

- hero title/copy를 운영 출발점 중심으로 수정
- `surface role` 안내 section 추가
- route card CTA와 요약 copy를 `작업 허브` 기준으로 수정

### /app overview

- overview hero/note copy를 실행 허브 기준으로 수정
- overview hub에 `/home` 복귀 action 추가
- overview copy에서 `home/ops/account`로 가야 하는 행위와 현재 화면에서 해야 하는 행위를 분리

## QA

- `node --check public/home.js`
- `node --check public/app.js`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `node tests/customer-confirmation.test.js`
- `node scripts/visual-review.mjs`
