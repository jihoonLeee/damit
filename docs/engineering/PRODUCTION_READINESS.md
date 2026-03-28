# PRODUCTION_READINESS

## Purpose

- Define what must change before this MVP becomes a real service.
- Separate what is acceptable for pilot from what is required for beta or production.

## Current state

- public domain is live on `https://damit.kr`
- preview environment is live on `https://preview.damit.kr`
- current public runtime is homelab + Cloudflare Tunnel + single-machine SQLite
- real mail delivery via Resend is now working
- customer confirmation delivery now has an automatic provider path in code:
  - Kakao AlimTalk primary
  - SMS fallback
  - manual fallback when phone or provider config is missing
- multi-user, audit-heavy, long-lived production still needs stronger data and recovery guarantees

## PM summary

- public trusted pilot on SQLite is still valid
- do not claim broader production maturity before Postgres rehearsal, rollback proof, and stronger abuse controls
- keep feature expansion secondary to truthfulness, recovery confidence, and data durability
- prepare the codebase and runbooks for Postgres now, then rehearse preview cutover before any root cutover

## Required production transitions

### 1. Data storage

- current: SQLite on homelab persistent volume
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

- homelab app behind Cloudflare Tunnel
- SQLite runtime
- public root + preview complete

### Stage 2

- Supabase Free for preview rehearsal and early external DB validation
- no root runtime cutover yet

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
- the next missing proof is a real server-side preview `POSTGRES` runtime smoke
- that proof is now blocked by rehearsal work, not by a known code defect

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

## Latest PM single-node note

- self-host SQLite now boots with core, auth, and customer confirmation tables provisioned
- PM judgment: `single-node operational runtime GO`
- public production cutover remains separate and still requires broader infra and recovery evidence


## Latest PM auth hardening note

- operational auth phase 2 is now complete locally
- production-like mode can require trusted same-origin browser writes through `AUTH_ENFORCE_TRUSTED_ORIGIN=true`
- login and invitation flows now read as real email-delivery flows rather than debug-link-first flows
- live Resend proof still depends on environment credentials and remains a separate operational check

## Latest PM public rate-limit note

- public login and customer confirmation routes now have explicit IP-based rate limits
- rate-limited responses return `429` and `Retry-After`
- this closes one of the biggest previously unproven public-abuse gaps
- public production still remains `HOLD` until mail cutover, broader monitoring, and stronger recovery evidence are also complete

## Latest PM Sentry/invitation hardening note

- unexpected `5xx` runtime paths can now report to Sentry when `SENTRY_DSN` is configured
- Sentry stays optional and no-op when the DSN is absent
- owner/company invitation create and reissue flows now have explicit action-level throttles with `429` and `Retry-After`
- this materially improves public-operational hardening, but live production maturity still remains `HOLD` until real monitoring configuration and mail cutover are both proven


## Latest PM ops readiness note

- /ops now exposes explicit mail/auth operational readiness signals
- operators can see preview mail mode, debug-link exposure, trusted-origin enforcement, and real-mail config gaps without reading environment files
- this does not replace live Resend proof, but it reduces ambiguity before mail cutover


## Latest PM real-mail note

- real mail smoke now has a dedicated ignored local env path: `.env.production.local`
- the production-like smoke command is `npm run smoke:mail:production-local`
- live Resend proof still depends on real credentials and a manual inbox confirmation step

## Latest PM mail hold note

- email login cutover is now `GO` for the current public pilot
- real Resend delivery is working on the live runtime
- the remaining mail work is channel expansion and abuse monitoring, not basic delivery enablement

## Latest PM public truth and boundary note

- public product copy and operator docs are now being aligned to the real live state
- public customer confirmation token reads are non-cacheable
- public login failure responses no longer expose provider internals
- JSON and multipart request bodies now have explicit size ceilings
- proxy-derived client IPs are no longer trusted unconditionally
- broader public production still remains `HOLD` until durable throttling and server-side Postgres rehearsal are also proven

