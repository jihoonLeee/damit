# SECRET_POLICY

## Purpose

- Keep staging and production secrets separated.
- Make explicit which values must never be shared.

## Rules

- Never store secrets directly in `fly.toml`.
- Never copy staging secrets into production or vice versa.
- Separate owner tokens, DB credentials, and mail provider keys by environment.

## Required separate values

- `OWNER_TOKEN`
- `DATABASE_URL`
- `RESEND_API_KEY`
- `MAIL_FROM`
- `APP_BASE_URL`

## Bootstrap Mode exception

- During staging bootstrap, `MAIL_PROVIDER=FILE` is allowed.
- That mode is considered internal staging only.
- Before any external beta usage, staging must move to `RESEND`.

## PM forbidden states

- staging connected to production DB
- staging reusing production owner token
- staging reusing production mail API keys without explicit approval
- deploy while env validation is failing

## Ops notes

- Staging validation:
  - `npm run env:check:staging`
- Production validation:
  - `npm run env:check:production`
- Postgres connection validation:
  - `npm run pg:preflight`
- Live admin verification:
  - `GET /api/v1/admin/postgres-preflight`
