# EXPOSURE_OPTIONS

## PM recommendation

For a home server, avoid exposing the app by raw router port-forwarding as the default path.

Recommended order:

1. Tailscale
2. Cloudflare Tunnel
3. direct port-forwarding only as a fallback

## Option 1. Tailscale

Best when:

- only you or a few trusted testers need access
- you want the safest and least stressful setup

Strengths:

- no direct public app-port exposure
- simple private access model
- good fit for internal demos and trusted pilot sessions

Tradeoffs:

- each tester needs Tailscale access
- less suitable for frictionless public customer access

PM judgment:

- strongest option for early private pilot use

## Option 2. Cloudflare Tunnel

Best when:

- you want a public URL without opening inbound router ports
- you want easier external testing for a small number of users

Strengths:

- no raw port-forwarding on the router
- cleaner public URL experience
- better operational posture than exposing the app port directly

Tradeoffs:

- requires Cloudflare setup
- adds one more service dependency

PM judgment:

- best compromise for a small external pilot

## Option 3. Direct router port-forwarding

Best when:

- you understand the operational risk
- you are willing to harden the host and own the exposure

Minimum guardrails:

- do not expose the app port directly if it can be avoided
- use a reverse proxy if you must publish
- lock down SSH to key auth only
- disable password SSH login
- enable UFW
- add fail2ban or equivalent
- keep the host patched

Key risks:

- home IP changes or ISP limitations
- higher attack surface
- more maintenance burden than the product currently justifies

PM judgment:

- technically possible, but not the default recommendation

## Final recommendation

- private pilot: Tailscale
- small external pilot: Cloudflare Tunnel
- router port-forwarding: only with deliberate opt-in and hardening
