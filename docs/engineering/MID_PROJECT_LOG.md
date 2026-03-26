## 2026-03-19 - Real mail smoke reached domain verification gate

- local production-like mail smoke now reaches Resend successfully
- current blocker is external: sender domain is not yet verified in Resend
- next action is domain verification, not code change

## 2026-03-19 - Real mail smoke validation tightened

- live Resend smoke reached the provider once and surfaced an invalid MAIL_FROM format
- added preflight MAIL_FROM validation in `src/mail-gateway.js` and `scripts/mail-login-smoke.mjs`
- added `tests/mail-gateway-format.test.js` to lock the sender-format rule

## 2026-03-19 - Real mail smoke scaffolding added

- added `.env.production.local` as the ignored local path for real mail smoke
- added `scripts/lib/env-file.mjs` and `scripts/mail-login-smoke.mjs`
- added `npm run smoke:mail:production-local` and updated runbook/readiness docs

﻿# Mid-Project Log

Date: 2026-03-12
Brand: `다밋`
Current PM Status: `GO for next controlled integration batch`

## Completed Milestones

1. 아이디어 발산과 보수적 선정
- 여러 라운드 브레인스토밍 후 `현장 추가금 합의 비서` 방향 선정
- 대형 플랫폼 중복 여부 검토
- 브랜드 `다밋` 확정

2. 문서 기반 제품 정의
- PRD
- MVP scope
- IA / screen flow / screen specs
- feature specs / API / validation / error policy

3. 파일럿 구현과 배포
- SQLite 기반 MVP 구현
- 실제 Fly 배포
- 시각 검수 및 모바일 동선 보완
- pilot 문서, runbook, interview guide 정리

4. production foundation
- auth foundation
- company context / invitation
- customer confirmation link
- staging 분리
- Supabase Free preflight / migration green

5. repository migration path
- Postgres repository slice 1
- read route integration
- write foundation
- write route integration

## Current Architecture Snapshot

- Live runtime: `SQLite`
- Staging runtime: `SQLite`
- External Postgres target: `Supabase Free`
- Staging Postgres state: preflight green, migration applied
- App mode: pilot owner-token + beta session/company 공존

## Current Strengths

- 문서와 구현이 따로 놀지 않는다.
- staging 이 실제 판단 도구 역할을 한다.
- 핵심 흐름은 실제로 배포 가능한 상태다.
- 비용 통제가 잘 되고 있다.

## Current Open Risks

- full Postgres runtime cutover 는 아직 아님
- Postgres timeline write 미완료
- object storage 미연결
- multitenant authorization hardening 미완료
- owner-token 운영 경로 정리 필요

## Recommended Next Batch

1. Postgres timeline write foundation 또는 write route 후속 정리
2. object storage adapter 설계/구현
3. multitenancy + RBAC 통합 테스트 강화

## PM Note

- 지금은 조급하게 완성도를 선언할 단계가 아니다.
- 하지만 `중간 프로젝트` 기준으로는 매우 건강하게 진행되고 있다.
- 다음도 같은 방식으로, 작은 배치와 분명한 회고를 유지하는 것이 중요하다.


## Object storage foundation batch

- added local object storage provider abstraction without changing live runtime away from SQLite
- aligned SQLite photo metadata with production-oriented fields: `storage_provider`, `object_key`, `public_url`
- confirmed staging upload now uses scoped asset paths and still serves images correctly
- PM judgment: next best step is repository-backed field record create/link and timeline write parity, not external storage provider cutover yet


## Field record + timeline parity batch

- moved field record create and link persistence behind repository contracts
- unified timeline writes behind `timelineEventRepository.append`
- confirmed staging still produces the expected 4-event timeline for the P0 flow
- PM judgment: next best step is repository parity for job case create and customer confirmation state, before any broader infra expansion


## Job case + customer confirmation parity batch

