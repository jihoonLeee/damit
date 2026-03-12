# PRODUCTION_TENANT_WORKSPACE_REVIEW

## 목적

- `PM`, `Builder`, `Feature`, `QA`가 `tenantized beta workspace foundation` 배치를 교차 검증한 결과를 남긴다.
- 이번 배치가 `shared pilot workspace`에서 `company-scoped beta workspace`로 올라가는 첫 단계인지 판단한다.

## Round 1

### PM 우려

- 인증이 붙어도 business data 가 `company_id` 기준으로 분리되지 않으면 실서비스로 볼 수 없다.
- 특히 `OWNER_TOKEN` 기반 파일럿과 session beta 가 같은 데이터를 그대로 보면 사용자 혼동과 데이터 누수 위험이 생긴다.
- STAFF 가 금액 수정까지 해버리면 역할 경계가 금방 무너진다.

### Feature 판단

- `/app`은 legacy pilot 로 유지하고, session 기반 사용자는 별도 `beta workspace`로 분리하는 것이 가장 안전하다.
- v1 기준 STAFF 는 `조회/초안/합의 기록`은 허용하되 `견적 금액 수정`은 막는 것이 맞다.
- OWNER/MANAGER 가 만든 건은 초반 협업성을 위해 `TEAM_SHARED`, STAFF 가 만든 건은 `PRIVATE_ASSIGNED` 기본값이 적절하다.

### Builder 제안

- SQLite business schema 에 `company_id`, `created_by_user_id`, `assigned_user_id`, `visibility`, `updated_by_user_id` 컬럼 추가
- business routes 를 `owner-token or session` 이중 모드로 바꾸되 session 일 때만 tenant/RBAC 필터 적용
- `/beta-app` 정적 진입면 추가
- 기존 [app.js](/D:/AI_CODEX_DESKTOP/public/app.js)를 auth-mode 분기형으로 재사용

### QA 요구

- 기존 pilot API 회귀가 그대로 통과해야 한다.
- `company A 데이터가 company B 에 안 보이는지`를 테스트로 증명해야 한다.
- STAFF 가 shared job case 는 볼 수 있어도 quote 수정은 못 하는 테스트가 필요하다.

## Builder 반영

- backend: [app.js](/D:/AI_CODEX_DESKTOP/src/app.js)
- storage schema: [store.js](/D:/AI_CODEX_DESKTOP/src/store.js)
- beta workspace entry: [beta-app.html](/D:/AI_CODEX_DESKTOP/public/beta-app.html)
- shared UI auth branching: [app.js](/D:/AI_CODEX_DESKTOP/public/app.js)
- tenant/RBAC test: [beta-workspace.test.js](/D:/AI_CODEX_DESKTOP/tests/beta-workspace.test.js)

## QA 검증

- `node tests/api.test.js` pass
- `node tests/auth-foundation.test.js` pass
- `node tests/repository-batch-a.test.js` pass
- `node tests/beta-workspace.test.js` pass
- `node --check public/app.js` pass
- `node --check public/beta-home.js` pass
- `node --check public/login.js` pass

## 핵심 확인 포인트

- session business write 는 CSRF 를 요구한다.
- company 간 job case 목록/상세는 분리된다.
- STAFF 는 shared case 를 읽고 agreement 는 남길 수 있지만 quote 수정은 403 이다.
- legacy `/app` 과 beta `/beta-app` 진입면이 분리된다.

## 남은 리스크

- 현재 tenantized workspace 는 SQLite 기반이다. production cutover 전에는 Managed Postgres 로 올라가야 한다.
- object storage 와 customer confirmation link 는 아직 다음 배치다.
- 권한은 foundation 수준이고, assignment UI 나 membership 변경 UI 는 아직 없다.

## 최종 PM 판단

- 이번 배치는 `GO`다.
- 이유는 세 가지다.
  - business data 가 처음으로 company scope 와 role rule 을 갖게 됐다.
  - 파일럿과 beta 경계를 UI/라우팅에서 분리했다.
  - cross-tenant leakage 와 STAFF 금액 수정 제한이 테스트로 보장된다.
- 다음 우선순위는 `Postgres 실제 연결`, `beta-app live 배포 검증`, `customer confirmation link`다.
