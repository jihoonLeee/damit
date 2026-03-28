# Customer Notification Provider Smoke UX

Date: 2026-03-28
Status: GO

## Operator flow

1. prepare preview on Postgres
2. ensure provider credentials and Kakao template are configured on preview runtime
3. run one CLI command with a dedicated test phone
4. read one JSON result
5. if automatic delivery succeeds, continue to manual inbox/device confirmation
6. if automatic delivery does not succeed, stop rollout claims and inspect runtime config

## Output expectations

- human-readable failure
- machine-readable JSON summary
- no secret echo
- masked destination only

## PM rule

- do not call the path trusted until the smoke result is automatic
- `MANUAL_REQUIRED_*` or `AUTO_DELIVERY_FAILED` is a valid test result, but not a release-green result

