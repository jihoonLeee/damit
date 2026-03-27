# Preview QA Toolkit Review

Date: 2026-03-27
Owner: PM
Status: completed

## What changed

- aligned PM/PRD/UX/spec docs around the real preview QA toolkit
- added automated coverage for the preview-only bootstrap helper
- updated the runbook to reflect current preview truth and operator usage
- used the bootstrap artifact against the live preview runtime

## Evidence

- `tests/preview-qa-session-bootstrap.test.js` covers:
  - preview-only host enforcement
  - Postgres-only runtime intent
  - `AUTH_DEBUG_LINKS=false` requirement
  - cookie merge
  - Playwright cookie conversion
- `npm run qa:preview:bootstrap:production-local`
  - generated a live preview owner-session artifact
- live preview read checks passed with the bootstrap session:
  - `/api/v1/me`
  - `/api/v1/account/overview`
  - `/api/v1/job-cases`
  - `/api/v1/admin/ops-snapshot`
  - `/api/v1/admin/data-explorer?dataset=jobCases&limit=3`
- live preview write checks passed with the bootstrap session:
  - field record create
  - job case create
  - field record link
  - quote update
  - draft generation
  - agreement record
  - owner invitation create
- browser MCP launch on this workstation still failed with Edge process exit, so this batch used the generated cookies for HTTP-based preview QA instead of screenshot-based browser proof

## PM verdict

- GO for repeatable preview QA on the current Postgres-backed preview stack
- HOLD on root DB cutover until preview walkthrough evidence is complete
