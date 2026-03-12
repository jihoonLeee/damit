# DDD_RELEASE_BATCH_REVIEW

## PM verdict

GO

## What was accepted

- adopt `DDD-lite modular monolith` instead of a full DDD rewrite
- move field-agreement, auth, and customer-confirmation code under context folders
- keep top-level compatibility shims to reduce rollout risk
- add a separate release-only self-host deploy workflow triggered by GitHub Release publication

## What was intentionally rejected

- no big-bang rewrite of `src/app.js`
- no entity/value-object heavy refactor yet
- no removal of the manual internal self-host deploy lane

## Feature view

The new structure better matches actual product contexts without changing user-facing behavior.

## Builder view

The chosen move improved readability and future navigation while keeping imports and runtime stable through re-export shims.

## QA view

Core regression tests passed after the moves.
The new release deploy workflow was added but not yet exercised through a real GitHub Release event in this batch.

## Validation

- `node --check src/app.js`
- `node --check src/contexts/field-agreement/domain/field-agreement.domain.js`
- `node --check src/contexts/field-agreement/application/field-agreement.validation.js`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/beta-workspace.test.js`