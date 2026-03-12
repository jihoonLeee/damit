# API SPEC

## 공통 규칙

- Base path: `/api/v1`
- 응답 형식: JSON
- 시간 필드: ISO 8601 UTC 문자열
- 금액 필드: 정수, 원화 기준
- 인증: 세션 또는 Bearer 토큰
- 내부 enum 표기: `UPPER_SNAKE_CASE`

## 공통 성공 응답 규칙

- `GET` 목록 조회는 `200`
- `GET` 상세 조회는 `200`
- 신규 생성은 `201`
- 수정/갱신은 `200`

## 공통 에러 응답 스키마

```json
{
  "error": {
    "code": "AGREEMENT_AMOUNT_REQUIRED",
    "message": "확정 금액을 입력해주세요",
    "fieldErrors": {
      "confirmedAmount": "REQUIRED"
    },
    "requestId": "req_123"
  }
}
```

### 공통 필드 설명

- `error.code`: machine-readable 에러 코드
- `error.message`: 사용자 또는 클라이언트 로그용 기본 메시지
- `error.fieldErrors`: 필드 단위 에러가 있을 때만 포함
- `error.requestId`: 서버 추적용 요청 ID

## 공통 에러 코드

| code | http status | 의미 |
|---|---:|---|
| `VALIDATION_ERROR` | 400 / 422 | 일반 입력 검증 실패 |
| `PHOTO_REQUIRED` | 422 | 사진 누락 |
| `PRIMARY_REASON_REQUIRED` | 422 | 1차 사유 누락 |
| `SECONDARY_REASON_OR_NOTE_REQUIRED` | 422 | 2차 사유/메모 동시 누락 |
| `UNAUTHORIZED` | 401 | 인증 없음 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `FIELD_RECORD_NOT_FOUND` | 404 | 현장 기록 없음 |
| `JOB_CASE_NOT_FOUND` | 404 | 작업 건 없음 |
| `FIELD_RECORD_ALREADY_LINKED` | 409 | 이미 연결된 현장 기록 |
| `QUOTE_REQUIRED_FOR_DRAFT` | 422 | 설명 초안 생성에 필요한 변경 금액 누락 |
| `FIELD_RECORD_REQUIRED_FOR_DRAFT` | 422 | 설명 초안 생성에 필요한 현장 기록 누락 |
| `AGREEMENT_STATUS_REQUIRED` | 422 | 합의 상태 누락 |
| `AGREEMENT_CHANNEL_REQUIRED` | 422 | 확인 채널 누락 |
| `AGREEMENT_AMOUNT_REQUIRED` | 422 | 합의완료 상태에서 확정 금액 누락 |
| `INVALID_STATUS_FILTER` | 400 | 잘못된 상태 필터 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

## 1. 빠른 현장 기록 생성

### POST `/api/v1/field-records`

Content-Type
- `multipart/form-data`

Form fields
- `primaryReason`: string enum, required
- `secondaryReason`: string enum, optional
- `note`: string, optional
- `photos[]`: file[], required, min 1

Response `201`
```json
{
  "id": "fr_123",
  "jobCaseId": null,
  "primaryReason": "CONTAMINATION",
  "secondaryReason": "NICOTINE",
  "note": "거실 벽면과 주방 상판 니코틴 흔적 심함",
  "status": "UNLINKED",
  "photos": [
    {
      "id": "photo_123",
      "url": "/uploads/photo_123.jpg"
    }
  ],
  "createdAt": "2026-03-10T08:00:00Z"
}
```

Notes
- `photos[].url` is a resolved delivery URL
- clients must treat it as display/download URL, not as raw storage path

Error cases
- `401 UNAUTHORIZED`: 인증 없음
- `403 FORBIDDEN`: 권한 없음
- `422 PHOTO_REQUIRED`: 사진 누락
- `422 PRIMARY_REASON_REQUIRED`: 1차 사유 누락
- `422 SECONDARY_REASON_OR_NOTE_REQUIRED`: 2차 사유/메모 동시 누락
- `500 INTERNAL_ERROR`: 저장 실패

