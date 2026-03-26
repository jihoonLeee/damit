# ACCOUNT SURFACES PHASE 2 PLAN

## PM objective

Turn `/account` from a read-mostly summary page into a real owner action page without mixing internal-admin concerns into it.

## Scope

### 1. Owner invite action inside `/account`

- add an owner-only invite form
- allow owner to create invitation links without leaving `/account`
- surface delivery result, preview file, and debug invitation link clearly

### 2. Invitation section reframing

- make the invitation list read as `current team onboarding state`
- keep non-owner roles read-only with a clear explanation

### 3. Keep `/admin` read-only

- do not add destructive or cross-tenant write actions in this batch
- keep system-admin scope observational while the owner account flow gets stronger

## Success criteria

- OWNER can create an invitation from `/account`
- current invitation list refreshes immediately after create
- MANAGER/STAFF still see clear read-only guidance
- existing auth and company-context tests stay green

## Out of scope

- profile editing
- membership role editing
- invitation revoke/resend
- destructive system-admin actions
