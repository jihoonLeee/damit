# RELEASE_DEPLOY_POLICY

## PM verdict

GO, with separation between internal deploys and versioned release deploys.

## Why

The current manual self-host deploy workflow is useful for internal maintenance and private-pilot iteration.
However, using only a manual workflow for every deployment makes version tracking weaker over time.

## Decision

Use two deployment lanes:

### 1. Internal lane

- workflow: `Self-Host Deploy`
- trigger: manual only
- purpose: internal maintenance, quick fixes, private-pilot syncing

### 2. Versioned release lane

- workflow: `Self-Host Release Deploy`
- trigger: GitHub Release `published`
- gate: release tag must start with `v`
- purpose: versioned operational deploys that should be easy to trace back later

## PM rationale

This keeps operational discipline without blocking day-to-day maintenance.
It also avoids the mistake of making every small internal sync look like a public release.

## Release expectations

For the versioned lane:

- create a tag like `v0.2.0`
- publish a GitHub Release from that tag
- let the release workflow deploy that exact ref
- use release notes as the deployment record

## Future option

If self-host becomes the primary operational lane, the internal manual workflow can be narrowed further or removed.
For now, keeping both is the more conservative choice.
