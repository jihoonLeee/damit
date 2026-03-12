# PRODUCTION_COMPANY_CONTEXT_REVIEW

## 목적

- `PM`, `Builder`, `Feature`, `QA`가 `company context + invitation + refresh hardening` 배치를 교차 검증한 결과를 남긴다.
- 이번 배치가 `tenantized production app` 직전 단계로 충분한지 판단한다.

## Round 1

### PM 우려

- login invitation 이 `초대 링크 -> 로그인 링크`로 이어질 때 토큰이 사라지면 사용자는 합류하지 못한다.
- `/beta-home`이 단순 성공 화면이면 company context 와 team invitation 가치가 전달되지 않는다.
- `refresh`가 잘못 구현되면 배포 후 로그인 유지 체감이 바로 무너진다.

### Feature 판단

- invitation token 은 challenge 생성 시점부터 magic link 에 다시 실려야 한다.
- `GET /me`는 active company 뿐 아니라 `companies` 목록까지 같이 돌려줘야 beta home 이 바로 그려진다.
- 멤버 초대는 v1에서 `OWNER only`로 유지해야 역할 경계가 흐려지지 않는다.

### Builder 제안

- `sendMagicLinkEmail()`이 invitation token 을 다시 붙여주도록 수정
- `sendInvitationEmail()` 추가
- `/api/v1/companies`, `/switch-context`, `/memberships`, `/invitations` 구현
- beta home 에 회사 전환, 멤버 리스트, 초대 폼 추가

### QA 요구

- `refresh` 회귀 테스트 필요
- `owner invites user -> invited user joins second company -> switch context` 전체 시나리오 테스트 필요
- 기존 pilot API 와 foundation test 는 그대로 통과해야 함

## Round 2

### Builder 반영

- [app.js](/D:/AI_CODEX_DESKTOP/src/app.js)에 회사 컨텍스트/초대 API 추가
- [auth-store.js](/D:/AI_CODEX_DESKTOP/src/auth-store.js)에 invitations list, company switch, refresh payload 확장
- [mail-gateway.js](/D:/AI_CODEX_DESKTOP/src/mail-gateway.js)에 invitation email 추가
- [login.js](/D:/AI_CODEX_DESKTOP/public/login.js)에서 invitation token 보존
- [beta-home.html](/D:/AI_CODEX_DESKTOP/public/beta-home.html), [beta-home.js](/D:/AI_CODEX_DESKTOP/public/beta-home.js)에서 company context UI 추가
- [auth-foundation.test.js](/D:/AI_CODEX_DESKTOP/tests/auth-foundation.test.js)에 refresh/company invite/switch 시나리오 추가

### Feature 재검증

- invitation token 이 로그인 링크에도 유지되어 초대 흐름이 끊기지 않음
- owner token 기반 pilot workspace 와 session auth beta scope 가 여전히 분리되어 있어 안전함
- `OWNER only invitation` 경계가 API/화면 모두 일치함

### QA 재검증

- auth foundation test: pass
- repository batch A test: pass
- pilot API test: pass

## 추가 세부 점검

### PM 체크

- beta home 이 이제 단순 성공 화면이 아니라 `활성 회사`, `팀 멤버`, `초대 상태`를 보여줘 다음 단계 가치가 분명해졌다.
- `/app`은 여전히 pilot workspace 라고 명확히 분리되어 있어 혼동을 줄인다.

### Builder 체크

- refresh 는 새 refresh cookie 를 발급하고 기존 company context 를 유지한다.
- logout 은 session revoke 실패 시 refresh token revoke 로 한 번 더 정리한다.

### Feature 체크

- invite link 는 `/login?invitationToken=...&email=...` 구조로 단순하다.
- magic link 는 invitation token 을 재부착하므로 email delivery 와 auth verify 계약이 맞는다.

### QA 체크

- 시나리오 테스트에서 실제로 두 회사를 가진 유저가 context switch 까지 수행한다.
- 기존 P0 현장 기록 플로우는 회귀 없음.

## 남은 리스크

- 실제 production mail provider credential 연동은 아직 dev file gateway 기준이다.
- beta home 은 company context foundation 까지이며, tenantized business workspace 와 직접 연결되진 않았다.
- object storage 와 Postgres 실전 전환은 다음 배치 구현이 필요하다.

## 최종 PM 판단

- 이번 배치는 `GO`다.
- 이유는 세 가지다.
  - session/login/company/invitation 흐름이 실제로 이어진다.
  - 역할 경계가 보수적으로 유지된다.
  - pilot workspace 와 production beta foundation 이 섞이지 않는다.
- 다음 구현 우선순위는 `Postgres 실제 연결`, `mail provider 실연동`, `tenantized workspace integration`이다.
