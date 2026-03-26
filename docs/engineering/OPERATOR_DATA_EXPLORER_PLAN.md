# OPERATOR_DATA_EXPLORER_PLAN

## Goal

Give operators two safe ways to inspect live single-node data without dropping into ad-hoc shell work every time.

## PM decision

Add:

- a read-only operator SQLite inspection script for server-side use
- a lightweight admin data explorer section inside `/ops`

Do not add write controls or raw SQL execution in this batch.

## Why now

Current `/ops` is strong on health, signals, backups, and recent activity.
Operators still need a fast answer to questions like:

- what job cases actually exist right now?
- which confirmation links are still open?
- are auth and membership tables populated yet?
- what does the latest timeline look like?

## Scope

### Script

- file under `scripts/`
- reads the configured SQLite file path
- prints counts for key tables
- prints recent rows for a small set of operational tables
- safe defaults and optional table filter

### Admin explorer UI

- new read-only section in `/ops`
- small dataset switcher
- per-dataset count and recent rows
- focused on operational tables, not every internal table

### Backend

- add a read-only admin endpoint for explorer data
- reuse `systemRepository` so SQLite and Postgres stay aligned

## Initial datasets

- `job_cases`
- `field_records`
- `agreement_records`
- `customer_confirmation_links`
- `timeline_events`
- `users`
- `memberships`
- `audit_logs`

## Non-goals

- no inline editing
- no raw SQL runner
- no destructive actions
- no pagination-heavy back office in this batch

## PM success criteria

- operator can inspect the most important product tables from `/ops`
- server-side script provides the same view over SSH
- output is safe, readable, and clearly operational rather than developer-only
