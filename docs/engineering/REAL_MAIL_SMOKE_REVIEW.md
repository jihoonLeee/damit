# Real Mail Smoke Review

## PM Verdict
- GO for local mail-smoke scaffolding.
- HOLD for live Resend proof until the sender domain is verified in Resend.

## What Changed
- Added an ignored local env path: `.env.production.local`.
- Kept tracked example files as examples and annotated them accordingly.
- Added `scripts/lib/env-file.mjs` for local env loading.
- Added `scripts/mail-login-smoke.mjs` for production-like mail smoke on a local SQLite runtime.
- Added `npm run smoke:mail:production-local`.
- Updated the runbook and readiness docs with the real-mail smoke flow.

## Validation
- `node --check scripts/lib/env-file.mjs`
- `node --check scripts/mail-login-smoke.mjs`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `npm run smoke:mail:production-local`

## Current Hold Reason
- The latest live attempt reached Resend successfully with the configured API key and sender format.
- The current blocker is external: the sender domain is not verified in Resend yet.
- Until that domain is verified, the provider will reject real mail delivery with a 403 validation error.

## Next Step
- Verify the sender domain in Resend.
- Keep `MAIL_FROM` on that verified domain.
- Re-run `npm run smoke:mail:production-local`.

## Latest Execution

- First live attempt reached Resend and returned a 422 validation error for the sender identity.
- The smoke path was then hardened to fail earlier when `MAIL_FROM` is not in `email@example.com` or `Name <email@example.com>` format.
- After the sender format was corrected, the next live attempt reached Resend again and returned a 403 validation error because the sender domain is not verified yet.

- The latest live attempt reached Resend again and failed with a 403 validation error because the sending domain is not verified yet.
- Current blocker: verify the sender domain in Resend, then rerun the smoke.
