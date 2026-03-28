# Customer Notification Provider Smoke Review

Date: 2026-03-28
Status: GO

## Summary

This batch adds a repeatable preview-side provider smoke command for customer confirmation delivery.

## Delivered

- preview runtime smoke script
- package script for `.env.production.local`
- helper assertions for automatic-delivery status
- runbook update

## Verification

- `node --check scripts/customer-notification-provider-smoke.mjs`
- `node tests/customer-notification-smoke.test.js`
- `node tests/customer-confirmation-dispatch.test.js`
- `node tests/customer-confirmation.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/api.test.js`
- `npm run smoke:customer-notification:preview:production-local`
  - current expected result without a test phone:
    - clear failure asking for `--phone=...` or `CUSTOMER_NOTIFICATION_TEST_PHONE`

## PM note

- this tool closes the operational gap between “provider code exists” and “preview runtime can actually deliver”
- the next real proof still requires one deliberate test phone and a preview runtime with real provider credentials
