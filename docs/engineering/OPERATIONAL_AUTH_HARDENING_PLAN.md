# OPERATIONAL_AUTH_HARDENING_PLAN

## Goal

Move the current auth flow closer to a real operating product by combining:

- real email delivery readiness for login links
- stricter session handling and cookie policy
- cleaner separation between development-only debug flow and real user delivery flow

## PM decision

This batch should improve the current auth system, not replace it.

We already have the right product direction:

- email magic link login
- session cookie + refresh cookie
- company context selection

The gaps are operational hardness and delivery realism.

## Scope

### 1. Real email login readiness

- keep `MAIL_PROVIDER=FILE` for local development
- keep `MAIL_PROVIDER=RESEND` as the production-ready provider path
- persist login challenge delivery result after send attempt
- return a masked delivery target so the UI can confirm where the link was sent
- only expose `debugMagicLink` in explicit debug mode
- surface delivery metadata in the login response and operator data path
- fail challenge issuance with a delivery error when the mail provider rejects the send

### 2. Session security hardening

- tighten session and refresh cookie SameSite policy
- add idle timeout enforcement for server sessions
- rotate both `sessionId` and `refreshToken` on refresh
- require CSRF token on refresh endpoint as well
- invalidate older issued challenges for the same email when a new one is created
- make refresh and logout rely on the same cookie/CSRF expectations as other write actions
- keep local debug ergonomics through `AUTH_DEBUG_LINKS`, not implicit development leaks

### 3. Non-goals

- no password auth
- no OTP fallback
- no full device management
- no support back office for mail retries in this batch

## PM success criteria

- production can switch to `MAIL_PROVIDER=RESEND` without code changes
- login challenge delivery state is stored and inspectable
- debug links are absent in operational mode
- stale sessions time out more aggressively
- refresh creates a new session identifier, not just a new refresh token
- refresh rejects missing or mismatched CSRF tokens
- operator-facing surfaces can confirm where the link was sent without revealing the full address
