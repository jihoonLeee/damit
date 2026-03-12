# TASK BREAKDOWN

## 문서 목적

- 구현 순서를 실제 작업 단위로 쪼갠다.
- 각 작업이 어떤 스펙과 연결되는지, 언제 PM 점검이 필요한지 명시한다.

## 작업 테이블

| Task ID | 영역 | 작업 | 선행 작업 | 담당 에이전트 | PM 체크포인트 | 완료 기준 |
|---|---|---|---|---|---|---|
| `ENG-01` | Foundation | DB 스키마 초안 작성 및 migration 설계 | 없음 | builder-implementation | `G1` 준비 | `job_case`, `field_record`, `field_record_photo`, `scope_comparison`, `message_draft`, `agreement_record`, `timeline_event` 테이블 설계 완료 |
| `ENG-02` | Foundation | enum/상태 전이 상수 정의 | `ENG-01` | builder-implementation | `G1` 준비 | 문서와 동일한 `UPPER_SNAKE_CASE` enum 사용 |
| `ENG-03` | Foundation | 공통 에러 응답 포맷/코드 매퍼 구현 | `ENG-01` | builder-implementation | `G1` 확인 | `error.code`, `message`, `fieldErrors`, `requestId` 일관 반환 |
| `ENG-04` | Foundation | OWNER 인증/인가 골격 구현 | `ENG-01` | builder-implementation | `G1` 확인 | 모든 API가 owner 컨텍스트에서만 동작 |
| `ENG-05` | Field Record | `POST /field-records` multipart 업로드 구현 | `ENG-02`, `ENG-03`, `ENG-04` | builder-implementation | `G2` | 사진 1장 이상 필수, 유령 레코드 없음 |
| `ENG-06` | Field Record | 빠른 현장 기록 입력 UI 구현 | `ENG-05` | builder-implementation | `G2` | 사진 우선 흐름과 필수 검증 UI 동작 |
| `ENG-07` | Job Case | `POST /job-cases` 구현 | `ENG-02`, `ENG-03`, `ENG-04` | builder-implementation | `G2` 준비 | 고객/현장/원래 견적 필수 검증 완료 |
| `ENG-08` | Job Case | `GET /job-cases` 검색/목록 구현 | `ENG-07` | builder-implementation | `G4` 준비 | 상태 필터와 검색어 동작 |
| `ENG-09` | Linking | `POST /field-records/{id}/link-job-case` 구현 | `ENG-05`, `ENG-07` | builder-implementation | `G2` | 이미 연결된 현장 기록 재연결 방지 |
| `ENG-10` | Detail | `GET /job-cases/{id}` 상세 구현 | `ENG-07`, `ENG-09` | builder-implementation | `G3` 준비 | 상세에 현장 기록, 합의 기록, 초안, 범위 대비 표시 가능한 응답 구성 |
| `ENG-11` | Quote | `PATCH /job-cases/{id}/quote` 구현 | `ENG-10` | builder-implementation | `G3` | 차액 계산 및 validation 동작 |
| `ENG-12` | Scope | `GET /job-cases/{id}/scope-comparison` 구현 | `ENG-09`, `ENG-11` | builder-implementation | `G3` | 기본 포함 범위/추가 작업/추가 이유 응답 |
| `ENG-13` | Draft | `POST /job-cases/{id}/draft-message` 구현 | `ENG-09`, `ENG-11`, `ENG-12` | builder-implementation | `G3` | 현장 기록과 변경 금액 없으면 생성 차단 |
| `ENG-14` | Draft | `GET /job-cases/{id}/draft-message` 구현 | `ENG-13` | builder-implementation | `G3` 확인 | 초안 없으면 `item: null` 반환 |
| `ENG-15` | Agreement | `POST /job-cases/{id}/agreement-records` 구현 | `ENG-10`, `ENG-11` | builder-implementation | `G4` | 상태 변경과 합의 내용 저장 일관 |
| `ENG-16` | Timeline | `GET /job-cases/{id}/timeline` 구현 | `ENG-09`, `ENG-13`, `ENG-15` | builder-implementation | `G4` | 연결/초안/합의 이벤트 조회 가능 |
| `ENG-17` | UI | 작업 건 목록 UI 구현 | `ENG-08`, `ENG-15` | builder-implementation | `G4` | 상태 배지, 최근 업데이트, 합의 여부 반영 |
| `ENG-18` | UI | 작업 건 상세 UI 구현 | `ENG-10`, `ENG-11`, `ENG-12`, `ENG-14`, `ENG-15`, `ENG-16` | builder-implementation | `G4` | 상세 흐름이 `범위 대비 -> 초안 -> 합의 기록` 순서 유지 |
| `ENG-19` | QA | API contract test 작성 | `ENG-05` ~ `ENG-16` | qa-review | `G5` 준비 | 모든 엔드포인트 성공/실패 케이스 검증 |
| `ENG-20` | QA | P0 시나리오 통합 테스트 작성 | `ENG-06`, `ENG-17`, `ENG-18` | qa-review | `G5` | 현장 기록부터 합의 기록까지 완주 테스트 |
| `ENG-21` | Ops | 운영 로그/에러 추적/수동 runbook 정리 | `ENG-19` | builder-implementation | `G5` | requestId 추적과 롤백 절차 문서화 |
| `ENG-22` | PM Review | 파일럿 전 최종 PM 점검 | `ENG-19`, `ENG-20`, `ENG-21` | pm-brainstorm | `G5` | 출시 보류 사유 없음을 문서화 |

## 구현 묶음 제안

### Batch A. Foundation

- `ENG-01`
- `ENG-02`
- `ENG-03`
- `ENG-04`

### Batch B. 현장 입력

- `ENG-05`
- `ENG-06`
- `ENG-07`
- `ENG-09`

### Batch C. 설명 준비

- `ENG-08`
- `ENG-10`
- `ENG-11`
- `ENG-12`
- `ENG-13`
- `ENG-14`

### Batch D. 합의/조회

- `ENG-15`
- `ENG-16`
- `ENG-17`
- `ENG-18`

### Batch E. 안정화

- `ENG-19`
- `ENG-20`
- `ENG-21`
- `ENG-22`

## PM 우선 확인 항목

- `ENG-05` 이후: 사진 없는 기록이 남지 않는지
- `ENG-09` 이후: 현장 기록에서 작업 건 상세로 자연스럽게 넘어가는지
- `ENG-13` 이후: 초안 문구가 고객 설득용으로 충분한지
- `ENG-15` 이후: 상태 변경과 합의 내용 저장이 한 덩어리로 보이는지
- `ENG-18` 이후: 상세 화면이 메모 앱처럼 보이지 않고 증빙 도구처럼 보이는지

## 차단 조건

- 에러 코드가 스펙과 다르면 다음 Batch로 넘어가지 않는다.
- PM 게이트 미통과 상태에서는 P1 기능을 추가하지 않는다.
- `AGREED` 금액 누락 저장 버그가 있으면 파일럿 금지.
- 목록/상세 상태가 엇갈리면 안정화 이전 출시 금지.
