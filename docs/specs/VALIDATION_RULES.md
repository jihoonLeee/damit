# VALIDATION RULES

| 대상 | 필드 | 규칙 | 실패 메시지 | 에러 코드 |
|---|---|---|---|---|
| 빠른 현장 기록 | photos | 최소 1장 필수 | 사진을 1장 이상 올려주세요 | `PHOTO_REQUIRED` |
| 빠른 현장 기록 | primaryReason | 필수, enum 화이트리스트 | 1차 사유를 선택해주세요 | `PRIMARY_REASON_REQUIRED` |
| 빠른 현장 기록 | secondaryReason/note | 둘 중 하나 이상 필수 | 상세 사유를 고르거나 메모를 남겨주세요 | `SECONDARY_REASON_OR_NOTE_REQUIRED` |
| 빠른 현장 기록 | secondaryReason | enum 화이트리스트 | 올바르지 않은 상세 사유예요 | `VALIDATION_ERROR` |
| 작업 건 생성 | customerLabel | 필수, 1~80자 | 고객명 또는 현장명을 입력해주세요 | `VALIDATION_ERROR` |
| 작업 건 생성 | siteLabel | 필수, 1~120자 | 주소 또는 현장명을 입력해주세요 | `VALIDATION_ERROR` |
| 작업 건 생성 | originalQuoteAmount | 필수, 0 이상 정수 | 원래 견적 금액을 입력해주세요 | `VALIDATION_ERROR` |
| 변경 견적 | revisedQuoteAmount | 필수, 0 이상 정수 | 변경 후 금액을 입력해주세요 | `VALIDATION_ERROR` |
| 설명 초안 생성 | fieldRecords | 1건 이상 필요 | 현장 기록이 있어야 설명 초안을 만들 수 있어요 | `FIELD_RECORD_REQUIRED_FOR_DRAFT` |
| 설명 초안 생성 | revisedQuoteAmount | 필수 | 변경 후 금액을 먼저 입력해주세요 | `QUOTE_REQUIRED_FOR_DRAFT` |
| 합의 기록 | status | 필수 | 상태를 선택해주세요 | `AGREEMENT_STATUS_REQUIRED` |
| 합의 기록 | confirmationChannel | 필수 | 확인 채널을 선택해주세요 | `AGREEMENT_CHANNEL_REQUIRED` |
| 합의 기록 | confirmedAmount | `AGREED`일 때 필수 | 확정 금액을 입력해주세요 | `AGREEMENT_AMOUNT_REQUIRED` |
| 목록 필터 | status | `ALL, UNEXPLAINED, EXPLAINED, AGREED, ON_HOLD, EXCLUDED`만 허용 | 올바르지 않은 상태 필터예요 | `INVALID_STATUS_FILTER` |

## 추가 규칙

- 금액은 정수 원화만 허용한다.
- 음수 금액은 허용하지 않는다.
- 메모는 최대 500자다.
- 업로드 사진 형식은 `jpg`, `jpeg`, `png`, `webp`만 허용한다.
- 사진 한 장 최대 크기는 10MB다.
- `secondaryReason = OTHER`일 때 메모 입력을 강력 권장한다.
