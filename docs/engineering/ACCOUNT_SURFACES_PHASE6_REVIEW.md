# Account Surfaces Phase 6 Review

## PM verdict

- GO
- Account surface scan speed is meaningfully better than phase 5.
- The page now separates live actions from closed history instead of forcing owners to read every past record at once.

## What changed

- Added an account attention strip below the verdict panel.
  - This now summarizes only the actions that need review right now.
  - It highlights company connection, other live sessions, idle-risk sessions, and pending invitations.
- Split invitation rendering into:
  - active invitations shown in the main flow
  - closed invitation history shown in a collapsible history block
- Split session rendering into:
  - current session
  - other active sessions
  - ended session history shown in a collapsible history block
- Kept closed history available, but moved it out of the first visual pass.

## UX rationale

- Owners should understand "what requires action now" in a few seconds.
- Pending work and closed records serve different goals.
- Closed records are still important for audit and confidence, but they should not dominate the page.
- The updated structure keeps the page useful for both day-to-day operation and later review.

## Validation

- `node --check D:\AI_CODEX_DESKTOP\public\account.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\workspace-session.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`

## Evidence

- `D:\AI_CODEX_DESKTOP\output\visual-review\desktop-account-authenticated.png`

## Remaining notes

- The account page is still long, but the first scan is now much more focused.
- If more owner actions are added later, history sections should stay collapsible by default.
- The next best follow-up is to make the invitation and session lifecycle wording even more explicit on mobile.