## 2. 작업 건 생성

### POST `/api/v1/job-cases`

Request
```json
{
  "customerLabel": "송파 힐스테이트 1203호",
  "contactMemo": "당근 문의 고객",
  "siteLabel": "송파 힐스테이트 1203호",
  "originalQuoteAmount": 250000
}
```

Response `201`
```json
{
  "id": "jc_123",
  "currentStatus": "UNEXPLAINED",
  "originalQuoteAmount": 250000,
  "revisedQuoteAmount": null,
  "quoteDeltaAmount": null,
  "createdAt": "2026-03-10T08:03:00Z"
}
```

Error cases
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `422 VALIDATION_ERROR`: 필수 필드 누락 또는 금액 형식 오류
- `500 INTERNAL_ERROR`

## 3. 빠른 현장 기록 연결

### POST `/api/v1/field-records/{fieldRecordId}/link-job-case`

Request
```json
{
  "jobCaseId": "jc_123"
}
```

Response `200`
```json
{
  "fieldRecordId": "fr_123",
  "jobCaseId": "jc_123",
  "status": "LINKED"
}
```

Error cases
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 FIELD_RECORD_NOT_FOUND`
- `404 JOB_CASE_NOT_FOUND`
- `409 FIELD_RECORD_ALREADY_LINKED`
- `500 INTERNAL_ERROR`

## 4. 작업 건 검색/목록 조회

### GET `/api/v1/job-cases?status=ALL&query=잠실`

Allowed `status`
- `ALL`
- `UNEXPLAINED`
- `EXPLAINED`
- `AGREED`
- `ON_HOLD`
- `EXCLUDED`

Response `200`
```json
{
  "items": [
    {
      "id": "jc_123",
      "customerLabel": "송파 힐스테이트 1203호",
      "siteLabel": "송파 힐스테이트 1203호",
      "originalQuoteAmount": 250000,
      "revisedQuoteAmount": 320000,
      "quoteDeltaAmount": 70000,
      "primaryReason": "CONTAMINATION",
      "secondaryReason": "NICOTINE",
      "currentStatus": "EXPLAINED",
      "hasAgreementRecord": true,
      "updatedAt": "2026-03-10T08:20:00Z"
    }
  ]
}
```

Error cases
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `400 INVALID_STATUS_FILTER`
- `500 INTERNAL_ERROR`

## 5. 작업 건 상세 조회

### GET `/api/v1/job-cases/{jobCaseId}`

Response `200`
```json
{
  "id": "jc_123",
  "customerLabel": "송파 힐스테이트 1203호",
  "contactMemo": "당근 문의 고객",
  "siteLabel": "송파 힐스테이트 1203호",
  "currentStatus": "AGREED",
  "originalQuoteAmount": 250000,
  "revisedQuoteAmount": 320000,
  "quoteDeltaAmount": 70000,
  "scopeComparison": {
    "baseScopeSummary": "기본 입주청소 범위 기준",
    "extraWorkSummary": "니코틴 오염 제거 추가",
    "reasonWhyExtra": "사전 안내 범위를 벗어난 오염/공간"
  },
  "latestDraftMessage": {
    "id": "draft_123",
    "tone": "CUSTOMER_MESSAGE",
    "body": "현장 확인 결과 ..."
  },
  "latestAgreementRecord": {
    "status": "AGREED",
    "confirmationChannel": "KAKAO_OR_SMS",
    "confirmedAt": "2026-03-10T08:15:00Z",
    "confirmedAmount": 320000,
    "customerResponseNote": "추가 진행 동의"
  },
  "fieldRecords": []
}
```

Error cases
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 JOB_CASE_NOT_FOUND`
- `500 INTERNAL_ERROR`

## 6. 변경 견적 저장

### PATCH `/api/v1/job-cases/{jobCaseId}/quote`

Request
```json
{
  "revisedQuoteAmount": 320000
}
```

Response `200`
```json
{
  "jobCaseId": "jc_123",
  "originalQuoteAmount": 250000,
  "revisedQuoteAmount": 320000,
  "quoteDeltaAmount": 70000
}
```

