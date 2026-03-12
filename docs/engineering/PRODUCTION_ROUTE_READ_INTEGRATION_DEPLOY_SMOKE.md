# Production Route Read Integration Deploy Smoke

Date: 2026-03-12
Environment: staging
URL: https://field-agreement-jihoon-staging.fly.dev/

## Deploy

- Fly app: `field-agreement-jihoon-staging`
- Config: [fly.staging.toml](/D:/AI_CODEX_DESKTOP/fly.staging.toml)
- Result: deploy success

## Smoke Checks

- `GET /api/v1/health`
  - status: `200`
  - storageEngine: `SQLITE`
  - counts: `jobCases=0`, `fieldRecords=0`, `agreements=0`
- `GET /api/v1/admin/postgres-preflight`
  - status: `200`
  - `ok=true`
  - serverVersion: `17.6`
  - migrations: `applied=1`, `pending=0`
- `GET /api/v1/job-cases`
  - status: `200`
  - body: `{"items":[]}`

## PM Interpretation

- staging 배포 후 앱 기본 상태는 정상이다.
- read route integration 이 최소한 빈 상태 read 에서 깨지지 않는다.
- staging runtime 은 아직 `SQLITE`이고, Supabase 는 preflight/migration 검증 대상으로 연결돼 있다.
- 다음 단계는 `Postgres write foundation` 범위를 잠그는 것이다.
