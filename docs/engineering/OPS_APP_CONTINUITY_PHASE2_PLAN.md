# OPS_APP_CONTINUITY_PHASE2_PLAN

## Goal

Bring the new `/ops -> /app` continuity flow to mobile quality parity.

## PM focus

- the first recommended route should still feel obvious on a narrow screen
- the handoff section should not read like a secondary appendix
- authenticated visual review should include mobile `/ops`

## Scope

- add a lightweight `/ops?review=handoff` focus mode for visual review
- strengthen the first handoff card and CTA layout on mobile
- capture authenticated mobile `/ops` evidence

## Non-goals

- no new admin powers
- no backend schema changes
- no mail cutover work

## Validation

- `node --check D:\AI_CODEX_DESKTOP\public\ops.js`
- `node --check D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
