# Contexts

This repository now follows a `DDD-lite modular monolith` direction.

## Current bounded contexts

- `field-agreement`
  - core field workflow rules such as reason labels, scope comparison, draft generation, and agreement status handling
- `auth`
  - session, login challenge, invitation, and company-context concerns
- `customer-confirmation`
  - customer confirmation link issuance, read, acknowledge, and event recording

## Important note

This is an incremental structure move, not a full DDD rewrite.

Top-level files like `src/domain.js` and `src/validation.js` remain as compatibility re-export shims so the refactor stays low-risk while the project continues to move.
