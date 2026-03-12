# PM_TAILSCALE_REVIEW

Date: 2026-03-12

## Scope

Evaluate Tailscale as the next trusted-access step for the Ubuntu self-host environment.

## PM judgment

- Tailscale is the best next step for private pilot access
- it is more conservative and less stressful than router port-forwarding
- it matches the current product maturity better than a broader public URL path

## Why this is a good fit now

- the app is healthy on the Ubuntu server
- self-host is intentionally separate from public production
- the current need is safe remote access, not open internet distribution

## Decision

- Tailscale trusted access: `GO`
- direct router exposure: `not recommended by default`
- public production equivalence: `HOLD`

## Next step after setup

- verify health through Tailscale access
- keep the app in private pilot mode
- only revisit broader exposure once pilot usage justifies it
