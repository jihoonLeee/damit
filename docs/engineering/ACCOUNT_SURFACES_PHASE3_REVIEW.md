# ACCOUNT SURFACES PHASE 3 REVIEW

## PM verdict

`GO`

`/account` now behaves like a real owner self-service surface instead of a passive summary page.

## What changed

- added profile editing for:
  - display name
  - phone number
- added invitation follow-up actions for OWNER:
  - resend active invitation
  - revoke active invitation
- kept accepted invitations read-only
- kept `/admin` observational
- added audit entries for:
  - account profile update
  - invitation reissue
  - invitation revoke

## Why this improves product maturity

- owners can now complete the obvious next actions without leaving the authenticated product
- the account surface is now clearly distinct from:
  - `/home` as navigation hub
  - `/app` as work execution surface
  - `/ops` as operational console
  - `/admin` as internal-only read surface
- this is a stronger production direction than adding more routes without depth

## Validation

- `node --check public/account.js`
- `node --check src/app.js`
- `node --check src/contexts/auth/infrastructure/sqlite-auth-store.js`
- `node --check src/repositories/postgres/createPostgresRepositoryBundle.js`
- `node tests/auth-foundation.test.js`
- `node tests/api.test.js`
- `node tests/workspace-session.test.js`
- `node scripts/visual-review.mjs`

## PM notes

- account phase 3 is the right stopping point before deeper security/session controls
- the next maturity step should be:
  - session management on `/account`
  - stronger invitation history phrasing
  - first narrow system-admin action only after owner flows feel complete
