# AUTH_RBAC_SPEC

## 문서 목적

- 파일럿용 `OWNER_TOKEN` 구조를 실제 서비스용 인증/권한 모델로 전환하기 위한 기준을 정의한다.
- PM, feature-spec, builder가 같은 사용자 모델과 권한 판단 기준을 보도록 한다.

## PM 한 줄 결론

- 실제 서비스에서는 `공유 접근 코드`를 절대 유지하면 안 된다.
- 내부 사용자는 정식 로그인과 역할 기반 권한을 가져야 하고, 고객은 로그인 없이도 안전한 확인 링크를 통해 내용을 확인할 수 있어야 한다.

## 현재 MVP와의 차이

### 현재 상태

- 단일 `OWNER_TOKEN`으로 모든 API 접근
- 사용자 개념 없음
- 사업장 개념 없음
- 고객 확인 경험 없음

### Production v1 상태

- 사업장 단위 계정
- 사용자별 로그인
- 역할 기반 권한
- 초대 기반 멤버 합류
- 고객 확인 링크는 별도 public token으로 처리

## 핵심 결정

### 내부 사용자 인증 방식

- v1 beta 기본 인증은 `이메일 magic link` 단일 방식으로 간다.
- `이메일 OTP`는 추후 fallback 옵션으로만 검토하고, v1 구현 범위에서는 제외한다.
- 비밀번호 기반 로그인은 v1 범위에서 제외한다.
- 이유:
  - 소규모 사업장 온보딩 마찰이 가장 낮다.
  - 패스워드 재설정/보안 운영 복잡도를 줄일 수 있다.
  - OTP와 magic link를 동시에 열면 challenge 모델과 UI가 불필요하게 복잡해진다.

### 고객 인증 방식

- 고객은 계정을 만들지 않는다.
- 고객은 `서명된 확인 링크`로만 접근한다.
- 링크는 만료 시간과 1회성 확인 이벤트를 가진다.

### 이메일 발송 인프라

- v1 beta 는 `transactional email provider`를 반드시 사용한다.
- 권장 우선순위:
  - 1순위: `Resend`
  - 2순위: `Postmark`
- staging 환경은 실제 고객 메일 발송 대신 sandbox inbox 또는 allowlist 대상에게만 발송한다.
- provider 선택과 무관하게 앱 내부에는 `mail gateway interface`를 둔다.
- challenge / invitation / customer notification 템플릿은 provider 종속 로직과 분리한다.

### 이메일 발송 실패 정책

- challenge 발송 실패는 사용자에게 일반화된 오류 메시지로 응답한다.
- 내부 로그에는 `provider`, `template`, `recipient`, `request_id`, `error_code`를 남긴다.
- challenge 재발송 제한:
  - 같은 이메일 기준 `60초` 이내 재발송 금지
  - `10분` 기준 `5회` 초과 시 일시 차단
- invitation 재발송 제한:
  - 같은 invitation 기준 `5분` 이내 재발송 금지
- staging 에서 production 수신자에게 실발송 금지

## 사용자 유형

### 1. Internal User

- 제품을 사용하는 사업장 소속 사용자
- 예: 대표, 실장, 현장 직원

### 2. Customer Viewer

- 작업 건의 설명과 변경 금액을 확인하는 외부 고객
- 로그인 계정 없음
- signed link 로만 접근

### 3. Platform Admin

- 운영/지원 인력
- production v1에서는 최소 권한 read-mostly 기준

## 조직 모델

### company

- 하나의 사업장 또는 업체 단위
- 모든 업무 데이터의 최상위 소유자

### membership

- user 와 company 의 연결 엔티티
- 역할과 상태를 보유

## 역할 정의

### OWNER

- 사업장 생성자
- 결제/플랜/멤버 초대/전체 데이터 접근 가능
- 민감 운영 액션 가능

### MANAGER

- 작업 건 전체 조회/수정 가능
- 현장 기록, 설명 초안, 합의 기록 작성 가능
- 멤버 초대 불가
- 결제/플랜 변경 불가

### STAFF

- 본인 생성 또는 배정된 작업 건 중심 사용
- 현장 기록 생성 가능
- 합의 기록 입력 가능
- 멤버 관리/사업장 설정 접근 불가

### PLATFORM_ADMIN

- 운영 이슈 대응용
- 기본은 read-only
- 데이터 수정은 break-glass 절차 필요

## 상태 정의

### user.status

- `PENDING_VERIFICATION`
- `ACTIVE`
- `DISABLED`

### membership.status

- `INVITED`
- `ACTIVE`
- `SUSPENDED`
- `REMOVED`

