# OPS_MAIL_AUTH_READINESS_PLAN

## Purpose

- Make `/ops` show whether mail-based login is truly ready for operational use.
- Reduce the gap between current local/self-host mode and the future real-mail production mode.
- Give PM, Builder, and QA one shared view of auth delivery readiness and session hardening status.

## Why this is the right next step

- Real Resend smoke still depends on credentials, so the most useful immediate batch is visibility.
- `/ops` already shows auth traffic, but it does not clearly answer:
  - are we still on FILE preview mode?
  - are debug links still enabled?
  - is trusted-origin enforcement on?
  - how many trusted origins are actually configured?
- Without these signals, the team can misread "auth works locally" as "auth is operationally ready".

## Scope

### Data contract

Add runtime readiness signals to `ops-snapshot` for both SQLite and Postgres implementations.

Planned fields:
- `runtime.mailProvider`
- `runtime.mailFromConfigured`
- `runtime.resendConfigured`
- `runtime.authDebugLinks`
- `runtime.authEnforceTrustedOrigin`
- `runtime.trustedOriginCount`
- `runtime.trustedOriginsConfigured`
- `runtime.authDeliveryMode`
- `runtime.authOperationalReadiness`

### UI

Improve `/ops` so the operator can immediately read:
- current login delivery mode
- current trusted-origin enforcement state
- current debug-link exposure state
- what remains before real-mail cutover

Planned UI changes:
- strengthen the `로그인/세션` signal card into an operational auth/security summary
- add auth/mail readiness rows into the snapshot list
- add alerts and priority items when auth is still in preview mode or trusted-origin hardening is incomplete

## Out of scope

- real Resend credential setup
- live mail end-to-end smoke
- changing the actual login flow contract
- Postgres runtime cutover

## PM decision

- This batch is approved as a low-risk, production-like readiness improvement.
- Success means an operator can look at `/ops` and answer within 10 seconds:
  - whether login delivery is still preview-only
  - whether debug links are still exposed
  - whether trusted browser origin checks are active
  - what must be done before real mail login can be considered ready
