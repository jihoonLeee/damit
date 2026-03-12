# Mid-Project Log

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