### login_challenge.status

- `ISSUED`
- `VERIFIED`
- `EXPIRED`
- `CONSUMED`

### customer_confirmation_link.status

- `ACTIVE`
- `VIEWED`
- `CONFIRMED`
- `EXPIRED`
- `REVOKED`

## 권장 엔티티

### user

- `id`
- `email`
- `display_name`
- `phone_number` nullable
- `status`
- `last_login_at`
- `created_at`
- `updated_at`

### company

- `id`
- `name`
- `owner_user_id`
- `plan_code`
- `status`
- `created_at`
- `updated_at`

### membership

- `id`
- `company_id`
- `user_id`
- `role`
- `status`
- `invited_by_user_id`
- `joined_at`
- `created_at`
- `updated_at`

### login_challenge

- `id`
- `user_id` nullable
- `email`
- `token_hash`
- `status`
- `expires_at`
- `consumed_at`
- `request_ip`
- `delivery_provider`
- `delivery_status`
- `created_at`

### session

- `id`
- `user_id`
- `company_id`
- `membership_id`
- `refresh_token_hash`
- `last_seen_at`
- `expires_at`
- `revoked_at` nullable
- `created_at`

### invitation

- `id`
- `company_id`
- `email`
- `role`
- `invited_by_user_id`
- `status`
- `token_hash`
- `expires_at`
- `accepted_at` nullable
- `last_sent_at` nullable
- `created_at`

### audit_log

- `id`
- `company_id`
- `actor_user_id` nullable
- `actor_type`
- `action`
- `resource_type`
- `resource_id`
- `request_id`
- `payload_json`
- `created_at`

## 인증 흐름

### A. 사업장 첫 가입

1. 사용자가 이메일 입력
2. magic link 발송
3. 검증 성공 시 user 생성 또는 재활성화
4. company 생성
5. OWNER membership 생성
6. session 발급

### B. 기존 사용자 로그인

1. 이메일 입력
2. challenge 발급
3. 검증 성공
4. 소속 company 목록 조회
5. 회사 선택 또는 마지막 회사로 진입
6. access token + refresh session 발급

### C. 멤버 초대

1. OWNER 가 이메일과 역할 입력
2. invitation 생성
3. 초대 링크 발송
4. 초대받은 사용자가 로그인/가입
5. invitation 과 membership 연결

## 세션 전략

### 권장 구조

- `Access Token`: 짧은 만료의 signed token
- `Refresh Session`: 서버 저장 기반 session
- `Access Token`과 `Refresh Token` 모두 httpOnly secure cookie 사용
- 현재 선택된 `company_id`는 서버 세션 또는 signed cookie 로 유지

### 이유

- 단순 bearer token localStorage 보다 탈취 리스크가 낮다.
- 세션 철회, 강제 로그아웃, 사업장 전환 처리에 유리하다.

### 클라이언트-서버 전송 계약

- 브라우저 앱은 인증 토큰을 `Authorization header`가 아니라 cookie 기반으로 주고받는다.
- state-changing 요청은 `CSRF token header`를 함께 보낸다.
- `POST /auth/verify` 성공 시 서버가 session cookie 를 설정한다.
- `POST /companies/{id}/switch-context` 성공 시 현재 company context 를 교체한다.
- public customer confirmation 링크는 인증 cookie 없이 동작한다.
- native app 또는 향후 모바일 앱이 필요해질 때만 bearer token flow 를 별도 추가 검토한다.

## 권한 판단 규칙

### 공통 규칙

- 모든 내부 API 는 `authenticated user + selected company context`가 있어야 한다.
- 모든 business data 는 `company_id` 단위로 scope 제한한다.
- `company_id`가 없는 리소스는 production v1 에서 허용하지 않는다.

### 세부 규칙

- `OWNER`
  - 전 리소스 생성/조회/수정 가능
  - 멤버 관리 가능
  - 결제/플랜 변경 가능
- `MANAGER`
  - 작업 건, 현장 기록, 초안, 합의 기록 전부 접근 가능
  - 멤버 초대 불가
  - 결제/플랜 변경 불가
- `STAFF`
  - 작업 건 조회는 `assigned or created` 기준 기본 허용
  - 배정되지 않은 전체 작업 건 열람은 기본 비허용
  - 사업장 설정과 백업은 비허용

## 리소스별 권한 매트릭스

