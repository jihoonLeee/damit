# FEATURE SPECS

## 문서 목적

- `현장 추가금 합의 비서` MVP를 구현 가능한 기능 단위로 정의한다.
- 기준 문서:
  - `docs/product/PRD.md`
  - `docs/product/MVP_SCOPE.md`
  - `docs/ux/IA.md`
  - `docs/ux/SCREEN_FLOW.md`
  - `docs/ux/SCREEN_SPECS.md`
  - `docs/specs/SPEC_DECISION_REVIEW.md`

## 구현 우선순위

1. 빠른 현장 기록 생성
2. 작업 건 생성 또는 기존 작업 건 연결
3. 범위 대비 + 변경 견적 저장
4. 고객 설명 초안 생성
5. 합의 기록 저장
6. 목록/상세/타임라인 조회

## 공통 구현 원칙

- 내부 enum 은 모두 `UPPER_SNAKE_CASE`로 통일한다.
- 상태 변경의 단일 쓰기 경로는 `agreement_record` 생성이다.
- `job_case.current_status`는 파생/캐시 필드다.
- MVP 권한은 `OWNER` 단일 역할만 실제 구현 범위로 본다.
- `빠른 현장 기록`은 사진 포함 단일 생성 요청으로 처리한다.

## Feature 1. 빠른 현장 기록 생성

### 목표

- 현장에서 문제를 발견한 즉시 사진과 상세 사유를 남긴다.

### 사용자 행동

- 사용자는 목록에서 `빠른 현장 기록`을 누른다.
- 사진 1장 이상을 올린다.
- 1차 사유를 고른다.
- 2차 상세 사유를 고르거나 메모를 남긴다.
- 저장한다.

### 상태와 전환

- `DRAFT_INPUT`
- `SUBMITTING`
- `UNLINKED_SAVED`
- `SUBMIT_FAILED`

### 규칙

- 사진은 최소 1장 필수다.
- 1차 사유는 필수다.
- 2차 상세 사유 또는 메모 중 최소 하나는 필수다.
- 저장 시 아직 작업 건이 없어도 된다.
- 저장 후 생성된 `field_record.status`는 `UNLINKED`다.
- 생성 API 는 사진과 메타데이터를 한 번에 저장한다.

### 예외

- 사진 누락
- 1차 사유 누락
- 2차 사유/메모 동시 누락
- 파일 형식 불일치
- 업로드 실패

### 데이터 영향

- `field_record` 생성
- `field_record_photo` 1건 이상 생성
- `timeline_event`는 아직 생성하지 않는다. 작업 건 연결 후부터 타임라인에 노출한다.

### API 영향

- `POST /api/v1/field-records`

### 권한 영향

- `OWNER`만 생성 가능

### 검증 규칙

- 사진이 0장이면 저장 불가
- 1차 사유가 없으면 저장 불가
- 2차 사유와 메모가 모두 없으면 저장 불가

## Feature 2. 작업 건 생성 및 기존 작업 건 연결

### 목표

- 빠른 현장 기록을 고객/현장 맥락과 연결한다.

### 사용자 행동

- 사용자는 새 작업 건을 만들거나 기존 작업 건에 연결한다.
- 새 작업 건이면 고객명 또는 현장 식별명, 주소 또는 현장명, 원래 견적 금액을 입력한다.
- 기존 작업 건이면 목록에서 선택한다.

### 상태와 전환

- `UNLINKED`
- `LINKING`
- `LINKED`
- `LINK_FAILED`

### 규칙

- 새 작업 건 생성 시 `customerLabel`, `siteLabel`, `originalQuoteAmount`는 필수다.
- 기존 작업 건 연결 시 선택된 작업 건은 같은 owner 소유여야 한다.
- 하나의 빠른 현장 기록은 1개의 작업 건에만 연결된다.
- 이미 `LINKED`인 field_record 는 재연결할 수 없다.
- 작업 건 연결 시 `timeline_event`에 `FIELD_RECORD_LINKED` 이벤트를 남긴다.

