# OPS_HARDENING_PHASE1

## Purpose

Start the move from pilot-grade local operation to a stronger single-node operational version.

## PM scope for this batch

This phase focuses on visibility and operability, not architecture expansion.

## Included in this batch

- GitHub Actions self-host deploy path redesigned for Tailscale
- admin ops snapshot endpoint added
- recent backup visibility added
- small internal ops console added at `/ops`

## New admin surface

- `GET /api/v1/admin/ops-snapshot`
- `GET /ops`

## Why this matters

A production-like single-node environment needs quick answers to:

- is the app healthy
- how many records are in the system
- when was the latest backup created
- which runtime mode is active

## PM next recommendation

After this batch, the next best move is:

1. clean Korean copy and remove remaining pilot phrasing from operator views
2. add restart and recovery runbook checks to the ops console flow
3. harden log guidance and retention for self-host operation
