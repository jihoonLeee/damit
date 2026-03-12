# LOCAL_OPERATIONAL_VERSION_PLAN

## PM answer

Yes, pushing beyond a pilot-only local setup is a good direction, but only if we define the target honestly.

The right target is not “full production on a laptop.”
The right target is “single-node production-like operation.”

## What PM means by production-like local operation

A stronger local or self-host runtime with:

- stable auth
- repeatable backups and restores
- safer remote access
- cleaner operator workflows
- documented startup and recovery steps

## What it is not yet

- multi-region
- managed HA
- public production scale
- full enterprise security posture

## Recommended near-term target

### Phase 1. Single-node operational hardening

- keep `SQLite`
- keep self-host on Ubuntu
- keep Tailscale-based trusted access
- finish Korean copy cleanup in the main workspace
- add restart and recovery checklists

### Phase 2. Single-node production-like quality

- remove remaining pilot wording from the operator path
- tighten auth defaults
- add a small admin dashboard for health, backups, and resets
- add stronger structured logs and log retention guidance

### Phase 3. Real production transition

- Postgres runtime proof
- object storage
- stronger multi-tenant controls
- public deployment path

## PM conclusion

Going straight from today’s state to “full production” would be premature.
Going from today’s state to a strong single-node operational version is the right move.

That should be the next major direction after GitHub management is in place.