Error cases
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 JOB_CASE_NOT_FOUND`
- `422 VALIDATION_ERROR`: 금액 형식 오류 또는 원래 견적 누락
- `500 INTERNAL_ERROR`

## 7. 범위 대비 조회

### GET `/api/v1/job-cases/{jobCaseId}/scope-comparison`

Response `200`
```json
{
  "baseScopeSummary": "기본 입주청소 범위 기준",
  "extraWorkSummary": "베란다 니코틴 제거와 창고 추가 청소 필요",
  "reasonWhyExtra": "사전 안내 범위를 벗어난 오염/공간"
}
```

Error cases
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 JOB_CASE_NOT_FOUND`
- `500 INTERNAL_ERROR`

## 8. 설명 초안 생성

### POST `/api/v1/job-cases/{jobCaseId}/draft-message`

Request
```json
{
  "tone": "CUSTOMER_MESSAGE"
}
```

Response `200`
```json
{
  "id": "draft_123",
  "jobCaseId": "jc_123",
  "tone": "CUSTOMER_MESSAGE",
  "body": "현장 확인 결과 베란다와 창고 공간 추가 및 니코틴 오염 제거가 필요합니다...",
  "createdAt": "2026-03-10T08:10:00Z"
}
```

Error cases
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 JOB_CASE_NOT_FOUND`
- `422 FIELD_RECORD_REQUIRED_FOR_DRAFT`
- `422 QUOTE_REQUIRED_FOR_DRAFT`
- `500 INTERNAL_ERROR`

## 9. 합의 기록 생성

### POST `/api/v1/job-cases/{jobCaseId}/agreement-records`

Request
```json
{
  "status": "AGREED",
  "confirmationChannel": "KAKAO_OR_SMS",
  "confirmedAt": "2026-03-10T08:15:00Z",
  "confirmedAmount": 320000,
  "customerResponseNote": "추가 비용 안내 후 진행 동의"
}
```

Response `201`
```json
{
  "id": "ar_123",
  "jobCaseId": "jc_123",
  "status": "AGREED",
  "confirmationChannel": "KAKAO_OR_SMS",
  "confirmedAt": "2026-03-10T08:15:00Z",
  "confirmedAmount": 320000,
  "customerResponseNote": "추가 비용 안내 후 진행 동의",
  "currentStatus": "AGREED"
}
```

Error cases
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 JOB_CASE_NOT_FOUND`
- `422 AGREEMENT_STATUS_REQUIRED`
- `422 AGREEMENT_CHANNEL_REQUIRED`
- `422 AGREEMENT_AMOUNT_REQUIRED`
- `500 INTERNAL_ERROR`

## 10. 최신 설명 초안 조회

### GET `/api/v1/job-cases/{jobCaseId}/draft-message`

Response `200` (초안 있음)
```json
{
  "id": "draft_123",
  "jobCaseId": "jc_123",
  "tone": "CUSTOMER_MESSAGE",
  "body": "현장 확인 결과 ...",
  "createdAt": "2026-03-10T08:10:00Z"
}
```

Response `200` (초안 없음)
```json
{
  "item": null
}
```

Error cases
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 JOB_CASE_NOT_FOUND`
- `500 INTERNAL_ERROR`

## 11. 타임라인 조회

### GET `/api/v1/job-cases/{jobCaseId}/timeline`

Response `200`
```json
{
  "items": [
    {
      "type": "FIELD_RECORD_LINKED",
      "createdAt": "2026-03-10T08:00:00Z",
      "summary": "니코틴 오염 사진 기록 연결"
    },
    {
      "type": "DRAFT_CREATED",
      "createdAt": "2026-03-10T08:10:00Z",
      "summary": "고객 설명 초안 생성"
    },
    {
      "type": "AGREEMENT_RECORDED",
      "createdAt": "2026-03-10T08:15:00Z",
      "summary": "카카오톡으로 320000원 진행 동의"
    }
  ]
}
```

Error cases
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 JOB_CASE_NOT_FOUND`
- `500 INTERNAL_ERROR`

