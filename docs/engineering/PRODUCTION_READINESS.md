# PRODUCTION_READINESS

## Purpose

- Define what must change before this MVP becomes a real service.
- Separate what is acceptable for pilot from what is required for beta or production.

## Current state

- deployment works
- single-machine SQLite runtime is acceptable for early pilot
- multi-user, audit-heavy, long-lived production still needs more infrastructure

## PM summary

- pilot on SQLite is still valid
- do not pay for heavy DB infrastructure too early
- prepare the codebase for Postgres now, then attach Supabase Free when staging needs a real external DB

## Required production transitions

### 1. Data storage

- current: SQLite on Fly volume
- next external DB target: Supabase Free Postgres
- later production-grade target: paid managed Postgres if usage and ops needs justify it

Why:

- team collaboration and multitenancy eventually outgrow SQLite
- migration discipline is easier with a real Postgres target
- audit and reporting requirements will grow

### 2. Auth and RBAC

- current shared owner token is not acceptable for real service usage
- required path:
  - email magic link login
  - company membership model
  - role-based access control

### 3. Multitenancy

- all business data must be company-scoped
- file paths and object keys must be company-scoped
- audit logs must be queryable by company and actor

### 4. File storage

- current: local Fly volume uploads
- target: object storage with signed URLs
- preferred provider order:
  - Cloudflare R2
  - AWS S3
  - Supabase Storage only if we intentionally consolidate around Supabase later

### 5. Audit log

Keep append-only traces for:

- field record create and update
- quote change
- draft generation
- agreement create and update
- customer confirmation link issuance and view

### 6. Observability

- Sentry for errors
- structured logs including requestId, companyId, userId, and jobCaseId
- dashboards for latency and failure rate

### 7. Back office and support

- search companies
- inspect job cases
- inspect customer confirmation state
- run backup and restore steps safely

## Provider strategy

### Stage 1

- Fly.io app
- SQLite runtime
- staging bootstrap complete

### Stage 2

- Supabase Free for staging and early external DB validation
- no production cutover yet

### Stage 3

- paid managed Postgres only after usage, team workflow, and recovery needs justify it

## PM release gates

### G1. Reliability

- P0 flow success rate is stable
- no corruption in Korean text, photos, or amounts

### G2. Security

- shared code removed
- role separation complete
- baseline rate limit in place

### G3. Operations

- backup and restore rehearsal complete
- support runbook is usable

### G4. Business fit

- paid conversion experiments are possible
- plan and account model match real customers

## Latest PM cutover note

- as of 2026-03-12, PM judgment is `HOLD` for runtime Postgres cutover
- the reason is not data-layer immaturity alone, but the remaining gap in auth/runtime proof, restore rehearsal, and integrated tenant/RBAC evidence
- the next required batch is `Postgres auth/runtime readiness`, not cutover itself

## Latest PM auth/runtime note

- the `Postgres auth/runtime readiness` batch is now locally complete
- repository-backed auth/session/company-context parity is implemented for SQLite and Postgres
- local regression evidence is green
- the next missing proof is a real staging `POSTGRES` runtime smoke
- that staging proof is currently blocked by Fly billing, not by a known code defect

## Latest PM restore note

- local SQLite restore rehearsal is now complete
- DB backup plus local upload backup can be restored together in an isolated local drill
- broader restore readiness is still incomplete because staging or external-DB restore proof does not yet exist

## Latest PM local release note

- local release confidence is now `GO`
- this confidence is based on end-to-end P0 flow proof, auth regression proof, and local restore rehearsal proof
- staging Postgres runtime proof remains `HOLD`
- production cutover remains `HOLD`
- next local-facing work should optimize demo quality and encoding-safe UX polish, not broaden infra claims
