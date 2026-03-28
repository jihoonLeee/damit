# Customer Notification Provider Smoke Feature Spec

Date: 2026-03-28
Status: GO

## New command

- `npm run smoke:customer-notification:preview:production-local -- --phone=010...`

## Runtime assumptions

- local env file contains preview Postgres connection values
- preview host is `https://preview.damit.kr`
- preview runtime is currently routed to Postgres

## Script behavior

1. load env file
2. assert preview bootstrap is allowed
3. bootstrap owner session directly in preview Postgres
4. call preview API with that session
5. create:
   - job case
   - field record
   - field-record link
   - quote
   - draft
   - customer confirmation link
6. read `delivery` from the link creation response
7. fetch job case detail and confirm persisted delivery status
8. fail if `--require-auto=true` and status is not:
   - `AUTO_DELIVERED`
   - `AUTO_DELIVERED_FALLBACK_SMS`

## Inputs

- `--env-file=...`
- `--base-url=...`
- `--phone=...`
- `--require-auto=true|false`

## Output JSON

- `ok`
- `baseUrl`
- `jobCaseId`
- `confirmationUrl`
- `delivery`
- `persistedDeliveryStatus`

