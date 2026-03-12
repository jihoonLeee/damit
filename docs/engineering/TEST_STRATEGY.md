# TEST STRATEGY

## 문서 목적

- MVP의 핵심 사용자 흐름과 실패 계약을 어떻게 검증할지 정의한다.
- PM이 중요하게 보는 `현장 사용성`, `설명 가능성`, `합의 기록 신뢰성`이 테스트에 반영되도록 한다.

## 테스트 목표

- 현장 사용자가 사진부터 남기고 합의 기록까지 완주할 수 있어야 한다.
- API와 UI가 동일한 에러 코드와 복구 동작을 사용해야 한다.
- 상태 전이와 타임라인이 문서화된 규칙과 일치해야 한다.
- 목록/상세/초안/합의 기록이 서로 다른 진실을 보여주지 않아야 한다.

## 테스트 레벨

### 1. Domain / Unit Test

- enum 매핑
- 상태 파생 로직
- 차액 계산 로직
- scope comparison 생성 규칙
- draft message 생성 템플릿 순서
- agreement status별 required field 규칙

### 2. API Contract Test

- 성공 응답 shape
- 실패 응답 shape
- 공통 에러 코드
- fieldErrors 존재 여부
- HTTP status 일치 여부

### 3. Integration Test

- field record 생성 후 job case 연결
- quote 저장 후 draft 생성
- agreement 저장 후 current status 반영
- timeline event 누적

### 4. UI / Flow Test

- 빠른 현장 기록 시작
- 상세 화면 진입
- 설명 초안 생성
- 합의 기록 저장
- 상태 필터 조회

### 5. PM Manual Review

- 입력 단계가 현장형인지
- 문구가 고객 설명용인지
- 상세 화면의 정보 우선순위가 맞는지
- `작업 제외`가 회고 가능한 데이터로 남는지

## P0 핵심 시나리오

### 시나리오 1. 정상 완주

1. 사진 2장 업로드
2. 1차/2차 사유 입력
3. 새 작업 건 생성 및 연결
4. 변경 견적 저장
5. 설명 초안 생성
6. `AGREED` 합의 기록 저장
7. 목록/상세/타임라인 확인

기대 결과
- current status는 `AGREED`
- confirmedAmount 저장
- timeline에 연결/초안/합의 이벤트 존재

### 시나리오 2. 보류 처리

1. 현장 기록 생성
2. 작업 건 연결
3. 변경 견적 저장
4. 설명 초안 생성
5. `ON_HOLD` 기록 저장

기대 결과
- confirmedAmount nullable 허용
- 목록 `ON_HOLD` 필터 조회 가능

### 시나리오 3. 작업 제외 처리

1. 현장 기록 생성
2. 작업 건 연결
3. 고객이 거절
4. `EXCLUDED` 기록 저장

기대 결과
- 제외 메모 확인 가능
- 목록/상세/타임라인에서 제외 상태 일관

## P0 실패 시나리오

| ID | 케이스 | 기대 결과 |
|---|---|---|
| `NEG-01` | 사진 없이 현장 기록 저장 | `422 PHOTO_REQUIRED` |
| `NEG-02` | 1차 사유 없이 저장 | `422 PRIMARY_REASON_REQUIRED` |
| `NEG-03` | 2차 사유와 메모 모두 없이 저장 | `422 SECONDARY_REASON_OR_NOTE_REQUIRED` |
| `NEG-04` | 이미 연결된 현장 기록 재연결 | `409 FIELD_RECORD_ALREADY_LINKED` |
| `NEG-05` | 원래 견적 없는 작업 건에 변경 견적 저장 | `422 VALIDATION_ERROR` |
| `NEG-06` | 현장 기록 없이 설명 초안 생성 | `422 FIELD_RECORD_REQUIRED_FOR_DRAFT` |
| `NEG-07` | 변경 금액 없이 설명 초안 생성 | `422 QUOTE_REQUIRED_FOR_DRAFT` |
| `NEG-08` | `AGREED`인데 confirmedAmount 없이 합의 기록 저장 | `422 AGREEMENT_AMOUNT_REQUIRED` |
| `NEG-09` | confirmationChannel 없이 합의 기록 저장 | `422 AGREEMENT_CHANNEL_REQUIRED` |
| `NEG-10` | 잘못된 status 필터 조회 | `400 INVALID_STATUS_FILTER` |

