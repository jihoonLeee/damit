# Ops App Continuity Phase 1 Plan

## Goal

Improve the handoff from `/ops` to `/app` so operators can move from a warning signal to the relevant job case faster.

## PM focus

- `/ops` should not stop at diagnosis.
- Operators should see at least one or two likely next destinations.
- `/app` should accept a lightweight deep link into a selected job case.

## Scope

- Add focus targets on `/ops` based on recent confirmation and timeline activity
- Add lightweight `/app?caseId=...` support
- Keep the experience read-first and operational, not overly clever

## Non-goals

- No backend schema changes
- No new mutation actions
- No mail cutover work

## Validation

- `node --check D:\AI_CODEX_DESKTOP\public\app.js`
- `node --check D:\AI_CODEX_DESKTOP\public\ops.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