### 예외

- 존재하지 않는 작업 건 연결 시도
- 이미 연결된 기록 재연결 시도
- 권한 없는 작업 건 연결 시도

### 데이터 영향

- `job_case` 생성 또는 조회
- `field_record.job_case_id` 갱신
- `field_record.status`를 `LINKED`로 갱신
- `timeline_event` 생성

### API 영향

- `POST /api/v1/job-cases`
- `POST /api/v1/field-records/{fieldRecordId}/link-job-case`
- `GET /api/v1/job-cases?query=`

### 권한 영향

- `OWNER`만 생성/연결 가능

### 검증 규칙

- 새 작업 건 생성 시 필수값 누락 저장 불가
- 이미 linked 상태면 연결 불가

## Feature 3. 범위 대비 및 변경 견적 저장

### 목표

- 기본 포함 범위와 추가 작업 범위를 대비하고 금액 차이를 계산한다.

### 사용자 행동

- 사용자는 작업 건 상세에서 원래 견적을 확인한다.
- 변경 후 금액을 입력한다.
- 시스템은 차액을 계산한다.
- 시스템은 선택된 사유 기반으로 기본 포함 범위 요약과 추가 작업 요약을 보여준다.

### 상태와 전환

- `QUOTE_NOT_SET`
- `QUOTE_EDITING`
- `QUOTE_SAVED`
- `QUOTE_SAVE_FAILED`

### 규칙

- 변경 후 금액은 0 이상 정수여야 한다.
- 차액 = 변경 후 금액 - 원래 견적 금액
- 원래 견적 금액이 없는 작업 건은 변경 견적 저장 불가다.
- 기본 포함 범위 요약은 업종 템플릿 기반으로 생성한다.
- 추가 작업 요약은 1차/2차 사유에서 생성한다.
- 범위 대비 정보는 작업 건당 최신 1개만 유지한다.

### 예외

- 원래 견적 누락
- 금액 형식 오류
- 범위 대비 생성 실패

### 데이터 영향

- `job_case.revised_quote_amount`
- `job_case.quote_delta_amount`
- `scope_comparison` upsert
- `timeline_event` 생성

### API 영향

- `PATCH /api/v1/job-cases/{jobCaseId}/quote`
- `GET /api/v1/job-cases/{jobCaseId}/scope-comparison`

### 권한 영향

- `OWNER`만 수정 가능

### 검증 규칙

- 금액 필드 숫자 검증
- 원래 견적이 없으면 저장 불가

## Feature 4. 고객 설명 초안 생성

### 목표

- 고객이 납득 가능한 순서의 설명 문구를 생성한다.

### 사용자 행동

- 사용자는 `설명 초안 생성`을 누른다.
- 생성된 초안을 읽거나 복사한다.

### 상태와 전환

- `IDLE`
- `GENERATING`
- `GENERATED`
- `GENERATION_FAILED`

### 규칙

- 생성 전 field_record 1건 이상 필요
- 생성 전 revisedQuoteAmount 필요
- 초안은 아래 순서를 따른다.
- 순서:
  - 현장 상태
  - 추가 작업 항목
  - 기본 범위 밖인 이유 또는 사전 가정 차이
  - 금액 변경
  - 진행 여부 확인 요청
- 작업 건당 최신 초안 1개만 유지한다.
- 재생성 이력은 `timeline_event`로 남긴다.

### 예외

- 현장 기록 없음
- 변경 후 금액 없음
- 생성 서비스 실패

### 데이터 영향

- `message_draft` upsert
- `timeline_event` 생성

### API 영향

- `POST /api/v1/job-cases/{jobCaseId}/draft-message`
- `GET /api/v1/job-cases/{jobCaseId}/draft-message`

### 권한 영향

- `OWNER`만 생성 가능

### 검증 규칙

