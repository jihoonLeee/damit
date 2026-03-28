# Customer Notification Automation Review

Date: 2026-03-28
Status: GO

## Summary

This batch adds the first real automation foundation for customer confirmation delivery.

- job cases can now store a customer phone number
- customer confirmation links now keep the latest delivery metadata
- confirmation link issuance can attempt automatic delivery
- fallback remains safe: link issuance succeeds even if automatic delivery is not available

## Scope Delivered

- `job_cases.customer_phone_number`
- `customer_confirmation_links` delivery metadata
- Solapi-backed dispatch service for:
  - Kakao AlimTalk primary
  - SMS fallback
- confirm-stage UI feedback for delivery result
- account/ops runtime readiness remains aligned with actual provider config

## Delivery Rules

- no phone number -> manual required
- missing provider config -> manual required
- Kakao success -> automatic delivery complete
- Kakao failure + SMS ready -> SMS fallback
- Kakao/SMS failure -> link still issued, manual follow-up required

## Verification

- `node --check src/app.js`
- `node --check src/config.js`
- `node --check src/notifications/customer-phone.js`
- `node --check src/notifications/customer-confirmation-dispatch.js`
- `node --check src/contexts/field-agreement/application/field-agreement.validation.js`
- `node --check src/contexts/customer-confirmation/infrastructure/sqlite-customer-confirmation-store.js`
- `node --check src/repositories/sqlite/createSqliteRepositoryBundle.js`
- `node --check src/repositories/postgres/createPostgresRepositoryBundle.js`
- `node --check public/app.js`
- `node tests/customer-notification-runtime.test.js`
- `node tests/customer-confirmation-dispatch.test.js`
- `node tests/customer-confirmation.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/api.test.js`
- `npm run pg:preflight:production-local`
- `npm run migrate:status:production-local`
- `node scripts/visual-review.mjs`

## Operational Note

Postgres migration `0003_customer_notification_delivery_columns` has been applied on the configured Supabase runtime and production-local Postgres smoke passed.

## PM Verdict

This is the right first automation slice.

- product flow is now ready for real customer delivery
- external provider credentials and Kakao template setup are still required before live automatic sends can be trusted in production
- the next best step is a preview-side migration/apply + provider smoke, not a UI rewrite
