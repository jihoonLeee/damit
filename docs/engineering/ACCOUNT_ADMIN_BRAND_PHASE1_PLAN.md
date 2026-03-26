# ACCOUNT_ADMIN_BRAND_PHASE1_PLAN

## PM goal

Bring `/account` and `/admin` into the same `damit` brand family as `/`, `/start`, `/login`, `/home`, `/app`, and `/ops`.

## Problem

These two surfaces are functionally solid, but they still read a bit more like generic SaaS panels than part of the `damit` operating desk.

## Scope

- add stronger brand lockup to both surfaces
- move account/admin secondary cards away from cool white/blue styling
- align attention, history, invite, and principle cards to the paper/ledger material system
- keep all behavior and route logic intact

## Constraints

- no new product scope
- no auth or data-flow changes
- keep readability and scan speed ahead of decoration

## Validation

- `node --check` for changed frontend JS only if needed
- `node D:\\AI_CODEX_DESKTOP\\tests\\auth-foundation.test.js`
- `node D:\\AI_CODEX_DESKTOP\\tests\\api.test.js`
- `node D:\\AI_CODEX_DESKTOP\\scripts\\visual-review.mjs`