- moved `POST /job-cases` behind `jobCaseRepository.create`
- moved customer confirmation issue/view/ack/latest behind `customerConfirmationRepository`
- replaced public confirmation payload direct SQLite reads with repository-backed detail assembly
- added Postgres migration `0002_customer_confirmation_state_columns` to align confirmation state fields
- confirmed staging preflight now reports `applied=2`, `pending=0`
- confirmed staging confirmation smoke reaches `ISSUED -> VIEWED -> CONFIRMED` and resets cleanly
- PM judgment: next best step is narrower Postgres write parity follow-up, not cutover yet

## System/admin parity batch

- moved health, storage-status, backup, and reset routes behind `systemRepository`
- added Postgres logical backup export to `/data/backups`
- added Postgres operational reset for product data tables only
- confirmed staging SQLite runtime smoke still passes
- confirmed one-off Supabase-backed Postgres admin smoke succeeds without runtime cutover
- PM judgment: next step should be a stricter cutover-readiness review, not an impulsive switch

## Cutover readiness review

- PM led a cross-agent review for runtime Postgres cutover
- result: `HOLD`, for healthy reasons
- strongest positives: repository parity, staging preflight green, migrations green, admin parity green
- remaining blockers: Postgres auth write path, runtime Postgres auth/session smoke, restore rehearsal, integrated tenant/RBAC proof
- next recommended batch: `Postgres auth/runtime readiness`

## Postgres auth/runtime readiness batch

- moved runtime auth/session/company-context behavior behind `authRepository` instead of direct SQLite auth helpers
- expanded repository contracts to include challenge, verify, refresh, revoke, invitation, membership listing, and company switching
- confirmed SQLite app-level auth regression still passes through repository delegation
- added Postgres auth repository parity test covering login, refresh, invitation acceptance, and company switch
- prepared session-based Postgres runtime smoke script for staging
- attempted staging deploy with `STORAGE_ENGINE=POSTGRES`, but Fly blocked the deploy because the trial ended and billing is required
- PM judgment: code readiness is green locally; staging runtime proof is pending external billing unblock

## Local restore rehearsal batch

- added explicit local restore helpers for SQLite DB and local uploads
- added a full local rehearsal script and automated test
- fixed SQLite backup durability by checkpointing WAL before copying the DB file
- fixed local object-storage adapter creation so temp-config and isolated rehearsal environments behave correctly
- PM judgment: local restore rehearsal complete, broader restore readiness still hold

## Local launch readiness batch

- added local workspace status metadata to support cleaner demos and PM checks
- confirmed core local regression remains green after the small UI polish
- documented a local launch checklist, local demo runbook, and PM local release review
- PM judgment: local runtime is ready for internal demos and local operator walkthroughs

## Self-host track initialization

- created a separate self-host track for Ubuntu home-server deployment
- prepared Docker Compose assets for a low-cost SQLite-based private pilot environment
- documented safer exposure guidance that prefers Tailscale or Cloudflare Tunnel over raw port-forwarding
- PM judgment: self-host is acceptable for private pilot use, but remains separate from public production

## Tailscale trusted-access track

- opened a separate Tailscale-based trusted-access track for the Ubuntu self-host environment
- PM selected Tailscale as the preferred next step over raw router exposure
- next step is installation, authentication, and private-pilot access verification

## Self-host operational schema deploy verification

- deployed SQLite operational schema bootstrap to Ubuntu self-host runtime
- verified `users`, `companies`, `memberships`, `login_challenges`, `sessions`, `invitations`, `customer_confirmation_links`, and `customer_confirmation_events` exist immediately after boot
- PM judgment: self-host is now a more internally consistent single-node operational product, not just a pilot-shaped runtime

## Operator data explorer batch

- added a read-only operator inspection script for SQLite runtime checks
- added `/api/v1/admin/data-explorer` behind owner session auth
- upgraded `/ops` with dataset switching and recent row samples for core operational tables
- PM judgment: operators can now inspect live business data without dropping into ad-hoc shell work every time

## Operational auth hardening batch

- added delivery metadata and masked target handling for login and invitation mail flows
- gated debug login links behind `AUTH_DEBUG_LINKS`
- enforced refresh CSRF plus full session rotation on refresh
- enforced idle timeout in SQLite and Postgres auth repositories
- updated env examples and runbook to reflect operational auth defaults
- PM judgment: login is now closer to the real production path, with local debug convenience kept behind explicit configuration