## Latest PM Postgres rehearsal note

- the next approved infra batch is `preview-only server-side Postgres cutover rehearsal`
- root traffic must remain on SQLite during the rehearsal
- preview rehearsal should run as a separate stack on port `3211`
- rollback must be able to return preview to SQLite without affecting `damit.kr`

## Latest PM Postgres rehearsal progress note

- the server-side preview rehearsal now proves local runtime health on `3211` with `storageEngine=POSTGRES`
- the previously blocking checksum mismatch on `0001_production_core` is now repaired and normalized
- the public preview switch is now proven as well:
  - `preview.damit.kr` can run on Postgres

## Latest PM customer notification automation note

- customer confirmation issuance can now attempt real automatic delivery
- the current delivery strategy is:
  - Kakao AlimTalk first
  - SMS fallback second
  - manual follow-up when neither path is available
- production trust still depends on live provider credentials, approved Kakao template mapping, and a preview-side provider smoke
- a dedicated preview provider smoke command now exists so this proof can be repeated before broader rollout claims
  - `damit.kr` remains on SQLite during the switch
- an extra stale `cloudflared` user process caused mixed routing until it was stopped
- the remaining optional proof for this batch is rollback back to SQLite after preview testing

## Latest PM preview acceptance gate note

- preview Postgres now has a script-only QA session bootstrap path
- the bootstrap path does not add a new public route and does not require `AUTH_DEBUG_LINKS=true`
- browser proof now confirms authenticated preview access on:
  - `/home`
  - `/account`
  - `/app`
  - `/ops`
- this moves the remaining risk from `how do we log in on preview?` to `when do we complete rollback proof and root cutover evaluation?`
- one UX-quality issue was also surfaced during browser review:
  - external Google Fonts are blocked by current CSP, so live typography is falling back more than intended
- PM judgment remains:
- `preview Postgres acceptance tooling GO`
- `root cutover HOLD`

## Latest PM home/app role parity note

- `/home` and `/app` now have clearer surface roles
- `/home` is positioned as the operational starting point
- `/app` overview is positioned as the selected-job execution hub
- self-host deploy now has a preview Postgres refresh path when `.env.preview-postgres` exists
- this does not change the root cutover judgment:
  - `production root SQLITE GO`
  - `preview POSTGRES rehearsal GO`
  - `root Postgres cutover HOLD`

## Latest PM account surfaces note

- the next product-facing maturity step is not more infrastructure, but clearer account surfaces
- `login`, `start/signup`, `owner account`, and `system admin` must be treated as separate surfaces
- near-term priority is:
  - make signup explicit as a first-login onboarding path
  - add an owner-facing account page
  - keep system admin as a later, separate internal surface

## Latest PM account surfaces phase 1 note

- `start`, `account`, and `admin` now exist as first-class product surfaces
- `/home` now links into `/account` and conditionally exposes `/admin`
- `system admin` is separated from owner-company operations instead of being mixed into `/ops`
- phase 1 is `GO`
- next maturity step is visual QA plus deeper owner/admin behavior, not more surface proliferation

## Latest PM account surfaces phase 2 note

- `/account` now supports the first real owner action: sending team invitations
- invitation delivery result and current onboarding state stay on the same page
- non-owner roles remain read-only on invitation management
- system admin remains intentionally observational while owner account operations get stronger

## Latest PM account surfaces phase 3 note

- `/account` now supports owner self-service actions instead of staying summary-only
- profile editing is available for display name and phone number
- owner invitation flows now include resend and revoke actions
- `/admin` still remains read-only while account and owner operations continue to mature

## Latest PM account surfaces phase 5 note

- `/account` now frames session security as an operational surface, not just a settings page
- recent login-link activity is visible on the account surface itself
- recent owner account actions are now visible without leaving the page
- `/admin` gained its first safe action via read-only dataset export

## Latest PM account surfaces phase 6 note

