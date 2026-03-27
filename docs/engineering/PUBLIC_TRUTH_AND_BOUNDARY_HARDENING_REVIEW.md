# PUBLIC_TRUTH_AND_BOUNDARY_HARDENING_REVIEW

## Verdict

- GO

## What changed

- updated the public login footer copy so the page reflects the real live mail flow
- aligned `PRODUCTION_READINESS.md` and `RUNBOOK.md` with the current homelab + Cloudflare + Resend runtime
- changed public customer confirmation token reads to `no-store`
- removed provider failure detail from public `MAIL_DELIVERY_FAILED` responses
- added explicit JSON request body limits
- made multipart body/file limits configurable
- changed request IP lookup so proxy headers are only trusted from a local/private proxy hop
- fixed mojibake in shared HTTP error strings

## Evidence

- `node --check src/http.js`
- `node --check src/app.js`
- `node --check src/multipart.js`
- `node tests/auth-foundation.test.js`
- `node tests/customer-confirmation.test.js`
- `node tests/api.test.js`
- `node scripts/visual-review.mjs`

## Remaining risks

- public/action throttles are still process-local memory only
- server-side Postgres cutover and rollback are still unproven
- SQLite -> Postgres data import is still not rehearsed

## Next batch

- `server-side Postgres cutover rehearsal`
- target only `preview.damit.kr`
- include rollback proof and stronger server-side smoke
