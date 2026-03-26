# APP_OPS_RETURN_CONTEXT_PLAN

## Goal

Make `/app` explain why a job case was opened from `/ops` and what the operator should inspect first.

## PM focus

- the selected job case should not feel contextless after a console handoff
- operators should see a concrete first checkpoint before scanning the whole detail stack
- the added surface should help, not compete with the normal workflow summary

## Scope

- add a lightweight return-context card near the top of the selected case area
- derive the first recommended checkpoint from quote/draft/confirmation/terminal state
- extend visual review evidence for the `/ops -> /app` arrival state

## Non-goals

- no backend schema changes
- no new mutation actions
- no mail cutover work

## Validation

- `node --check D:\AI_CODEX_DESKTOP\public\app.js`
- `node --check D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
