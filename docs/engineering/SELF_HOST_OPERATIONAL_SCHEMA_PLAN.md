# SELF_HOST_OPERATIONAL_SCHEMA_PLAN

## Goal

Make the self-host SQLite runtime look like an operational product on boot, not only after feature-specific code paths are touched.

## PM diagnosis

Current self-host behavior is operationally ambiguous.

Why:

- field agreement tables exist because core storage initializes on boot
- auth tables and customer confirmation tables are initialized lazily
- this makes a fresh self-host database look partially provisioned until certain routes are used

That is acceptable for developer ergonomics, but weak for operational clarity.

## Decision

For the SQLite single-node runtime, initialize these schemas during app boot:

- core storage tables
- auth tables
- customer confirmation tables

## Why this matches the product plan

Our current target is a production-like single-node operation.
That requires:

- predictable database shape
- clearer operator expectations
- fewer surprises during deployment review and self-host inspection

## Scope

### Code

- initialize SQLite auth storage during app startup
- initialize SQLite customer confirmation storage during app startup
- keep Postgres behavior unchanged

### Test

- extend API bootstrap coverage so a simple health request proves the full SQLite operational schema exists

## Non-goals

- no runtime cutover
- no auth UX redesign
- no self-host public exposure changes

## PM success criteria

After app boot on SQLite:

- `users`, `companies`, `memberships`, `sessions`, `login_challenges`, `invitations` exist
- `customer_confirmation_links`, `customer_confirmation_events` exist
- a basic health request is enough to prove the self-host runtime is fully provisioned
