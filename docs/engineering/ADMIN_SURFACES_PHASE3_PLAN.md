# Admin Surfaces Phase 3 Plan

## Goal

Improve `/admin` readability and mobile usability without expanding admin authority.

## PM focus

- Make the page clearly feel read-only and operational.
- Help admins understand what the currently selected dataset means before reading the table.
- Add mobile visual evidence so `/admin` is covered by the same quality bar as `/account`.

## Scope

- Add a read-only principles strip to `/admin`
- Add a selected-dataset focus card above the data explorer
- Tighten microcopy for the explorer/export area
- Add authenticated mobile visual review for `/admin`

## Non-goals

- No new admin mutation actions
- No role expansion
- No mail cutover work

## Validation

- `node --check D:\AI_CODEX_DESKTOP\public\admin.js`
- `node --check D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
