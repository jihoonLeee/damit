# Account Surfaces Phase 8 Review

## PM verdict

- GO
- Invitation and session lifecycle wording is now shorter and easier to scan.
- Mobile readability improved because more of each card can be understood in one pass.

## What changed

- Added display-specific lifecycle copy for invitation cards
  - accepted
  - revoked
  - first send
  - reissued send
- Added display-specific lifecycle copy for session cards
  - current
  - revoked
  - expired
  - idle-risk
  - other active session
- Kept the underlying flow logic unchanged and improved only the text shown to operators

## PM reasoning

- Operators should not need to parse long helper sentences to know whether action is still needed.
- Closed states should sound clearly complete.
- Active-but-risky states should sound actionable without becoming alarmist.

## Validation

- `node --check D:\AI_CODEX_DESKTOP\public\account.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\workspace-session.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`

## Evidence

- `D:\AI_CODEX_DESKTOP\output\visual-review\mobile-account-authenticated.png`
- `D:\AI_CODEX_DESKTOP\output\visual-review\desktop-account-authenticated.png`

## Next best step

- Improve `/admin` mobile and readability quality without expanding admin power
- Continue keeping mail cutover on hold until a verified sending domain exists
