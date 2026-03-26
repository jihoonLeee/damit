# SELF_HOST_OPERATIONAL_SCHEMA_DEPLOY_VERIFICATION

Date: 2026-03-13
PM Verdict: `GO`

## What was verified

- the self-host Ubuntu runtime was redeployed with SQLite operational schema bootstrap enabled
- a post-deploy smoke request to `/api/v1/health` succeeded
- the self-host SQLite database was inspected directly at `/home/jihoon/damit/data/app.sqlite`

## Required operational tables

All required tables now exist immediately after boot:

- `users`
- `companies`
- `memberships`
- `login_challenges`
- `sessions`
- `invitations`
- `customer_confirmation_links`
- `customer_confirmation_events`

## Current self-host data snapshot

- `job_cases`: 1
- `field_records`: 2
- `agreement_records`: 1
- `timeline_events`: 4
- `audit_logs`: 0
- `companies`: 0
- `memberships`: 0
- `users`: 0
- `sessions`: 0

## PM interpretation

This self-host runtime is now provisioned as one operational SQLite product on boot.

That does not mean public production is done.
It means the single-node operational baseline is now internally consistent and easier to inspect, back up, and reason about.
