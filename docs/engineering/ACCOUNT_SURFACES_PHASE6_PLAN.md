# ACCOUNT SURFACES PHASE 6 PLAN

## PM objective

Improve `/account` so session endings and invitation history feel operationally clear instead of technically correct but cognitively vague.

## Scope

### 1. Session expiry and idle guidance

- expose clearer session-state hints for:
  - current session
  - other active sessions
  - expired sessions
  - revoked sessions
  - idle-risk sessions
- explain:
  - which state is still risky
  - which state is only historical evidence
  - why the current session is not revoked here

### 2. Invitation lifecycle framing

- group invitation history into:
  - waiting for response
  - finished or closed
- make resend and revoke actions feel attached to the pending state only
- sharpen lifecycle language:
  - waiting
  - re-sent
  - revoked
  - joined

### 3. Account summary polish

- make the top summary answer:
  - do I have another live session somewhere?
  - is any session old enough to worry about?
  - do I still have pending invitations to track?

## Success criteria

- `/account` clearly distinguishes active risk from closed history
- invitation history feels readable at a glance
- owner can still act on pending invitations and other active sessions without confusion
- auth/account regressions remain green

## Out of scope

- suspicious-login alerting
- device fingerprinting
- destructive admin actions
- public mail cutover
