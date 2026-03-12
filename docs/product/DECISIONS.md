# DECISIONS

| Date | Topic | Decision | Why | Scope |
|---|---|---|---|---|
| 2026-03-10 | Field record creation | Quick field capture uses a single create request with photos included | Keeps UX and API aligned and prevents ghost records without photos | docs/specs, API, backend |
| 2026-03-10 | Status source of truth | Job case status changes only through agreement record creation | Keeps auditability and agreement evidence consistent | docs/specs, backend, frontend |
| 2026-03-10 | Error contract | All APIs must share a common error schema and explicit error codes | Prevents frontend/backend drift on failure handling | API spec, error policy, frontend |
| 2026-03-10 | Enum format | API, domain, and validation enums use `UPPER_SNAKE_CASE` | Removes cross-doc inconsistency and lowers implementation bugs | domain model, API spec, validation |
| 2026-03-10 | MVP permission scope | MVP runtime scope stays `OWNER` only | Avoids premature permission complexity | permission matrix, backend |
| 2026-03-12 | Internal auth for production | Internal users move to email magic link auth | Removes shared access code while keeping onboarding simple | auth spec, frontend, backend |
| 2026-03-12 | Customer confirmation model | Customers confirm through signed links without full account creation | Minimizes friction while preserving evidence trails | auth spec, backend, frontend |
| 2026-03-12 | Member invitation authority | Only `OWNER` can invite members in v1 beta | Keeps early permission policy conservative | auth spec, backend, frontend |
| 2026-03-12 | Live pilot storage | Live pilot runtime stays on `SQLite` | Cheapest and simplest way to keep learning with low operational risk | infra, backend, ops |
| 2026-03-12 | First external Postgres provider | Default staging and early beta Postgres target is `Supabase Free` | Lower fixed cost than Fly Managed Postgres while still giving a real Postgres target | infra, docs, ops |
| 2026-03-12 | Long-term DB posture | Paid managed Postgres is deferred until usage and ops maturity justify it | Prevents premature infrastructure cost before product validation | infra, PM |
| 2026-03-12 | Postgres runtime rollout | Runtime Postgres moves in slices: read parity and audit first, cutover later | Reduces migration risk and keeps PM review conservative | backend, ops, PM |
| 2026-03-12 | Route integration order | App routes integrate repository-based reads before any Postgres write cutover | Makes DB migration safer while keeping user-facing regression risk low | backend, PM, QA |
| 2026-03-12 | Write foundation order | Postgres write foundation starts with quote, draft, and agreement only | Delays storage-heavy routes until file/object strategy is ready | backend, PM, QA |
| 2026-03-12 | File asset contract | Photo assets keep a stable API `url`, while internal storage metadata expands to `storage_provider`, `object_key`, `public_url`, and `url` | Preserves frontend stability and reduces later object-storage migration churn | backend, specs, PM, QA |

| 2026-03-12 | Timeline write parity | Timeline writes move to a shared repository contract across field record, quote, draft, agreement, and customer confirmation flows | Removes SQLite-only app-layer timeline behavior before any Postgres write cutover | backend, PM, QA |
| 2026-03-12 | Job case creation parity | Job case creation moves behind `jobCaseRepository.create` before broader write rollout | Removes the last core app-layer direct mutation in the case lifecycle | backend, PM, QA |
| 2026-03-12 | Customer confirmation parity | Customer confirmation issue/view/ack/latest move behind a dedicated repository contract, with Postgres state columns added in migration `0002` | Closes mixed-storage behavior and aligns runtime expectations before cutover | backend, ops, PM, QA |
| 2026-03-12 | System/admin parity | Health, storage-status, backup, and reset routes move behind `systemRepository`, and Postgres gains logical backup plus operational reset | Removes SQLite-only operational blockers before any runtime cutover | backend, ops, PM, QA |
| 2026-03-12 | Auth runtime parity | Auth/session/company-context routes move fully behind `authRepository` before any staging `POSTGRES` runtime proof | Avoids misleading mixed-storage validation and closes the largest remaining cutover ambiguity | backend, PM, QA, ops |
| 2026-03-12 | SQLite restore discipline | Local SQLite backups must checkpoint WAL before copy, and local restore proof must cover both DB and uploads together | Prevents false-confidence backups and makes the active local runtime operationally recoverable | backend, ops, PM, QA |
| 2026-03-12 | Local release posture | Local SQLite runtime may be treated as `GO` for demos and internal walkthroughs only after P0 flow, auth regression, and restore rehearsal are all green | Keeps PM language honest and prevents local completeness from being mistaken for production cutover readiness | PM, QA, ops |
| 2026-03-12 | Self-host track | Home Ubuntu deployment is allowed only as a separate private-pilot track, not as a substitute for public production readiness | Preserves cost efficiency while keeping PM language and operational expectations honest | PM, ops, infra |

