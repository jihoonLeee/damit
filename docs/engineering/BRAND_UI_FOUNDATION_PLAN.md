# BRAND_UI_FOUNDATION_PLAN

## PM goal

- replace the current generic AI-SaaS look with a clearer `다밋` brand system
- ship the first shared design foundation without widening feature scope

## Scope

- rewrite brand docs
- refactor shared design tokens in `public/styles.css`
- update the shared brand mark
- apply the new visual system to:
  - `/`
  - `/start`
  - `/login`
  - `/home`
  - `/app`
  - `/ops`

## Constraints

- keep existing routing and business logic intact
- avoid heavy visual noise or large decorative illustrations
- preserve readability first, brand second

## Validation

- `node --check` for any changed frontend JS files
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
