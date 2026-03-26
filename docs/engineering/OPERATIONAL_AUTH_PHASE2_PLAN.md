# OPERATIONAL_AUTH_PHASE2_PLAN

## Goal

Move the current magic-link login flow from "production-ready in theory" to "operationally safer by default."

This batch keeps the existing product entry path:

- `/login`
- `/home`
- `/app`
- `/ops`

But hardens how requests are accepted and how delivery is explained to the user.

## PM decision

GO

The current login flow is already the right product decision.
The problem is not product direction.
The problem is that operational mode still leaves too much ambiguity in:

- whether a link was really emailed
- whether debug-only affordances are too visible
- whether state-changing auth requests are tightly bound to same-origin use
- whether sensitive auth responses can be cached unintentionally

## Scope

### 1. Real email login operationalization

- keep `MAIL_PROVIDER=FILE` for local and controlled self-host development
- keep `MAIL_PROVIDER=RESEND` as the real delivery path
- make login and invitation UI copy explain delivery in operational language
- keep debug links visible only in explicit debug mode
- surface file-preview information only in development-friendly contexts
- update env and runbook guidance so switching to real mail is operationally obvious

### 2. Session and request security tightening

- require trusted same-origin headers for auth and other state-changing browser writes in production-like mode
- add stronger default security headers on HTML and JSON responses
- mark auth and session-sensitive JSON as `Cache-Control: no-store`
- keep CSRF enforcement on session writes
- preserve current cookie rotation and idle expiry behavior

### 3. UX and operator clarity

- login success copy should emphasize “check your email” instead of implying the debug path is normal
- invite flow copy should stop looking like a debug-only workflow
- operators should be able to move to real mail later without changing the user-facing flow again

## Non-goals

- no password login
- no OTP fallback
- no social login
- no support console for manual challenge recovery
- no mail retry queue in this batch

## PM success criteria

- production-like mode can run with `MAIL_PROVIDER=RESEND` and `AUTH_DEBUG_LINKS=false`
- auth write routes reject cross-origin browser requests when strict origin enforcement is enabled
- auth and session JSON responses are not cacheable
- debug magic links remain a deliberate development affordance only
- login and invitation UX read like a real product, not an internal prototype
