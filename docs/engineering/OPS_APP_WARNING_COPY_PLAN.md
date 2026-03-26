# OPS_APP_WARNING_COPY_PLAN

## PM goal

- tighten warning-level wording in `/ops` and `/app`
- keep the same logic and actions
- make the first recommended action readable in one short scan

## Scope

- shorten warning and handoff badges
- shorten warning titles and first-line body copy
- keep status meaning unchanged
- do not add new flows, controls, or role rules

## Target surfaces

- `public/ops.js`
- `public/app.js`

## Success criteria

- warning badges read in one or two words
- first sentence of each warning card is shorter and more direct
- `/ops -> /app` handoff still preserves context but feels less wordy
- authenticated visual review remains stable

## Validation

- `node --check D:\AI_CODEX_DESKTOP\public\ops.js`
- `node --check D:\AI_CODEX_DESKTOP\public\app.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
