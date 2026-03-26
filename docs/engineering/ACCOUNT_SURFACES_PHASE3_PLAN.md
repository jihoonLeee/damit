# ACCOUNT SURFACES PHASE 3 PLAN

## PM objective

Turn `/account` into a stronger owner workspace by adding the next obvious follow-up actions without overloading the surface.

## Scope

### 1. Profile editing

- allow authenticated users to update:
  - display name
  - phone number
- keep email read-only in this phase
- reflect changes immediately in account overview

### 2. Invitation follow-up actions

- allow OWNER to resend an active invitation
- allow OWNER to revoke an active invitation
- keep accepted invitations read-only
- keep system-admin surface read-only

### 3. Operational traceability

- append audit entries for:
  - profile update
  - invitation resend
  - invitation revoke

## Success criteria

- `/account` supports profile update without leaving the page
- OWNER can resend or revoke an invitation from the invitation list
- invitation state refreshes immediately after action
- account and auth regression tests remain green

## Out of scope

- password-based auth
- membership role editing
- destructive system-admin actions
- public mail cutover
