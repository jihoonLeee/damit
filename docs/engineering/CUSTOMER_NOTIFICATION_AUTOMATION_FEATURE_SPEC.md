# Customer Notification Automation Feature Spec

Date: 2026-03-28
Stage: Feature Spec

## Data Model

### job_cases

- add `customer_phone_number TEXT`

### customer_confirmation_links

- add `delivery_channel TEXT`
- add `delivery_provider TEXT`
- add `delivery_status TEXT`
- add `delivery_destination TEXT`
- add `delivery_requested_at TEXT/TIMESTAMPTZ`
- add `delivery_completed_at TEXT/TIMESTAMPTZ`
- add `delivery_message_id TEXT`
- add `delivery_error_code TEXT`
- add `delivery_error_message TEXT`

## Config

- `SOLAPI_API_KEY`
- `SOLAPI_API_SECRET`
- `SOLAPI_SENDER_NUMBER`
- `SOLAPI_KAKAO_PFID`
- `SOLAPI_KAKAO_TEMPLATE_ID`

## Kakao Template Variable Contract

- `#{서비스명}`
- `#{고객명}`
- `#{현장명}`
- `#{확인링크}`
- `#{만료시각}`
- `#{확정금액}`

## Service Flow

1. 작업 건 생성/수정 시 고객 번호 저장
2. 고객 확인 링크 발급
3. dispatch service evaluates:
   - customer phone exists?
   - kakao provider ready?
   - sms fallback ready?
4. result is recorded on latest link
5. route response includes `delivery`
6. timeline gets one extra event for dispatch result

## Delivery Result Contract

- `AUTO_DELIVERED`
- `AUTO_DELIVERED_FALLBACK_SMS`
- `MANUAL_REQUIRED_NO_PHONE`
- `MANUAL_REQUIRED_CONFIG`
- `AUTO_DELIVERY_FAILED`

## Test Plan

- runtime helper unit test
- dispatch service unit tests with mocked Solapi sender
- API integration:
  - create job case with phone
  - issue confirmation link without provider config -> manual required
  - response includes delivery status
  - detail exposes latest delivery metadata
