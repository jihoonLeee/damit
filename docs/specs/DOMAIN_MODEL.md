# DOMAIN MODEL

## 엔티티 개요

| 엔티티 | 설명 | 주요 필드 |
|---|---|---|
| `job_case` | 현장 단위의 최상위 작업 건 | id, customer_label, site_label, original_quote_amount, revised_quote_amount, quote_delta_amount, current_status |
| `field_record` | 현장에서 최초로 남긴 문제 기록 | id, job_case_id, primary_reason, secondary_reason, note, status |
| `field_record_photo` | 현장 기록에 속한 사진 | id, field_record_id, url, sort_order |
| `scope_comparison` | 기본 범위와 추가 작업 대비 정보 | id, job_case_id, base_scope_summary, extra_work_summary, reason_why_extra |
| `message_draft` | 고객 설명 초안 | id, job_case_id, body, tone |
| `agreement_record` | 고객 합의/반응 기록 | id, job_case_id, status, confirmation_channel, confirmed_at, confirmed_amount, customer_response_note |
| `timeline_event` | 상세 타임라인에 노출되는 이벤트 | id, job_case_id, event_type, summary, payload_json, created_at |

## Enum Catalog

### `job_case.current_status`

- `UNEXPLAINED`
- `EXPLAINED`
- `AGREED`
- `ON_HOLD`
- `EXCLUDED`

### `field_record.primary_reason`

- `CONTAMINATION`
- `REMOVAL_TASK`
- `SPACE_ADDED`
- `LAYOUT_DIFFERENCE`
- `WASTE_OR_BELONGINGS`

### `field_record.secondary_reason`

- `NICOTINE`
- `MOLD`
- `STICKER_REMOVAL`
- `WASTE_DISPOSAL`
- `VERANDA_ADDED`
- `UTILITY_ROOM_ADDED`
- `STORAGE_ADDED`
- `LAYOUT_MISMATCH`
- `OTHER`

### `field_record.status`

- `UNLINKED`
- `LINKED`

### `message_draft.tone`

- `CUSTOMER_MESSAGE`
- `CALL_SCRIPT`

### `agreement_record.status`

- `EXPLAINED`
- `AGREED`
- `ON_HOLD`
- `EXCLUDED`

### `agreement_record.confirmation_channel`

- `IN_PERSON`
- `PHONE`
- `KAKAO_OR_SMS`
- `OTHER`

### `timeline_event.event_type`

- `FIELD_RECORD_LINKED`
- `QUOTE_UPDATED`
- `DRAFT_CREATED`
- `AGREEMENT_RECORDED`
- `MEMO_UPDATED`

## 1. `job_case`

### 필드

- `id`: string
- `owner_id`: string
- `customer_label`: string
- `contact_memo`: string nullable
- `site_label`: string
- `original_quote_amount`: integer
- `revised_quote_amount`: integer nullable
- `quote_delta_amount`: integer nullable
- `current_status`: enum
- `created_at`: datetime
- `updated_at`: datetime

### 규칙

- `current_status`는 파생/캐시 필드다.
- agreement_record 가 0건이면 기본값은 `UNEXPLAINED`다.

## 2. `field_record`

### 필드

- `id`: string
- `owner_id`: string
- `job_case_id`: string nullable
- `primary_reason`: enum
- `secondary_reason`: enum nullable
- `note`: string nullable
- `status`: enum
- `created_at`: datetime

### 규칙

- 하나의 `field_record`는 최대 하나의 `job_case`에만 연결된다.
- `secondary_reason = OTHER`일 때 `note` 입력을 권장한다.

## 3. `field_record_photo`

### 필드

- `id`: string
- `field_record_id`: string
- `url`: string
- `sort_order`: integer
- `created_at`: datetime

### 규칙

- MVP에서는 `field_record` 생성 시 사진이 1장 이상 반드시 존재해야 한다.

## 4. `scope_comparison`

### 필드

- `id`: string
- `job_case_id`: string
- `base_scope_summary`: text
- `extra_work_summary`: text
- `reason_why_extra`: text
- `updated_at`: datetime

### 규칙

- `scope_comparison`은 작업 건당 최신 1개만 유지한다.

## 5. `message_draft`

### 필드

- `id`: string
- `job_case_id`: string
- `tone`: enum
- `body`: text
- `created_at`: datetime
- `updated_at`: datetime

### 규칙

- 작업 건당 최신 초안 1개만 유지한다.
- 재생성 이력은 별도 `timeline_event`로 남긴다.

## 6. `agreement_record`

### 필드

- `id`: string
- `job_case_id`: string
- `status`: enum
- `confirmation_channel`: enum
- `confirmed_at`: datetime
- `confirmed_amount`: integer nullable
- `customer_response_note`: text nullable
- `created_at`: datetime

### 규칙

- `status = AGREED`일 때 `confirmed_amount`는 required다.
- `status = EXCLUDED`일 때 `customer_response_note` 입력을 권장한다.
- agreement_record 저장 시 서버가 `job_case.current_status`를 갱신한다.

## 7. `timeline_event`

### 필드

- `id`: string
- `job_case_id`: string
- `event_type`: enum
- `summary`: string
- `payload_json`: json nullable
- `created_at`: datetime

## 관계

- `job_case` 1:N `field_record`
- `field_record` 1:N `field_record_photo`
- `job_case` 1:1 `scope_comparison`
- `job_case` 1:1 `message_draft` (latest view)
- `job_case` 1:N `agreement_record`
- `job_case` 1:N `timeline_event`

## 도메인 규칙 요약

- 상태 변경의 단일 쓰기 경로는 `agreement_record` 생성이다.
- `job_case.current_status`는 조회 최적화를 위한 파생 필드다.
- `quote_delta_amount`는 저장 시 계산값으로 관리한다.
- `field_record`는 사진 없이 존재할 수 없다.