## 엔드포인트별 검증 범위

| Endpoint | 성공 케이스 | 실패 케이스 |
|---|---|---|
| `POST /field-records` | 사진/사유/메모 정상 저장 | `PHOTO_REQUIRED`, `PRIMARY_REASON_REQUIRED`, `SECONDARY_REASON_OR_NOTE_REQUIRED` |
| `POST /job-cases` | 새 작업 건 생성 | `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN` |
| `POST /field-records/{id}/link-job-case` | 새 연결 성공 | `FIELD_RECORD_NOT_FOUND`, `JOB_CASE_NOT_FOUND`, `FIELD_RECORD_ALREADY_LINKED` |
| `GET /job-cases` | 상태 필터/검색 성공 | `INVALID_STATUS_FILTER` |
| `GET /job-cases/{id}` | 상세 조회 성공 | `JOB_CASE_NOT_FOUND` |
| `PATCH /job-cases/{id}/quote` | 변경 견적 저장 성공 | `VALIDATION_ERROR`, `JOB_CASE_NOT_FOUND` |
| `GET /job-cases/{id}/scope-comparison` | 범위 대비 조회 성공 | `JOB_CASE_NOT_FOUND` |
| `POST /job-cases/{id}/draft-message` | 초안 생성 성공 | `FIELD_RECORD_REQUIRED_FOR_DRAFT`, `QUOTE_REQUIRED_FOR_DRAFT`, `JOB_CASE_NOT_FOUND` |
| `GET /job-cases/{id}/draft-message` | 초안 있음/없음 조회 | `JOB_CASE_NOT_FOUND` |
| `POST /job-cases/{id}/agreement-records` | 상태 저장 성공 | `AGREEMENT_STATUS_REQUIRED`, `AGREEMENT_CHANNEL_REQUIRED`, `AGREEMENT_AMOUNT_REQUIRED`, `JOB_CASE_NOT_FOUND` |
| `GET /job-cases/{id}/timeline` | 타임라인 조회 성공 | `JOB_CASE_NOT_FOUND` |

## 상태 전이 테스트

### field_record.status

- 생성 직후 `UNLINKED`
- 연결 후 `LINKED`
- 재연결 불가

### job_case.current_status

- 생성 직후 `UNEXPLAINED`
- `EXPLAINED` 합의 기록 후 `EXPLAINED`
- `AGREED` 합의 기록 후 `AGREED`
- `ON_HOLD` 합의 기록 후 `ON_HOLD`
- `EXCLUDED` 합의 기록 후 `EXCLUDED`

## PM 수동 점검 시나리오

### Review A. 현장성

- 한 손 사용 기준으로 빠른 기록을 시작할 수 있는지
- 사진 촬영 후 사유 입력이 부담스럽지 않은지
- 고객명/주소를 몰라도 흐름이 이어지는지

### Review B. 설득력

- 범위 대비 카드가 `왜 추가인지`를 바로 설명하는지
- 초안 문구가 추상적이지 않은지
- 금액 정보가 숨지지 않는지

### Review C. 신뢰성

- 합의 상태와 확인 채널/시각/금액이 같이 남는지
- 목록 상태와 상세 상태가 다르지 않은지
- 타임라인이 실제 회고 자료로 읽히는지

## 테스트 데이터 가이드

- 기본 견적 250000원 케이스
- 니코틴 오염, 심한 곰팡이, 베란다 추가, 창고 추가, 폐기물 잔존 등 대표 사유 세트
- 합의 상태별 fixture
  - `EXPLAINED`
  - `AGREED`
  - `ON_HOLD`
  - `EXCLUDED`

## 출시 게이트

- P0 정상 시나리오 3개 전부 통과
- P0 실패 시나리오 10개 전부 통과
- PM 수동 점검 3개 축 통과
- 목록/상세/타임라인 상태 불일치 0건
- 문서에 정의된 에러 코드 누락 0건

## 제외 범위

- 브라우저별 장기 호환성 매트릭스
- 대규모 부하 테스트
- 다중 조직/다중 역할 권한 테스트
- 다업종 템플릿 검증
