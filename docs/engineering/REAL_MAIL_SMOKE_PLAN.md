# Real Mail Smoke Plan

## Goal
- Run a production-like login mail smoke against a local runtime.
- Keep real credentials out of tracked example files.
- Validate that `RESEND` delivery, trusted-origin enforcement, and debug-link disablement are aligned before external testing.

## Scope
- Create an ignored local env file path for real mail settings.
- Add a reusable env-file loader for local smoke scripts.
- Add a dedicated `mail-login-smoke` script that boots the app with local env and requests `/api/v1/auth/challenges`.
- Update runbook/readiness docs with the real-mail flow.

## Non-goals
- Full inbox automation or mail-open verification.
- Production deploy changes.
- Replacing current auth flow semantics.

## Risks
- Real secrets may accidentally remain in tracked example files.
- `APP_BASE_URL` may point to an unusable host for the recipient.
- Network-restricted environments may block the actual Resend API call.

## Acceptance
- There is a documented ignored local env path for real mail testing.
- The smoke script fails clearly when required mail settings are missing.
- The smoke script returns `delivery.provider=RESEND` when configured correctly.
- The runbook explains the manual inbox verification step.
