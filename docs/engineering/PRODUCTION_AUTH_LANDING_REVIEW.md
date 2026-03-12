# PRODUCTION_AUTH_LANDING_REVIEW

## 목적

- `PM`, `Builder`, `Feature`, `QA` 관점으로 auth foundation 과 landing/login 진입면을 교차 검증한 기록을 남긴다.

## PM 판단 요약

- 랜딩 페이지는 `있으면 좋은 옵션`이 아니라, 실제 서비스 전환 시점에는 거의 필수다.
- 다만 본체보다 앞서면 안 되므로 역할은 세 가지로 제한해야 한다.
  - 제품 신뢰 형성
  - 로그인/베타 진입 안내
  - pilot workspace 와 production beta 준비 상태 구분
- 이번 구현은 그 범위를 넘지 않았으므로 `GO`다.

## Round 1

### Builder 제안

- root 를 landing 으로 분리
- `/login`, `/beta-home`, `/app` 진입 구조 분리
- magic link auth API 추가
- file mail gateway 와 session cookie foundation 추가

### Feature 피드백

- tenant scope 가 없는 상태에서 기존 workspace 를 session auth 사용자에게 바로 연결하면 위험하다.
- 따라서 login 성공 후 바로 production workspace 로 붙이지 말고, auth foundation 완료 상태를 보여주는 안전한 중간 화면이 필요하다.

### QA 피드백

- `challenge -> setup required -> verify -> me` 흐름이 자동 테스트로 있어야 한다.
- 기존 pilot API 회귀도 같이 통과해야 한다.

### PM 피드백

- 랜딩은 마케팅 과장이 아니라 신뢰와 상태 구분에 집중해야 한다.
- `/app` 이 아직 pilot workspace 라는 사실을 사용자에게 분명히 보여줘야 한다.

## Round 2

### Builder 수정

- [landing.html](/D:/AI_CODEX_DESKTOP/public/landing.html) 추가
- [login.html](/D:/AI_CODEX_DESKTOP/public/login.html), [login.js](/D:/AI_CODEX_DESKTOP/public/login.js) 추가
- [beta-home.html](/D:/AI_CODEX_DESKTOP/public/beta-home.html), [beta-home.js](/D:/AI_CODEX_DESKTOP/public/beta-home.js) 추가
- [mail-gateway.js](/D:/AI_CODEX_DESKTOP/src/mail-gateway.js) 추가
- [auth-store.js](/D:/AI_CODEX_DESKTOP/src/auth-store.js), [auth-runtime.js](/D:/AI_CODEX_DESKTOP/src/auth-runtime.js) 추가
- [app.js](/D:/AI_CODEX_DESKTOP/src/app.js) 에 auth routes / static routing 반영
- [index.html](/D:/AI_CODEX_DESKTOP/public/index.html) 에 pilot workspace 문구 반영

### Feature 재검증

- OWNER-only invitation, magic link only, cookie/session 방향과 충돌 없음
- tenantization 전에는 `/app` 을 pilot workspace 로 분리 유지하는 현재 선택이 안전함

### QA 재검증

- [auth-foundation.test.js](/D:/AI_CODEX_DESKTOP/tests/auth-foundation.test.js) 추가
- [api.test.js](/D:/AI_CODEX_DESKTOP/tests/api.test.js) 회귀 통과
- [repository-batch-a.test.js](/D:/AI_CODEX_DESKTOP/tests/repository-batch-a.test.js) foundation 통과

## 검증 결과

- auth foundation test: pass
- repository batch A test: pass
- 기존 pilot API test: pass

## 남은 리스크

- session 기반 auth 와 tenantized workspace 는 아직 연결되지 않았다.
- 이메일 provider 는 dev 에서 file gateway 로 검증했고, production provider credential 연결은 별도 필요하다.
- invitation UI 와 company switch UI 는 다음 구현 배치다.

## 최종 PM 판단

- 현재 결과는 `안전한 진입면 + auth foundation`으로서 만족스럽다.
- 특히 랜딩 페이지가 제품 신뢰와 상태 구분 역할을 하도록 좁혀진 점이 좋다.
- 다음 구현은 `tenantized app integration` 이전에 `provider 실연동 + session/refresh hardening + company context UI`를 마무리하는 순서가 맞다.
