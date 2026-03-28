# Confirm Notification Channels Review

Date: 2026-03-28
Status: GO

## What Changed

- Added customer notification runtime readiness to both SQLite and Postgres ops/account surfaces.
- Added config/env support for:
  - `CUSTOMER_NOTIFICATION_PRIMARY`
  - `CUSTOMER_NOTIFICATION_FALLBACK`
  - `KAKAO_BIZMESSAGE_PROVIDER`
  - `SMS_PROVIDER`
- Updated confirm-stage UI copy so operators understand the current delivery mode:
  - current live mode is manual copy/send
  - target operational channel is Kakao AlimTalk first, SMS fallback
- Added ops warnings when Kakao or SMS fallback is not configured.

## Product Decision

- Authentication remains email-first.
- Customer-facing confirmation delivery is prepared as:
  - primary: Kakao AlimTalk
  - fallback: SMS
- This batch does not send via Kakao or SMS yet.
- This batch makes the product operationally honest about the current manual-delivery state and ready for later provider integration.

## Verification

- `node --check public/app.js`
- `node --check public/ops.js`
- `node --check public/account.js`
- `node --check src/app.js`
- `node --check src/store.js`
- `node --check src/config.js`
- `node --check src/notifications/customer-notification-runtime.js`
- `node --check src/repositories/postgres/createPostgresRepositoryBundle.js`
- `node tests/customer-notification-runtime.test.js`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `node tests/customer-confirmation.test.js`

## PM Verdict

This is the right intermediate step. The product now distinguishes:

- what is live today: manual copy/send
- what we are designing toward: Kakao AlimTalk + SMS fallback

The next best step is a channel integration spec for the first provider pair, not a UI rewrite.