| 리소스 | 액션 | OWNER | MANAGER | STAFF | PLATFORM_ADMIN |
|---|---|---|---|---|---|
| `company` | 조회 | 허용 | 제한 | 제한 | 허용 |
| `company` | 설정 수정 | 허용 | 비허용 | 비허용 | 제한 |
| `membership` | 초대/변경/제거 | 허용 | 비허용 | 비허용 | 제한 |
| `job_case` | 생성 | 허용 | 허용 | 허용 | 조회만 |
| `job_case` | 전체 조회 | 허용 | 허용 | 제한 | 허용 |
| `job_case` | 수정 | 허용 | 허용 | 제한 | 제한 |
| `field_record` | 생성 | 허용 | 허용 | 허용 | 조회만 |
| `message_draft` | 생성 | 허용 | 허용 | 허용 | 조회만 |
| `agreement_record` | 생성 | 허용 | 허용 | 허용 | 조회만 |
| `audit_log` | 조회 | 허용 | 제한 | 비허용 | 허용 |
| `billing` | 조회/수정 | 허용 | 비허용 | 비허용 | 제한 |

## STAFF 접근 제한 기준

### 기본 원칙

- STAFF 가 볼 수 있는 작업 건은 아래 중 하나를 만족해야 한다.
- `created_by_user_id = currentUser`
- `assigned_user_id = currentUser`
- `visibility = TEAM_SHARED`

### 이유

- 현장 직원에게 전체 고객 데이터를 과도하게 노출하지 않기 위함
- 사업장 규모가 커질수록 최소 권한 원칙이 더 중요해짐

## 고객 확인 링크 규칙

### 목적

- 고객이 로그인 없이도 설명, 사진, 변경 금액을 확인하게 한다.
- 확인 이벤트를 증빙으로 남긴다.

### 규칙

- 링크는 job_case 단위로 발급
- 만료 시간 기본 72시간
- 재발송 시 기존 링크는 `REVOKED` 또는 `EXPIRED`
- 고객 확인 시 아래 저장
  - viewed_at
  - confirmed_at
  - request_ip
  - user_agent
  - confirmation_note optional

## 감사 로그 규칙

### 반드시 남길 이벤트

- 로그인 성공/실패
- 회사 전환
- 멤버 초대/권한 변경
- 작업 건 생성/수정/삭제
- 합의 기록 생성/수정
- 고객 확인 링크 생성/재발송/열람/확인

### 로그 원칙

- append-only
- 사용자 visible history 와 운영 audit log 를 분리
- payload 는 최소한으로 남기되 분쟁 판단에 필요한 핵심 필드는 보존

## API 영향

### 대체/추가 필요한 엔드포인트

- `POST /auth/challenges`
- `POST /auth/verify`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`
- `GET /companies`
- `POST /companies/{id}/switch-context`
- `POST /companies/{id}/invitations`
- `GET /companies/{id}/memberships`
- `PATCH /memberships/{id}`
- `POST /job-cases/{id}/customer-confirmation-links`
- `GET /confirm/{token}` public
- `POST /confirm/{token}/acknowledge` public

### auth API 계약 메모

- `POST /auth/challenges`
  - 입력: `email`
  - 출력: `challenge_id`, `retry_after_seconds`
- `POST /auth/verify`
  - 입력: `challenge_id`, `token`
  - 출력: `user`, `companies`, `needs_company_selection`
- `POST /auth/refresh`
  - 입력 body 없음, refresh cookie 사용
  - 출력: `ok`
- `POST /auth/logout`
  - 현재 session revoke
- `GET /me`
  - 현재 user, membership, selected company 반환

## 보안 정책

- refresh token 은 원문 저장 금지
- invitation token 은 hash 로 저장
- customer confirmation token 도 hash 로 저장
- rate limit 적용
  - auth request
  - challenge verify
  - public confirm access
- session revoke 기능 필요

## PM 출시 게이트

### G-A1. 인증 신뢰성

- 내부 사용자가 공유 코드 없이 로그인 가능
- 초대와 탈퇴 흐름이 정상 동작
- 이메일 발송 실패와 재발송 제한이 운영 로그에서 추적 가능

### G-A2. 권한 안전성

- STAFF 가 타인의 민감 작업 건을 기본적으로 못 본다
- OWNER / MANAGER / STAFF 권한 차이가 테스트로 보장된다

### G-A3. 고객 확인성

- 고객 링크 열람/확인 이벤트가 로그와 화면에서 재구성 가능하다

## v1 구현 순서

1. user / company / membership 모델 추가
2. 이메일 provider 와 challenge 발송 구조 추가
3. session / refresh 구조 추가
4. company context 선택 추가
5. invitation 흐름 추가
6. STAFF 범위 제한 추가
7. audit log 추가
8. customer confirmation link 추가
