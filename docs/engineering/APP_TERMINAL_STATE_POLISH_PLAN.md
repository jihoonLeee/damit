# APP_TERMINAL_STATE_POLISH_PLAN

## PM goal

Raise `/app` quality by making terminal states feel truly finished and by restoring the runtime helpers that keep customer confirmation, action enablement, and review-mode behavior in sync.

## Why this batch is needed

- the current workspace screen still leaves room for `AGREED` and `EXCLUDED` cases to feel active instead of clearly finished
- the customer confirmation card should explain whether the operator is still waiting, already done, or only reviewing evidence
- the latest `public/app.js` lost helper functions that previously controlled:
  - review-mode jumps
  - customer confirmation card state
  - action button enablement
- that regression risks a static-looking screen even when the server data is healthy

## Scope

In scope:

- restore missing runtime helpers in `public/app.js`
- make terminal-state copy calmer and more explicit
- make customer confirmation state read as:
  - waiting
  - viewed
  - confirmed
  - review-only
- improve job-card scanning for terminal states
- keep timeline behavior bounded and evidence-oriented

Out of scope:

- API contract changes
- new workflow steps
- mail cutover changes
- auth/session backend changes

## UX success criteria

- an operator can tell in under 5 seconds whether a selected case is still active or already finished
- `AGREED` no longer reads like there is more required work
- `EXCLUDED` no longer reads like the operator is blocked mid-flow
- the customer confirmation card explains the current evidence state without guessing
- buttons only stay enabled when the next action is actually valid

## Validation plan

- `node --check public/app.js`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node scripts/visual-review.mjs`

## PM note

This is a recovery-plus-polish batch.
The correct priority is restoring trustworthy runtime behavior first, then tightening terminal-state UX.
