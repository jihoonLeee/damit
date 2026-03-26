# ACCOUNT SURFACES PHASE 5 PLAN

## PM objective

Make `/account` feel like a trustworthy owner security surface by improving session readability and exposing recent login-link activity in the same language the product already uses.

## Scope

### 1. Session framing

- split session inventory into:
  - current session
  - other active sessions
  - recently closed sessions
- make it obvious that:
  - current session uses normal logout
  - other active sessions can be revoked here
  - revoked sessions are historical evidence, not active risk

### 2. Recent login activity

- expose recent login-link delivery history for the signed-in email
- show:
  - issued time
  - delivery status
  - challenge status
  - expiry time
- keep this read-only

### 3. Operational language polish

- tighten account microcopy so the page answers:
  - where am I signed in?
  - which session is current?
  - do I still have another live session somewhere?
  - was my last login link actually delivered?

## Success criteria

- `/account` clearly distinguishes active vs closed sessions
- recent login activity is visible without opening `/ops`
- OWNER can still revoke another live session without confusion
- account/auth regressions remain green

## Out of scope

- device fingerprinting
- push notifications for suspicious login
- admin-level session termination
- public mail cutover
