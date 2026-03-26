# ACCOUNT SURFACES PHASE 4 PLAN

## PM objective

Add session visibility and session control to `/account` so the owner-facing account surface starts to cover real operational security needs.

## Scope

### 1. Session visibility

- show active session list inside `/account`
- highlight the current session separately
- expose:
  - last active time
  - expiry time
  - company context

### 2. Session control

- allow the signed-in user to revoke other sessions
- keep current session non-destructive in this phase
- use explicit guidance to send current-session logout back through the normal logout action

### 3. Audit trace

- append audit entry when another session is revoked from `/account`

## Success criteria

- `/account` clearly shows current session vs other active sessions
- user can revoke another session without leaving the page
- session state refreshes immediately after revoke
- auth/session regressions remain green

## Out of scope

- forced revoke of current session
- device fingerprinting
- public mail cutover
- system-admin session control
