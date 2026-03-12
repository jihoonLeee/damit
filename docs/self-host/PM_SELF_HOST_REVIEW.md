# PM_SELF_HOST_REVIEW

Date: 2026-03-12

## Scope

Evaluate whether a home Ubuntu server is a reasonable next deployment step.

## PM assessment

### Why this is worth doing

- it gives a low-cost always-on environment outside the dev machine
- it supports private demos and trusted-user pilot access
- it keeps momentum without forcing an early production infrastructure decision

### Why this should stay separate from production

- home internet and power are not production-grade
- ops burden rises quickly once the service is fully public
- the team still has staging and Postgres proof gaps

## PM decision

- self-hosted Ubuntu deployment: `GO for private pilot`
- self-hosted Ubuntu as public production: `HOLD`

## Required boundaries

- document this track separately from production
- keep runtime on `SQLite` for now
- do not market this environment as public production
- prefer tunnel-based access over router port-forwarding

## Next best step

1. prepare Ubuntu deployment assets
2. deploy privately on the home server
3. validate health, P0 flow, and restore drill
4. choose Tailscale or Cloudflare Tunnel for access
