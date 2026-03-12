# PM Cross-Agent Review 2026-03-12

Date: 2026-03-12
Participants: PM, Feature, Builder, QA
Decision: GO for staging bootstrap, HOLD on runtime Postgres cutover

## Goal

- Re-check the current code, docs, and deployment state under PM leadership.
- Lock the next batch as a real operational step, not just another planning step.

## Current State

- The production app is live on Fly.io and runs correctly on a SQLite volume.
- Managed Postgres preflight tooling already exists as both a CLI and an admin endpoint.
- The actual runtime Postgres adapter still has major read/write paths unimplemented.
- Because of that, pushing staging directly to POSTGRES runtime would be higher risk than value.

## Findings

### P1. Staging docs were ahead of actual runtime readiness

- `fly.staging.toml` and `.env.staging.example` assumed `STORAGE_ENGINE=POSTGRES`.
- The current Postgres repository bundle still contains many `Not Implemented` paths beyond migrations and summary checks.
- PM judgment: the purpose of staging right now is operational separation and validation rails, not aggressive DB cutover.

### P1. Staging and production must be separated, but in a conservative way

- Separate hostname, separate owner token, and separate volume can be created immediately.
- Separate managed Postgres and real mail provider integration would still stop on missing external credentials.
- Builder judgment: create a staging bootstrap first, keep Postgres as preflight-only for now.

### P2. Ops docs must stay readable

- Broken handoff docs create avoidable deployment mistakes.
- QA judgment: staging must not be created from partially corrupted operational notes.

### P2. The next real risk is operational, not product-facing

- The biggest current risk is not feature gaps. It is weak environment separation, secret handling, and lack of restore rehearsal.
- Feature judgment: the next batch should improve ops rails before more product surface area.

## Cross-Agent Discussion

### PM

- The best next step is a staging bootstrap.
- Staging must have a separate app, token, volume, and URL from production.
- Runtime engine should stay on SQLITE for now.
- Postgres work should stay limited to preflight, secrets, and migration rehearsal preparation.

### Feature

- Docs and config must clearly split what is possible now from what comes later.
- Staging docs should explicitly separate Bootstrap Mode from Cutover Mode.
- Bootstrap Mode:
  - `STORAGE_ENGINE=SQLITE`
  - `MAIL_PROVIDER=FILE`
  - focused on environment isolation and smoke validation
- Cutover Mode:
  - `STORAGE_ENGINE=POSTGRES`
  - `MAIL_PROVIDER=RESEND`
  - only after managed Postgres and real mail integration exist

### Builder

- The actionable work is clear.
- Make `fly.staging.toml` bootstrap-safe, then create and deploy a real staging app.
- Generate a staging-only owner token.
- This batch has low runtime code risk.

### QA

- Success is not just a successful deploy.
- The staging URL must prove all of the following:
  - `GET /api/v1/health`
  - `GET /beta-app`
  - `GET /api/v1/admin/postgres-preflight` returns an intentional red state
- The red state must be meaningful, for example `POSTGRES_NOT_CONFIGURED`.

## Final PM Decision

- The next step is to build a staging bootstrap environment.
- Concrete work:
  1. Make staging config bootstrap-safe.
  2. Repair staging-related ops docs.
  3. Create the Fly staging app.
  4. Deploy it with a separate owner token and volume.
  5. Run staging smoke checks and admin preflight verification.

## Hold Conditions

- Staging must not share app name, token, volume, or DB with production.
- Do not deploy staging runtime with `STORAGE_ENGINE=POSTGRES` before the adapter is ready.
- Do not deploy while env validation is red.

## Next PM Gate

- After staging bootstrap succeeds, PM will re-check:
  - whether environment separation is real
  - whether secret handling matches the docs
  - whether the next batch can safely move to managed Postgres staging attach
