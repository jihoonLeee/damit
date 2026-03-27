# PM Cross-Agent Review 2026-03-27

Date: 2026-03-27
Participants: PM, UX, QA
Decision: GO for preview QA access toolkit, HOLD on root Postgres cutover

## Goal

- Re-check the current product after public domain, real mail, Sentry, and preview Postgres rehearsal.
- Lock the next batch as the smallest change that improves real operational confidence.

## Current State

- `damit.kr` is live on SQLite and stable.
- `preview.damit.kr` is live on Postgres and proven at the health/runtime level.
- Public/authenticated surfaces are coherent enough for pilot use.
- The main remaining gap is not feature completeness, but repeatable preview QA speed.

## Findings

### PM

- The strongest proof now is operational truthfulness:
  - real domain
  - real mail
  - Sentry
  - public root on SQLite
  - preview Postgres rehearsal
- The biggest remaining risk is a slow or brittle preview validation loop before any root DB cutover decision.
- Root cutover is still too early without a faster authenticated preview QA path.

### UX

- The product surface itself is much clearer than before.
- The main friction is now between infrastructure truth and human verification:
  - preview is on Postgres
  - but entering preview as a realistic signed-in user still depends on mailbox access or one-off manual setup
- That makes repeated UX inspection slower than it should be.

### QA

- Preview runtime proof exists, but regression proof is still expensive to repeat.
- The current gap is not lack of coverage, but lack of a safe operator tool to enter preview quickly.
- QA should not require weakening public auth posture or re-enabling debug links.

## Final PM Decision

- The next batch is a `preview QA access toolkit`.
- It must:
  1. avoid public runtime auth weakening
  2. reuse the real login challenge/verify flow
  3. generate a one-time preview login link for operator-led QA
  4. support repeated preview walkthroughs after Postgres rehearsals

## Hold Conditions

- Do not re-enable global debug links on preview or root.
- Do not add a public QA backdoor endpoint.
- Do not move root runtime to Postgres during this batch.

## Next PM Gate

- After the preview QA toolkit exists, run one real preview walkthrough:
  - login
  - home
  - account
  - app
  - ops
- Then decide whether preview rollback proof should be executed immediately or after another short QA round.
