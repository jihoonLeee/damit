# Self-Host Track

## Purpose

This track is for a home Ubuntu server deployment that is separate from full public production.

Use this track when the goal is:

- internal demos
- private operator testing
- small trusted pilot access
- low-cost hosting experiments

Do not treat this track as the same thing as public production.

## PM decision

Current PM posture:

- local runtime: `GO`
- self-host on Ubuntu: `GO for private pilot`
- staging Postgres runtime: `HOLD`
- public production cutover: `HOLD`

## What this track optimizes for

- low cost
- operational simplicity
- fast iteration
- safer exposure than direct public app-port publishing

## What this track does not claim

- high availability
- managed failover
- formal production security posture
- public internet scale

## Recommended deployment shape

1. Ubuntu server in the home network
2. Docker Compose deployment
3. SQLite runtime retained
4. uploads stored on local disk
5. reverse exposure through a tunnel or private network layer

Preferred exposure order:

1. Tailscale
2. Cloudflare Tunnel
3. router port-forwarding only as a last resort

## Documents in this track

- [UBUNTU_DEPLOYMENT_RUNBOOK.md](UBUNTU_DEPLOYMENT_RUNBOOK.md)
- [EXPOSURE_OPTIONS.md](EXPOSURE_OPTIONS.md)
- [PM_SELF_HOST_REVIEW.md](PM_SELF_HOST_REVIEW.md)
- [TAILSCALE_ACCESS_RUNBOOK.md](TAILSCALE_ACCESS_RUNBOOK.md)
- [PM_TAILSCALE_REVIEW.md](PM_TAILSCALE_REVIEW.md)
- [TAILSCALE_HANDOFF.md](TAILSCALE_HANDOFF.md)

## Deployment assets

- [../../deploy/homelab/docker-compose.yml](../../deploy/homelab/docker-compose.yml)
- [../../deploy/homelab/.env.example](../../deploy/homelab/.env.example)
- [../../deploy/homelab/backup.sh](../../deploy/homelab/backup.sh)