# PRODUCTION_TASK_BREAKDOWN

## 목적

- `파일럿 가능` 상태에서 `실서비스 베타` 상태로 올라가기 위한 작업을 실제 실행 단위로 쪼갠다.
- PM이 각 단계에서 출시 보류 여부를 판단할 수 있도록 게이트를 포함한다.

## 작업 테이블

| Task ID | 영역 | 작업 | 선행 작업 | 담당 | PM 체크포인트 | 완료 기준 |
|---|---|---|---|---|---|---|
| `PROD-01` | Product | production auth / 권한 정책 확정 | 없음 | pm-brainstorm + feature-spec | `A0` | [AUTH_RBAC_SPEC.md](/D:/AI_CODEX_DESKTOP/docs/specs/AUTH_RBAC_SPEC.md) 기준 승인 |
| `PROD-02` | Data | company / user / membership / session 도메인 모델 확장 | `PROD-01` | feature-spec | `A0` | production 엔티티와 enum 정리 완료 |
| `PROD-03` | Infra | migration 도구 선정 및 초기 구조 도입 | `PROD-02` | builder-implementation | `P0` | versioned migration 실행 가능 |
| `PROD-04` | Infra | Postgres schema v1 작성 | `PROD-03` | builder-implementation | `P0` | core + auth + audit 테이블 생성 가능 |
| `PROD-05` | Backend | repository interface 분리 | `PROD-03` | builder-implementation | `P1` | app 레이어가 특정 DB 구현에 직접 의존하지 않음 |
| `PROD-06` | Backend | Postgres adapter 구현 | `PROD-04`, `PROD-05` | builder-implementation | `P1` | 주요 read/write 가 Postgres 로 동작 |
| `PROD-07` | Auth | 이메일 provider / 템플릿 / 재발송 정책 구현 | `PROD-02`, `PROD-06` | builder-implementation | `A1` | staging/prod 발송 분리와 rate limit 반영 |
| `PROD-08` | Auth | 이메일 challenge 발급/검증 API 구현 | `PROD-07` | builder-implementation | `A1` | 공유 코드 없이 로그인 가능 |
| `PROD-09` | Auth | session / refresh / logout + cookie/CSRF 구현 | `PROD-08` | builder-implementation | `A1` | 세션 재발급과 철회 가능 |
| `PROD-10` | Auth | company context 선택 구현 | `PROD-08`, `PROD-09` | builder-implementation | `A1` | 회사 전환과 scope 보장 |
| `PROD-11` | Auth | invitation / membership 관리 구현 | `PROD-10` | builder-implementation | `A2` | OWNER 전용 초대 흐름 검증 |
| `PROD-12` | RBAC | resource authorization middleware 구현 | `PROD-10`, `PROD-11` | builder-implementation | `A2` | OWNER / MANAGER / STAFF 권한 차이 반영 |
| `PROD-13` | App | job_case 등 기존 리소스에 `company_id`, `created_by_user_id`, `visibility` 반영 | `PROD-06`, `PROD-12` | builder-implementation | `P2` | 모든 business data 가 tenant scoped |
| `PROD-14` | Storage | object storage foundation + company-scoped upload path | `PROD-13` | builder-implementation | `P2` | file path and DB metadata stay aligned, and local provider satisfies the production metadata contract |
| `PROD-15` | Storage | 기존 volume uploads -> object storage 이관 유틸 작성 | `PROD-14` | builder-implementation | `P2` | photo metadata 와 object count 일치 |
| `PROD-16` | Audit | audit log append-only 구현 | `PROD-12`, `PROD-13` | builder-implementation | `A3` | 핵심 액션 추적 가능 |
| `PROD-17` | Customer | 고객 확인 링크 도메인/API 구현 | `PROD-13`, `PROD-16`, `PROD-14` | builder-implementation | `A3` | public signed link 발급/열람/확인 가능 |
| `PROD-18` | UI | 로그인 / 회사 선택 / 초대 수락 화면 구현 | `PROD-08` ~ `PROD-11` | builder-implementation | `A1` | 실제 사용자 온보딩 가능 |
| `PROD-19` | UI | 권한별 작업 건 목록/상세 제한 반영 | `PROD-12`, `PROD-13` | builder-implementation | `A2` | STAFF 노출 범위 제한 확인 |
| `PROD-20` | UI | 고객 확인 링크용 읽기 전용 화면 구현 | `PROD-17` | builder-implementation | `A3` | 고객 모바일에서 설명 확인 가능 |
| `PROD-21` | Ops | staging 환경 + env 분리 + secret 정책 정리 | `PROD-06`, `PROD-14` | builder-implementation | `P3` | staging 과 production 분리 운영 |
| `PROD-22` | Ops | backup / restore rehearsal 문서화 및 실행 | `PROD-06`, `PROD-21`, `PROD-14` | builder-implementation + qa-review | `P3` | DB 와 파일 레이어 복구 리허설 통과 |
| `PROD-23` | QA | multitenancy / RBAC / auth 통합 테스트 | `PROD-12` ~ `PROD-20` | qa-review | `A2`, `P2` | cross-tenant leakage 0건 |
| `PROD-24` | QA | Postgres migration rehearsal test | `PROD-04`, `PROD-06`, `PROD-15`, `PROD-22` | qa-review | `P3` | migration / rollback rehearsal 통과 |
| `PROD-25` | PM | production beta readiness review | `PROD-18` ~ `PROD-24` | pm-brainstorm | `GO / HOLD` | blocker 없이 beta 초대 가능 |

## 추천 Batch

### Batch A. Auth Foundation

- `PROD-01`
- `PROD-02`
- `PROD-03`
- `PROD-04`
- `PROD-05`
- `PROD-06`

### Batch B. Identity

- `PROD-07`
- `PROD-08`
- `PROD-09`
- `PROD-10`
- `PROD-11`

### Batch C. Tenantized App

- `PROD-12`
- `PROD-13`
- `PROD-14`
- `PROD-15`
- `PROD-16`
- `PROD-17`

### Batch D. UX / Ops

- `PROD-18`
- `PROD-19`
- `PROD-20`
- `PROD-21`
- `PROD-22`

### Batch E. Release Validation

- `PROD-23`
- `PROD-24`
- `PROD-25`

## PM 우선 확인 항목

- `PROD-08` 이후: 더 이상 공유 접근 코드가 필요 없는가
- `PROD-12` 이후: STAFF 가 타인의 민감 작업 건을 기본적으로 못 보는가
- `PROD-17` 이후: 고객 확인 경험이 설명과 증빙을 실제로 강화하는가
- `PROD-22` 이후: 운영자가 DB 와 파일을 함께 복구할 수 있는가
- `PROD-25` 직전: 지금 버전이 돈을 받고 써도 될 정도로 믿을 만한가

## 보류 조건

- tenant scope 누락이 하나라도 남아 있으면 beta 금지
- auth/session revoke 가 없으면 beta 금지
- audit log 없이 고객 확인 링크를 열면 beta 금지
- 이메일 발송 rate limit 과 delivery 추적 없이 beta 금지
- object storage 이관 검증 없이 beta 금지
- migration rollback rehearsal 실패 시 production cutover 금지

## Latest PM note

- current decision: `HOLD` for runtime Postgres cutover
- immediate next batch should focus on `PROD-07` to `PROD-10` plus a Postgres-backed staging runtime smoke
- do not change live or staging runtime default to `POSTGRES` before that evidence exists
