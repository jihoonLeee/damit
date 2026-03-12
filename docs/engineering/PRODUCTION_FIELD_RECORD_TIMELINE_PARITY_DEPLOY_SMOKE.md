# PRODUCTION_FIELD_RECORD_TIMELINE_PARITY_DEPLOY_SMOKE

## Environment

- app: `field-agreement-jihoon-staging`
- url: `https://field-agreement-jihoon-staging.fly.dev/`
- date: `2026-03-12`

## Smoke flow

1. `GET /api/v1/health`
2. create one field record with one photo
3. create one job case
4. link the field record to the job case
5. update quote
6. generate draft
7. create agreement record
8. read timeline
9. reset staging data

## Results

- health returned `200`
- field record create returned `201`
- field record photo URL loaded correctly
- link, quote, draft, and agreement all returned success
- timeline count was `4`
- timeline types were:
  - `AGREEMENT_RECORDED`
  - `DRAFT_CREATED`
  - `QUOTE_UPDATED`
  - `FIELD_RECORD_LINKED`
- reset returned counts back to zero

## PM note

- staging confirms repository-backed field record create/link and unified timeline append work end to end
- this batch is good enough to unlock the next write-parity slice
