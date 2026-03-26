# Security Status

Date: 2026-03-26
Owner: PM
Status: conditional-go for trusted environments

## PM verdict

- local operational runtime: `GO`
- self-host trusted runtime: `GO`
- public production: `HOLD`

## Summary

현재 프로젝트의 보안선은 `신뢰된 환경에서 운영형 제품을 돌리는 수준`으로는 꽤 괜찮다.
특히 인증, 세션, CSRF, role gate, owner/admin 분리, 보안 헤더는 생각보다 단단하게 들어가 있다.

다만 이 상태를 바로 `공개 인터넷 production SaaS`라고 부르기에는 아직 이르다.
가장 큰 이유는 다음 3가지다.

1. 실메일 운영이 아직 cutover 되지 않았다.
2. brute force / rate limit / abuse control 증거가 약하다.
3. single-node SQLite trusted runtime 기준으로는 충분하지만, 공개 환경 운영 증거는 아직 부족하다.

## What is strong now

### 1. Session and browser security

- 세션 쿠키는 `HttpOnly`로 발급된다.
- `SameSite=Strict` 기본이 들어가 있다.
- production 환경에서는 `Secure`가 붙도록 되어 있다.
- 상태 변경 요청은 CSRF 토큰을 요구한다.
- production-like 모드에서는 trusted origin 검사도 강제할 수 있다.

Relevant files:

- `src/contexts/auth/application/auth-runtime.js`
- `src/config.js`

### 2. Response hardening

- JSON 및 HTML 응답에 기본 보안 헤더가 붙는다.
- 민감한 auth/session 응답은 `no-store`로 내려간다.
- frame embedding, mime sniffing, referrer, permissions, baseline CSP가 들어가 있다.

Relevant files:

- `src/http.js`

### 3. Role and surface separation

- `/ops`는 OWNER 전용이다.
- `/admin`은 allowlisted internal admin 전용이다.
- `/account`는 계정/업체 운영 표면으로 분리되어 있다.
- 회사 컨텍스트와 role gate가 API 레벨에서 걸려 있다.

Relevant files:

- `src/http/system-routes.js`
- `src/app.js`

### 4. Trusted self-host posture

- self-host 경로는 Tailscale trusted access를 전제로 설계했다.
- GitHub Actions self-host 배포도 Tailscale을 통해 들어간다.
- 이건 지금 단계에선 포트포워딩 직공개보다 훨씬 안전한 선택이다.

Relevant files:

- `.github/workflows/self-host-deploy.yml`
- `deploy/homelab/docker-compose.yml`
- `docs/self-host/README.md`

## Main remaining risks

### P1. Public production abuse controls are not yet proven

- 로그인 challenge 발급과 magic-link flow에 대해 rate limiting 증거가 아직 부족하다.
- 공개 배포 시에는 brute force, flooding, invitation abuse를 더 강하게 막아야 한다.

### P1. Live mail cutover is not complete

- Resend live path는 준비돼 있지만 발신 도메인 검증 전이라 운영 증거가 없다.
- 지금은 file/debug 중심 fallback이 남아 있다.

### P2. CSP is baseline-safe, but not maximally strict

- 현재 CSP는 꽤 괜찮지만 스타일 쪽 `unsafe-inline`이 남아 있다.
- 지금 단계에선 허용 가능하지만, 장기적으로는 더 줄이는 편이 좋다.

### P2. SQLite single-node posture is good for trusted ops, not broad public scale

- self-host trusted runtime에는 적합하다.
- 다중 인스턴스, 고가용성, 강한 운영 복구 요건까지 포함한 public production 기준으로는 아직 hold가 맞다.

## PM recommendation

### Keep using now

- local runtime
- self-host Ubuntu + Docker Compose
- Tailscale trusted access
- session + CSRF + trusted-origin hardened mode

### Do not claim yet

- public production readiness
- live mail production readiness
- abuse-resistant public auth perimeter

## Next security priorities

1. login / invitation / confirmation write flows에 대한 rate-limit 설계
2. 실메일 cutover 후 end-to-end proof
3. public production 전용 보안 게이트 문서 재검토

## Bottom line

냉정하게 보면:

- `신뢰된 환경 운영`: 꽤 괜찮음
- `공개 서비스 보안`: 아직 보류

즉 지금 제품은 "보안이 약하다"가 아니라,
"현재 목표 환경에는 맞고, 공개 production이라고 부르기엔 아직 근거를 더 쌓아야 한다"가 정확한 평가다.
