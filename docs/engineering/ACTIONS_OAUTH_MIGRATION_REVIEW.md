# ACTIONS_OAUTH_MIGRATION_REVIEW

## PM verdict

PARTIAL GO

## What is complete

- self-host workflows support OAuth-based Tailscale configuration in code
- workflow bootstrap is being normalized so manual dispatch and release deploy stay healthy
- CI and self-host deploy flow now align with the production-consolidation direction

## What is still blocking the warning cleanup

The repository does not yet contain these secrets:

- `TAILSCALE_OAUTH_CLIENT_ID`
- `TAILSCALE_OAUTH_SECRET`

GitHub repository secret inspection on 2026-03-13 showed only:

- `TAILSCALE_AUTHKEY`
- self-host SSH/path secrets

Because of that, the latest workflow run still used the auth-key fallback path and produced the Tailscale deprecation warning.

## Evidence

- workflow run: `23030979936`
- observed path: `Join Tailscale network (Auth key fallback)`
- observed annotation: deprecated `authkey` input warning

## PM recommendation

- keep OAuth-first and authkey-fallback workflow behavior until the missing secrets are added
- do **not** remove fallback yet, because that would break working self-host deploys
- add the missing OAuth client secrets in GitHub
- rerun `Self-Host Deploy`
- only then mark OAuth migration as fully complete
