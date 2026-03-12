# TAILSCALE_ACCESS_RUNBOOK

## Purpose

Expose the Ubuntu self-host environment safely for private pilot access without opening router ports.

## PM recommendation

Use Tailscale first when:

- access is limited to you or a few trusted testers
- low-friction, low-risk remote access matters more than public marketing polish
- the service should remain clearly separate from public production

## Target model

- app keeps listening on the Ubuntu host
- no direct router port-forwarding is required
- access happens through the Tailscale network
- private pilot users join through Tailscale or access via an approved private route

## Setup sequence

1. install Tailscale on the Ubuntu server
2. start and enable `tailscaled`
3. run `tailscale up`
4. authenticate the node into your Tailscale network
5. verify the Ubuntu server gets a Tailscale IP
6. decide one of two access modes:
   - SSH tunnel over the Tailscale IP
   - direct app access over the Tailscale IP if host firewall and bind policy allow it

## Recommended access pattern

For the current app, PM recommends this order:

1. Tailscale IP + SSH tunnel to the app port
2. only if needed, Tailscale IP direct access to the app port

Why:

- it keeps the app port private by default
- it preserves the strongest boundary for a private pilot
- it avoids broadening exposure before production hardening

## Validation checklist

- `tailscaled` is active
- `tailscale status` returns a logged-in node
- the server has a Tailscale IP
- SSH over Tailscale works
- `/api/v1/health` works through the chosen access path
- app remains unavailable on the public internet unless explicitly intended

## PM rule

Mark Tailscale access `GO` only if:

- authentication succeeds cleanly
- access works without weakening the current private-pilot posture
- router port-forwarding remains unnecessary
