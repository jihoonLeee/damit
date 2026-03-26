# OPS_APP_RISK_FOCUS_PLAN

## PM goal

- make the highest-risk operator target obvious on `/ops`
- make the reason for that risk obvious on `/app` after an ops handoff

## Scope

- add a dedicated focus card for the first handoff item on `/ops`
- add one short "why now" line to the `/app` ops-return card
- keep the existing workflow and routing intact

## Success criteria

- the first risky case is visually separated from the rest of the handoff list
- the `/app` handoff card explains both the target card and the urgency reason
- operators do not need to infer risk from long paragraphs

## Validation

- `node --check D:\AI_CODEX_DESKTOP\public\ops.js`
- `node --check D:\AI_CODEX_DESKTOP\public\app.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
