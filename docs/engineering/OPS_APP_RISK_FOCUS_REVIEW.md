# OPS_APP_RISK_FOCUS_REVIEW

## PM verdict

- `GO`

## What changed

- `/ops` now pulls the most urgent handoff target into its own focus card before the rest of the route list
- `/app` now shows one short "why now" line on ops-return cards so urgency is explicit
- the rest of the handoff routes remain available as secondary choices

## Why this is better

- operators can see the first risky case without parsing the whole handoff list
- the workspace no longer explains only what to open, but also why it was prioritized
- risk and next action now feel connected across `/ops` and `/app`

## Validation

- `node --check D:\AI_CODEX_DESKTOP\public\ops.js`
- `node --check D:\AI_CODEX_DESKTOP\public\app.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
