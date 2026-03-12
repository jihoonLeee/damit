# DDD_REFACTOR_REVIEW

## PM verdict

Partial GO. Full DDD rewrite is not justified right now.

The current codebase is already partway toward a modular architecture:

- repository bundles exist
- storage engines are abstracted
- auth and customer confirmation have distinct persistence concerns
- product and engineering documentation already separate concerns reasonably well

The real problem is not "no architecture." The real problem is that architectural boundaries are still inconsistent.

## Cross-agent review

### PM

A big-bang DDD refactor would cost too much for the current team size and product stage.
The better move is a `DDD-lite modular monolith` approach.

### Feature

The real bounded contexts are already visible:

- field agreement operations
- auth and company access
- customer confirmation
- system and operations

The code should reflect those context boundaries more clearly.

### Builder

The largest maintainability risk is `src/app.js` acting as a central orchestration file while domain and validation logic live in top-level utility-style files.

The lowest-risk improvement is:

1. move domain and validation logic under context folders
2. move auth and customer-confirmation persistence into context-specific infrastructure folders
3. keep compatibility exports so tests and rollout stay safe

### QA

A full rewrite would create too much regression risk.
Incremental structure changes with unchanged behavior are acceptable as long as current tests stay green.

## Decision

Adopt `DDD-lite modular monolith` now.
Do not attempt a full entity/value-object/application-service rewrite yet.

## Immediate refactor scope

- create `src/contexts/field-agreement/` for field agreement domain and validation logic
- create `src/contexts/auth/` for auth runtime and sqlite auth store
- create `src/contexts/customer-confirmation/` for customer confirmation sqlite store
- keep current top-level files as compatibility re-export shims where helpful

## Deferred scope

- splitting `src/app.js` into route modules
- richer domain services and aggregates
- stricter application service boundaries
- full infrastructure inversion across every module
