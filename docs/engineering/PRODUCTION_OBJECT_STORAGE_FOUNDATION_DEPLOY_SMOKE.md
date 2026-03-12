# PRODUCTION_OBJECT_STORAGE_FOUNDATION_DEPLOY_SMOKE

## Environment

- app: `field-agreement-jihoon-staging`
- url: `https://field-agreement-jihoon-staging.fly.dev/`
- date: `2026-03-12`

## Deployment

- staging deploy completed successfully after the object storage foundation batch

## Smoke steps

1. `GET /api/v1/health`
2. `GET /api/v1/admin/storage-status` with owner token
3. `POST /api/v1/field-records` with one PNG file
4. fetch returned photo URL directly
5. `POST /api/v1/admin/reset-data` to restore empty staging state

## Results

### Health

- `200 OK`
- `storageEngine: SQLITE`

### Storage status

- `200 OK`
- `objectStorageProvider: LOCAL_VOLUME`

### Field record create

- `201 Created`
- returned photo URL:
  - `/uploads/owners/owner_staging/field-records/fr_b37fbd6f7a17/photo_24a202cd30e1.png`

### Photo fetch

- `200 OK`
- binary payload returned successfully

### Reset

- `200 OK`
- counts returned to zero

## PM note

- staging confirms the new scoped upload path works end to end
- this is enough evidence to proceed to the next storage-heavy Postgres write batch