## Ops dashboard phase 4

- repaired `/ops` microcopy and rebuilt the script around readable Korean operator copy
- extended ops signals with login-link delivery and session-health visibility
- extended the operator data explorer with `loginChallenges` and `sessions` datasets
- PM judgment: `/ops` now answers both workflow movement and auth-operability questions in one screen

## Strict UX polish
- /app 상단 signal board DOM 바인딩 누락을 수정해 실제 요약이 갱신되도록 정리했다.
- /app에 지금 바로 할 일 strip과 작업 건 카드 다음 액션 마이크로카피를 추가했다.
- /ops에 운영 priority checklist를 추가해 첫 5초 우선순위 판단이 가능하도록 정리했다.
- visual review 스크립트에 로그인 후 /app, /ops 캡처를 추가해 운영 화면 증거를 남길 준비를 했다.


## Customer confirmation UX fix
- confirm.html, confirm.js를 UTF-8 기준으로 다시 정리해 고객 확인 화면 인코딩 깨짐을 제거했다.
- 확인 완료 후 상단 상태 배너와 성공 메시지가 즉시 바뀌도록 해, 고객이 완료 여부를 바로 인지할 수 있게 했다.
- /app의 합의 완료 상태는 마무리 점검보다 추가 조치 없음 / 기록 확인용에 가깝게 문구를 조정했다.
- 고객 확인 화면 카드 간격과 레이아웃을 메인 제품 표면과 더 비슷한 규칙으로 맞췄다.



## Operational auth phase 2

- hardened auth and session-sensitive writes with trusted same-origin enforcement in production-like mode
- applied no-store headers to auth/session/admin-sensitive JSON responses
- updated login and invitation UI copy so real email delivery is the primary path and debug links are explicitly development-only

## Workspace field UX fix
- documented a PM/QA field-user style review for `/app` and `/confirm`
- bounded the timeline card into an internal activity rail on desktop when event volume grows
- added timeline count and guidance copy so long history reads as evidence, not unfinished work
- reframed `AGREED` selected cases as completed inside the product rather than an active next step
- tightened confirmation-page card spacing for calmer review flow


## 2026-03-14 Ops mail/auth readiness

