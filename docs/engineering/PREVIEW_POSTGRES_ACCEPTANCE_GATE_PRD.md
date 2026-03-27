# PREVIEW_POSTGRES_ACCEPTANCE_GATE_PRD

## Goal

- make it possible to run a realistic authenticated QA pass on `preview.damit.kr` while preview is backed by Postgres

## Why this matters

- technical cutover proof already exists
- PM still cannot approve root Postgres cutover without evidence of real authenticated use plus rollback

## Users

- PM validating release readiness
- QA validating the preview acceptance gate
- operator validating owner workflows on preview

## User stories

- as PM, I want a repeatable way to open preview in an authenticated state without weakening live auth rules
- as QA, I want a reusable session artifact so I can test `/home`, `/account`, `/app`, `/ops`, and customer confirmation flow on preview Postgres
- as operator, I want this path to stay non-public and preview-scoped so root remains untouched

## Non-goals

- changing root runtime to Postgres
- adding new public auth routes
- replacing the production mail-based login flow

## Success criteria

- a preview QA owner session can be created without `AUTH_DEBUG_LINKS`
- an invite/join QA path can also be created without mail delivery dependence
- the output is usable by browser automation
- the change does not alter public route behavior
