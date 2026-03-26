# Account Surfaces Phase 7 Plan

## Goal

Improve the owner account surface for mobile usage so the page feels lighter, more consistent, and easier to scan during quick operational checks.

## PM focus

- Keep the first screen about live actions, not history.
- Make collapsed history blocks readable and touch-friendly on mobile.
- Capture mobile evidence for `/account`, not just desktop.

## Scope

- Add authenticated mobile visual review for `/account`
- Tighten mobile spacing and summary layout for `/account`
- Make history summaries stack cleanly on narrow screens
- Keep read-only history available without dominating the page

## Non-goals

- No new backend actions
- No mail cutover work
- No admin privilege expansion

## Validation

- `node --check D:\AI_CODEX_DESKTOP\public\account.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\workspace-session.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
