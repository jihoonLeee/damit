# PRODUCTION_UNIFICATION_PLAN

## PM goal

Remove the mixed pilot/beta shape and move the product to a single production-oriented flow.

## Why this batch is necessary

The current product still mixes two different mental models:

- owner-token pilot operation
- session-based company-scoped operation

That creates confusion in copy, routes, auth behavior, tests, and ops expectations.

## Production direction

Adopt one product flow:

1. landing
2. login
3. home
4. app
5. ops

All operator-facing routes use session authentication.
Company context stays company-scoped.
`/ops` becomes an owner-only session route.

## Scope

- remove owner-token access from operator and admin flows
- move `/login` success redirect to `/home`
- replace `beta-home` / `beta-app` naming with production-neutral names
- make `/app` session-only
- make `/ops` session-only and owner-only on the server
- update tests from bearer owner-token setup to session-cookie setup
- remove visible pilot/beta wording from product-facing pages

## Compatibility decision

- keep temporary redirects from legacy `/beta-home` and `/beta-app`
- delete beta-specific static source files after replacement
- do not promise public-internet production readiness in this batch

## Non-goals

- no Postgres runtime cutover
- no object storage provider cutover
- no multi-environment packaging redesign

## PM guardrails

- production-like wording must not overstate infrastructure readiness
- auth removal must not weaken current permission checks
- `/ops` must become stricter, not looser
- route cleanup should reduce confusion without forcing a schema migration

## Validation

- auth and API regression tests updated to session flow
- static route tests updated to `/home` and `/app`
- browser visual review for landing, login, home, app, and ops
- self-host deploy run stays green
