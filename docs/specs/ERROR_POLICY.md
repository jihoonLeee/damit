# ERROR POLICY

## 문서 목적

- 에러 코드, HTTP status, 사용자 메시지, 복구 방식을 일관되게 정의한다.
- `API_SPEC.md`의 실패 계약과 UI의 사용자 메시지를 연결한다.

## 공통 원칙

- 모든 실패 응답은 `error.code`를 포함한다.
- 사용자 메시지는 행동 지침 중심으로 쓴다.
- 저장 실패 시 사용자가 입력한 값은 가능한 한 유지한다.
- 검증 오류와 서버 오류를 구분해 보여준다.
- 법적 효력이나 자동 해결을 암시하는 문구를 쓰지 않는다.

## 에러 코드 카탈로그

| code | http status | 사용자 메시지 | 발생 조건 | 복구 방식 | 로그 필드 |
|---|---:|---|---|---|---|
| `PHOTO_REQUIRED` | 422 | 사진을 1장 이상 올려주세요 | 빠른 현장 기록에 사진 없음 | 업로드 영역 강조 | requestId, actorId |
| `PRIMARY_REASON_REQUIRED` | 422 | 1차 사유를 선택해주세요 | primaryReason 누락 | 사유 선택 영역 강조 | requestId, actorId |
| `SECONDARY_REASON_OR_NOTE_REQUIRED` | 422 | 상세 사유를 고르거나 메모를 남겨주세요 | secondaryReason/note 동시 누락 | 상세 사유 영역 강조 | requestId, actorId |
| `VALIDATION_ERROR` | 400 / 422 | 입력값을 다시 확인해주세요 | 일반 필드 검증 실패 | fieldErrors 노출 | requestId, actorId, fieldErrors |
| `FIELD_RECORD_NOT_FOUND` | 404 | 현장 기록을 찾을 수 없어요 | 잘못된 fieldRecordId | 이전 화면 복귀 | requestId, actorId, fieldRecordId |
| `JOB_CASE_NOT_FOUND` | 404 | 작업 건을 찾을 수 없어요 | 잘못된 jobCaseId | 목록으로 이동 | requestId, actorId, jobCaseId |
| `FIELD_RECORD_ALREADY_LINKED` | 409 | 이미 연결된 현장 기록이에요 | linked 상태 재연결 시도 | 새로고침 후 상태 확인 | requestId, actorId, fieldRecordId |
| `QUOTE_REQUIRED_FOR_DRAFT` | 422 | 변경 후 금액을 먼저 입력해주세요 | 설명 초안 생성 전 금액 누락 | 금액 입력 영역 강조 | requestId, actorId, jobCaseId |
| `FIELD_RECORD_REQUIRED_FOR_DRAFT` | 422 | 현장 기록이 있어야 설명 초안을 만들 수 있어요 | 설명 초안 생성 전 현장 기록 없음 | 현장 기록 CTA 노출 | requestId, actorId, jobCaseId |
| `AGREEMENT_STATUS_REQUIRED` | 422 | 상태를 선택해주세요 | 합의 기록 상태 누락 | 상태 선택 영역 강조 | requestId, actorId, jobCaseId |
| `AGREEMENT_CHANNEL_REQUIRED` | 422 | 확인 채널을 선택해주세요 | confirmationChannel 누락 | 채널 선택 영역 강조 | requestId, actorId, jobCaseId |
| `AGREEMENT_AMOUNT_REQUIRED` | 422 | 확정 금액을 입력해주세요 | AGREED 상태에서 confirmedAmount 누락 | 금액 입력 영역 강조 | requestId, actorId, jobCaseId |
| `INVALID_STATUS_FILTER` | 400 | 올바르지 않은 상태 필터예요 | 허용되지 않은 목록 필터 값 | 기본 필터로 재시도 | requestId, actorId, status |
| `UNAUTHORIZED` | 401 | 다시 로그인해주세요 | 인증 없음 또는 만료 | 로그인 화면 이동 | requestId |
| `FORBIDDEN` | 403 | 이 작업은 수행할 수 없어요 | 소유권 불일치 또는 권한 없음 | 읽기 전용 유지 또는 이전 화면 복귀 | requestId, actorId, resourceId |
| `INTERNAL_ERROR` | 500 | 잠시 후 다시 시도해주세요 | 서버 내부 오류 | 재시도 버튼 노출 | requestId, actorId, stack trace |

## 화면별 복구 원칙

### 빠른 현장 기록

- 검증 실패면 현재 입력값을 유지한다.
- 사진 업로드 실패면 업로드한 다른 메타데이터는 유지한다.
- 저장 실패면 `기록 저장` 버튼만 다시 활성화한다.

### 설명 초안 생성

- 생성 실패면 기존 금액과 현장 기록은 유지한다.
- `재생성` 버튼을 노출한다.

### 합의 기록 저장

- 실패 시 상태/채널/메모 입력값을 유지한다.
- `AGREED`의 금액 누락은 필드 단위 에러로 처리한다.

### 목록/상세 조회

- 조회 실패면 빈 화면처럼 보이지 않게 재시도 UI를 우선한다.
- 404는 목록으로 복귀시키고 토스트/배너로 알려준다.