- 현장 기록과 변경 후 금액이 없으면 생성 불가

## Feature 5. 합의 기록 저장

### 목표

- 고객이 무엇을 어떤 채널로 확인했는지 남긴다.

### 사용자 행동

- 사용자는 상태를 선택한다.
- 확인 채널, 확인 시각, 확정 금액, 고객 반응 메모를 입력한다.
- 저장한다.

### 상태와 전환

- `NOT_RECORDED`
- `RECORDING`
- `RECORDED`
- `RECORD_FAILED`

### 규칙

- 상태는 필수다.
- 확인 채널은 필수다.
- `AGREED`일 때 `confirmedAmount`는 필수다.
- `EXCLUDED`일 때 고객 반응 메모는 강력 권장이다.
- `EXPLAINED`와 `ON_HOLD`에서는 `confirmedAmount` nullable 허용이다.
- agreement_record 저장 시 서버가 `job_case.current_status`를 함께 갱신한다.
- MVP에서는 별도 상태 변경 API 를 두지 않는다.

### 예외

- 채널 미선택
- 상태 미선택
- `AGREED`인데 확정 금액 누락
- 존재하지 않는 작업 건

### 데이터 영향

- `agreement_record` 생성
- `job_case.current_status` 갱신
- `timeline_event` 생성

### API 영향

- `POST /api/v1/job-cases/{jobCaseId}/agreement-records`

### 권한 영향

- `OWNER`만 기록 가능

### 검증 규칙

- 상태/채널 필수 검증
- `AGREED` 시 확정 금액 필수 검증

## Feature 6. 작업 건 목록/상세/타임라인 조회

### 목표

- 사용자가 설명이 필요한 건과 분쟁 근거를 빠르게 찾는다.

### 사용자 행동

- 사용자는 상태 필터를 바꾼다.
- 작업 건 카드에서 상세로 진입한다.
- 타임라인을 확인한다.

### 상태와 전환

- `LOADING`
- `READY`
- `EMPTY`
- `LOAD_FAILED`

### 규칙

- 목록 필터 query status는 `ALL | UNEXPLAINED | EXPLAINED | AGREED | ON_HOLD | EXCLUDED`만 허용한다.
- 카드에는 합의 기록 존재 여부가 표시되어야 한다.
- 상세에서는 설명 초안, 합의 기록, 범위 대비, 현장 기록, 타임라인을 이 순서로 보여준다.
- `job_case.current_status`가 `UNEXPLAINED`여도 agreement_record 가 0건일 수 있다.

### 예외

- 존재하지 않는 작업 건 조회
- 잘못된 상태 필터
- 필터 결과 없음

### 데이터 영향

- 조회 기능만 수행

### API 영향

- `GET /api/v1/job-cases`
- `GET /api/v1/job-cases/{jobCaseId}`
- `GET /api/v1/job-cases/{jobCaseId}/timeline`

### 권한 영향

- `OWNER`만 조회 가능

### 검증 규칙

- 필터 값 화이트리스트 검증

## Builder Handoff Packet

- 우선 구현 순서:
  1. 도메인 모델/DB 스키마
  2. 빠른 현장 기록 단일 생성 API
  3. 작업 건 생성/연결
  4. 상세 조회
  5. 변경 견적/범위 대비
  6. 설명 초안 생성
  7. 합의 기록 저장
  8. 목록 필터/타임라인
- 핵심 리스크:
  - 1차/2차 사유 카테고리 구조
  - 에러 코드와 사용자 메시지 매핑
  - `current_status` 파생 로직
- 미결정 사항:
  - 기본 포함 범위 템플릿의 최종 문구 세트
  - 기존 작업 건 검색 방식의 세부 UX
- 특히 테스트할 예외:
  - 사진 없이 저장 시도
  - `AGREED`인데 `confirmedAmount` 없음
  - 이미 linked인 field_record 재연결
  - 잘못된 status filter 조회
