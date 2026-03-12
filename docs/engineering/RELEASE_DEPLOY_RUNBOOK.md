# RELEASE_DEPLOY_RUNBOOK

## Purpose

Use this runbook when you want a versioned self-host deployment instead of an internal maintenance sync.

## Release flow

1. Make sure `main` is green.
2. Create a tag like `v0.2.0`.
3. Publish a GitHub Release from that tag.
4. GitHub Actions `Self-Host Release Deploy` runs automatically.
5. Check the workflow result and the server smoke check.
6. Confirm the deployed version on the server via `.release-version`.

## Notes

- `Self-Host Deploy` remains the manual workflow for internal maintenance.
- `Self-Host Release Deploy` is the versioned lane for traceable operational deploys.
- Release tags must start with `v`.
