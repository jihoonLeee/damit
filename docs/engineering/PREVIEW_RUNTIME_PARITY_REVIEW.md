# Preview Runtime Parity Review

Date: 2026-03-28
Status: GO

## Summary

This batch repaired preview/runtime parity and proved that both the public preview route and the direct preview container runtime now execute the same customer-notification code path.

## Verdict

- preview/runtime parity is now proven
- the remaining customer-notification blocker is provider configuration, not stale preview code

## Root cause

- self-host sync was preserving `deploy/homelab/.env` but not `deploy/homelab/.env.preview-postgres`
- once the preview env file was deleted, the refresh path could leave preview on stale or incomplete runtime state
- the preview smoke workflow also had multiple execution mismatches:
  - it initially ran on the host without `pg`
  - it later assumed a local `.env.production.local` inside the container
  - it targeted the wrong direct-runtime address for the container check

## What changed

- self-host deploy and preview smoke workflows now preserve `deploy/homelab/.env.preview-postgres`
- preview refresh now rebuilds the preview env when the file is missing or missing critical keys
- preview Postgres credentials are now injected into workflow-driven refresh through repository secrets
- preview smoke now runs inside the preview Postgres container instead of the host shell
- direct runtime smoke now targets the container runtime correctly
- the smoke script now skips local env-file loading when no env file was explicitly provided

## Evidence

- Self-Host Deploy run `23682261068` succeeded and refreshed preview Postgres successfully
- Preview Customer Notification Smoke run `23682408695` succeeded
- both checks returned the same delivery result shape:
  - public preview route
  - direct preview container runtime
- both results persisted:
  - `delivery.status = MANUAL_REQUIRED_CONFIG`
  - `persistedDeliveryStatus = MANUAL_REQUIRED_CONFIG`

## PM judgment

- preview parity: `GO`
- preview automatic delivery: `HOLD`

The product no longer appears to be serving an old preview build. The next step is to add live `SOLAPI_*`, provider-selection, and Kakao template settings to the preview env so the same smoke can move from `MANUAL_REQUIRED_CONFIG` to an actual automatic delivery status.
