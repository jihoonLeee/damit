# PRODUCTION_OBJECT_STORAGE_FOUNDATION_REVIEW

## Purpose

- Define the smallest safe object storage batch before external provider cutover.
- Keep pilot runtime stable while moving file metadata toward production shape.

## Participants

- `PM`
- `Feature`
- `Builder`
- `QA`

## Current state

- live and staging runtime still write uploaded photos to local volume
- `POST /api/v1/field-records` calls `saveUpload()` directly
- SQLite photo rows currently only guarantee `url`
- Postgres schema already expects richer file metadata:
  - `storage_provider`
  - `object_key`
  - `public_url`
  - `url`

## Core problem

- the current upload path is pilot-fast but too weak for production migration
- local files are treated like final URLs instead of file assets with storage metadata
- if we jump straight to S3/R2 now, we risk breaking the only working photo flow

## PM discussion

### PM

- do not combine `provider abstraction`, `external provider integration`, and `migration utility` in one batch
- keep public API behavior stable while hardening internal metadata
- require company-scoped object keys when company context exists

### Feature

- API should keep returning a user-consumable `url`
- clients should not need to know whether the file came from local volume or object storage
- the durable contract should be `asset metadata + resolved delivery URL`

### Builder

- local volume should become the first real provider implementation
- the provider should return normalized metadata so later providers can plug in without route rewrites
- SQLite schema should move closer to Postgres now to reduce later drift

### QA

- existing `field record create` flow must remain green
- no regression in `/uploads/...` delivery for local runtime
- provider metadata should be asserted in storage-level tests before any external cutover

## Batch scope

### In scope

- add object storage provider abstraction
- make `LOCAL_VOLUME` the first provider implementation
- normalize upload result metadata
- persist richer photo metadata in SQLite
- keep read responses stable through a single resolved `url`
- add tests for local provider and metadata persistence

### Out of scope

- R2 or S3 SDK integration
- signed URL issuance
- migrating existing volume files to external object storage
- removing `/uploads/*` static serving
- Postgres runtime cutover

## Decided contract

Each stored field photo should be representable with this internal shape:

```json
{
  "id": "photo_123",
  "field_record_id": "fr_123",
  "storage_provider": "LOCAL_VOLUME",
  "object_key": "companies/co_123/field-records/fr_123/photo_123.png",
  "public_url": "/uploads/photo_123.png",
  "url": "/uploads/photo_123.png",
  "sort_order": 0,
  "created_at": "2026-03-12T08:00:00Z"
}
```

## Path rules

- if `companyId` exists, object key starts with `companies/{companyId}/...`
- else if only `ownerId` exists, object key starts with `owners/{ownerId}/...`
- field record photos should include `field-records/{fieldRecordId}/`
- object key should not depend on the delivery URL format

## API rule

- API responses continue to expose `photos[].url`
- `url` means resolved delivery URL, not storage location
- clients must not depend on `/uploads/` remaining the long-term final format

## Acceptance criteria

- `POST /api/v1/field-records` still returns `201`
- created photos still render through `url`
- local provider writes files to disk successfully
- SQLite rows store provider and object key metadata
- detail and confirmation views still resolve photo URLs correctly
- no change required to current frontend photo rendering

## PM judgment

- this batch is the correct next step before any external object storage provider
- if this foundation is stable, the next storage batch can add `R2` or `S3` without route-level churn
