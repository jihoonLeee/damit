# ACTIONS_OAUTH_MIGRATION_REVIEW

## PM verdict

PARTIAL GO

## What is complete

- self-host workflows now support OAuth-only Tailscale configuration in code
- deprecated auth-key fallback has been removed from workflow definitions
- CI and self-host deploy flow now align with the production-consolidation direction

## What is still blocking the warning cleanup

The repository does not yet contain these secrets:

- TAILSCALE_OAUTH_CLIENT_ID
- TAILSCALE_OAUTH_SECRET

GitHub repository secret inspection on 2026-03-13 showed only:

- TAILSCALE_AUTHKEY
- self-host SSH and path secrets

Because of that, the latest workflow run still used the auth-key fallback path and produced the Tailscale deprecation warning.

## Evidence

- workflow run: 23030979936
- observed path: Join Tailscale network (Auth key fallback)
- observed annotation: deprecated uthkey input warning

## PM recommendation

- keep the updated workflow code as-is
- add the missing OAuth client secrets in GitHub
- rerun Self-Host Deploy
- only then mark OAuth migration as fully complete