- PM approved a small batch to expose mail/login operational readiness directly in /ops`r
- SQLite and Postgres ops snapshots now publish auth delivery mode, debug-link state, trusted-origin enforcement, and mail config readiness
- /ops alerts and priority checklist now distinguish preview-mode auth from real-mail-ready auth



## 2026-03-19 Visual review automation recovery

- repaired the local browser screenshot pipeline for authenticated /app and /ops review
- replaced fragile Edge profile reuse with a same-origin session bootstrap redirect flow
- reran 
ode scripts/visual-review.mjs successfully and regenerated authenticated screenshots



## 2026-03-19 - App workflow phase 3

- `/app` ?? ?? ??? ??? ?? ? ??? ?? ????? ??
- ?? ??? `?? ?? ??` ?? ??
- `AGREED`, `EXCLUDED` ??? ?? ??? ???? ??? ?? ??
- ?? ? ??? `?? ??` ?????? ??
- ? ????? ?? ??? rail? ??? ??
- PM judgment: `/app` ?? ?? ???? ????, ?? ??? ??? ?? ?? ?? polish
## 2026-03-22 - Post-login flow phase 1

- clarified `login -> home -> app/ops` flow with stage-aware copy and next-action guidance
- turned `/home` into an operational handoff screen instead of a passive summary page
- upgraded customer confirmation guidance in `/app` so issued/viewed/confirmed states map to clearer operator actions
- explicitly recorded that real mail cutover remains `HOLD` until sender-domain verification exists
## 2026-03-22 - Post-login flow phase 2

- added reason-aware return flow for session expiry, logout, and owner-only ops access
- login can now return users to the original screen through a safe same-origin `next` path
- home now explains why a user returned there and what to do next after role-based redirects
- PM judgment: exception flow clarity improved enough to continue deeper app/home continuity polish

## 2026-03-22 - App workspace recovery

- restored `public/app.js` after a broken merge left the main operator workspace unparsable
- aligned the script with the current production workspace layout: signal board, focus card, case progress rail, customer confirmation guidance, and bounded timeline rail
- cleaned corrupted static copy in `public/index.html`
- reran authenticated visual review successfully and regenerated `/app` and `/ops` screenshots
- PM judgment: main workspace is back to a usable production-like state, with mail cutover still on hold

## 2026-03-22 - Post-login exception polish

- clarified login return messaging so `session-expired` and `logged-out` states explain the exact destination after re-login
- upgraded `/home` into a clearer exception handoff screen with return actions for `owner-required` and `company-switched`
- tied role-based route guidance, company-switch notes, and CTA labels to the currently active company context
- changed `/ops` owner-only redirects to point users back to `/home?reason=owner-required&next=/app`
- reran authenticated visual review and confirmed `/app` and `/ops` remain visually stable after the flow polish

## 2026-03-23 - Authenticated flow quality gate

- added authenticated `/home` capture to the visual review pipeline so `/home`, `/app`, and `/ops` are checked together
- clarified `/home` route cards with role-aware priority badges for the recommended path and the operator-only path
- fixed a CSS priority bug where `.hidden` sections could leave empty return banners visible in screenshots
- regenerated authenticated visual evidence for the main post-login flow and confirmed the updated `/home` layout reads cleanly

## 2026-03-24 - Account scan-speed polish

- added an attention strip to `/account` so owners can see the few items that need action right now
- split invitation rendering into active invites vs. closed invitation history
- moved ended sessions into a collapsible history block so session review focuses on the current and still-active sessions first
- reran authenticated visual review and confirmed the account surface reads faster without losing audit visibility

## 2026-03-24 - Account mobile polish

- added authenticated mobile visual review coverage for `/account`
- tightened `/account` spacing and history summary layout for narrow screens
- increased mobile account review capture height so the evidence includes more than the first fold
- confirmed the account surface still prioritizes live actions before history on mobile

## 2026-03-25 - Account lifecycle copy polish

- shortened invitation lifecycle wording so accepted, revoked, first-send, and reissued states read faster
- shortened session lifecycle wording so current, expired, revoked, and idle-risk states read faster
- kept the behavior unchanged and focused this batch on display clarity only
- reran authenticated visual review and confirmed the account surface remains stable

## 2026-03-25 - Admin readability and mobile polish

- rebuilt `/admin` copy so the page reads as a constrained, read-only internal surface
- added read-only principles and a selected-dataset focus card above the explorer
- added authenticated mobile visual review coverage for `/admin`
- confirmed the admin surface is easier to scan on both desktop and mobile without expanding admin power

## 2026-03-25 - Ops/app continuity phase 1

- added `/ops -> /app` handoff recommendations so operators can move from a signal to the relevant job case faster
- added lightweight `/app?caseId=...&source=ops` support and preserved the selected case on arrival
- added an operator-facing workspace note so `/app` explains why the selected case was opened from `/ops`

## 2026-03-25 - Ops/app continuity phase 2

- added authenticated mobile visual review coverage for `/ops` through `review=handoff`
- strengthened the first handoff card and stacked mobile handoff actions for easier tap targets
- review-mode captures now hide pre-handoff sections so the mobile continuity evidence focuses on the real decision area

## 2026-03-25 - App ops-return context

- added a dedicated `/app` handoff card for cases opened from `/ops`
- the workspace now explains why the case was opened and which card should be inspected first
- authenticated visual review now includes a focused mobile `/app` arrival state for the ops handoff flow

## 2026-03-25 - Ops/app warning-copy polish

- shortened warning-level wording on `/ops` so open confirmations, session checks, and pre-mail states read faster
- shortened `/app` handoff badges and titles around quote-ready, draft-ready, viewed-confirmation, and on-hold states
- kept the workflow unchanged while making the first recommended action easier to scan

## 2026-03-25 - Ops/app risk focus

- added a dedicated first-target focus card on `/ops` so the highest-risk route stands apart from the rest of the handoff list
- added a short "why now" line to `/app` ops-return cards so urgency is explicit before the normal detail stack
- kept the rest of the routing and workflow unchanged while making risk feel easier to understand in one glance

## 2026-03-25 - Damit brand UI foundation

- locked a clearer `damit` visual direction around paper, ink, ledger, and status-stamp metaphors
- replaced more of the generic AI-SaaS card language with solid warm surfaces, stronger borders, and calmer emphasis
- rebuilt `/start` as a clean onboarding entry and aligned `/home` and `/ops` route cards with the same brand material system
- reran authenticated visual review and confirmed the main branded surfaces remain stable after the redesign

## 2026-03-25 - Account/admin brand alignment

- added the full `damit` brand lockup to `/account` and `/admin`
- moved account and admin secondary cards away from cool white-blue utility styling into the same paper-ledger material system
- aligned account attention, invite, session, history, and admin principle cards with the warmer product-wide surface language
- reran authenticated visual review and confirmed both surfaces now read more like part of one product family

## 2026-03-25 - Stitch integration pass

- reviewed the full `output/stitch` set and chose `design-system absorption + selective surface rebuild` over direct HTML replacement
- moved the live product closer to the Stitch `Digital Ledger` direction with editorial typography, flatter paper surfaces, stronger borders, and reduced roundedness
- rebuilt `start`, `account`, and `admin` markup with clean Korean copy while keeping existing route IDs and runtime flow intact
- reran visual review and confirmed `landing`, `home`, `app`, `ops`, `account`, and `admin` still render coherently after the integration pass

## 2026-03-25 - Confirm brand integration

- rebuilt the public customer confirmation page as a document-style confirmation surface instead of a generic card stack
- aligned confirm with the same `damit` paper-ledger brand system while keeping the public no-login flow unchanged
- clarified the reading order around summary, scope, owner message, evidence photo, and final acknowledge action
- reran customer confirmation and api regression tests to confirm the public flow still works after the redesign

## 2026-03-23 - App terminal-state polish and runtime recovery

- restored missing `/app` runtime helpers: `renderCustomerConfirmationState`, `renderReviewState`, `syncActionState`, and `setDefaultConfirmedAt`
- fixed a startup regression where `filterButtons` was referenced before declaration, which kept `/app` looking like a static first-load shell
- reframed `AGREED` and `EXCLUDED` as closed/review-only states instead of active next-step states
- upgraded customer confirmation messaging so operators can distinguish issued, viewed, confirmed, and review-only states more quickly
- added clearer job-card meta pills for flow finished/in progress, agreement evidence, and quote readiness
- regenerated authenticated visual evidence and confirmed `/app` now renders a real selected case state in `desktop-app-authenticated.png`

- 2026-03-26: `public/logos` 아래 최종 로고 자산을 canonical 경로로 고정했다. `damit_default_exact.svg`를 landing/start/login/home/account/admin/confirm 헤더 로고로, `damit_icon_exact.svg`를 각 HTML 표면의 favicon으로 연결했다.
- 2026-03-26: `/app`와 `/ops` 내부 헤더에도 compact lockup을 확장 적용해 브랜드 연속성을 강화했다. 관련 판단은 `docs/engineering/APP_OPS_LOGO_EXTENSION_REVIEW.md`, 현재 방향 평가는 `docs/engineering/PM_PROJECT_DIRECTION_2026-03-26.md`에 정리했다.

- 2026-03-23: `/app` 모바일 review 프레이밍을 정리했다. `detail/agreement/copy` review 모드에서 상단 운영 요약을 숨기고 핵심 카드만 남기도록 바꿨고, 상세 로딩 후 workflow 요약이 다시 렌더링되도록 복구했다. 최신 증거는 `output/visual-review/mobile-detail-top.png`, `output/visual-review/mobile-agreement.png`에 반영됨.
- 2026-03-23: PM 기준으로 계정 표면을 다시 정리했다. `로그인/가입/사장님 마이페이지`는 제품 표면, `시스템 관리자`는 내부 표면으로 분리하고, 다음 제품 성숙도 배치를 `시작하기 진입면 + 사장님 마이페이지 + home 역할 정리`로 잠갔다.
