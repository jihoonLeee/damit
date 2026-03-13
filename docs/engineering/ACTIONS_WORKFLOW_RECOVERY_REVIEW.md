# ACTIONS_WORKFLOW_RECOVERY_REVIEW

## PM verdict

GO

## Why this batch existed

The self-host deploy workflow had regressed in two ways:

1. GitHub could not dispatch the workflow because the YAML logic was malformed
2. the deploy path still depended on brittle SSH agent behavior across steps

## What changed

- workflow conditions were moved back to a dispatch-safe shape
- the self-host deploy path now uses a direct deploy key file for `rsync`, `ssh`, and `scp`
- manual dispatch is healthy again
- release deploy workflow was aligned with the same key handling pattern
- OAuth-based Tailscale connection is now the active deployment path

## Evidence

- workflow: `.github/workflows/self-host-deploy.yml`
- workflow: `.github/workflows/self-host-release-deploy.yml`
- successful OAuth run: `23032844181`
- URL: `https://github.com/jihoonLeee/damit/actions/runs/23032844181`

## PM close-out

The self-host deployment path is healthy again.
The previous Tailscale deprecation warning is no longer present in the successful working path.