- `/account` now separates active owner work from closed history
- pending invitations stay visible, while closed invitation history is collapsed by default
- ended sessions now move into a history block so live session review stays faster
- a new attention strip highlights the few items that actually need review right now

## Latest PM account surfaces phase 7 note

- authenticated mobile visual review for `/account` is now part of the quality gate
- account history summaries stack cleanly on narrow screens
- mobile spacing is tighter and more consistent without losing the operational hierarchy

## Latest PM account surfaces phase 8 note

- invitation and session lifecycle copy is now shorter and more explicit
- closed states read as done, while risky live states read as actionable
- the account surface is getting closer to true operational wording, not settings-page wording

## Latest PM admin surfaces phase 3 note

- `/admin` now reads more clearly as a constrained, read-only internal surface
- the explorer explains the currently selected dataset before showing the raw table
- authenticated mobile visual review now covers the admin surface too

## Latest PM ops/app continuity note

- `/ops` now recommends concrete next destinations into `/app` or `/account`
- `/app` accepts selected-case deep links from `/ops` so the operator lands on the relevant job case immediately
- authenticated mobile visual review now covers the `/ops` handoff state, so operational continuity is checked on both desktop and mobile

## Latest PM app return-context note

- `/app` now preserves operational intent after an `/ops` handoff instead of showing only a generic selected-case summary
- handoff context is visible before the normal case-focus card and points to the first recommended checkpoint
- the cross-surface operator flow is now evidence-backed on both `/ops` and `/app`

## Latest PM Cloudflare operations note

- the recommended public-facing operating model is now `Cloudflare + home server + external stateful services`
- keep the Ubuntu home server for cheap compute while traffic is still small
- put the public domain and ingress on Cloudflare, using Cloudflare Tunnel instead of raw router port-forwarding
- keep SSH and operator maintenance on Tailscale
- move the primary database to managed Postgres before broad public beta
- move uploads and backup bundles toward object storage after that
- keep a single canonical product origin first, because the current auth/session model is simplest on one host

## Latest PM domain rollout note

- `damit.kr` is now the chosen canonical brand domain
- the safe promotion path is `preview.damit.kr` first, then the root domain
- Cloudflare Tunnel hostnames should be created in the Cloudflare dashboard, while the Ubuntu server now has helper scripts for origin switching and public-host smoke checks
- SSH and maintenance stay on Tailscale even after the public hostname is introduced

## Latest PM real-mail branding note

- live login mail delivery is now proven
- the next mail-quality bar is no longer functional delivery alone, but customer-facing brand polish
- login and invitation emails should read like a real operator workflow with clearer subjects, CTA structure, and security guidance
- this batch is `GO`

## Latest PM Postgres next-step note

- the next infrastructure phase remains `Postgres readiness`, not immediate runtime cutover
- recommended sequence:
  - prepare Supabase credentials
  - run Postgres preflight
  - confirm restore and migration path
  - only then evaluate runtime cutover
- PM judgment remains `cutover HOLD`, `readiness GO`

## Latest PM Postgres runtime smoke note

- local `production-local` readiness, preflight, and migration-status commands are now green against the Supabase session pooler
- local Postgres runtime happy-path smoke is now green through:
  - login
  - invitation/join
  - company switch
  - job case create
  - field record create/link
  - quote update
  - draft generation
  - agreement recording
- runtime cutover remains `HOLD`
- the next required proof is server-side rollout and rollback evidence, not more local connectivity work

## Latest PM ops/app warning-copy note

- warning cards on `/ops` and `/app` now use shorter decision-first wording
- viewed confirmations, quote gaps, draft gaps, and on-hold states are easier to distinguish at a glance
- this batch changed wording only and kept the workflow logic intact

## Latest PM ops/app risk-focus note

- `/ops` now isolates the first risk-bearing route in a dedicated focus card before secondary routes
- `/app` now explains why the selected case was prioritized, not just which card to open
- the cross-surface operator flow now makes urgency easier to understand in one short scan

