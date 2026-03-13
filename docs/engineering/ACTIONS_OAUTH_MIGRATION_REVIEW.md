# ACTIONS_OAUTH_MIGRATION_REVIEW

## PM verdict

PARTIAL GO

## What is complete

- self-host workflows support OAuth-based Tailscale configuration in code
- workflow bootstrap was normalized so manual dispatch and release deploy stay healthy
- GitHub Actions self-host deploy recovered and completed successfully
- CI and self-host deploy flow now align with the production-consolidation direction

## Latest working evidence

- workflow run: `23032231660`
- result: `success`
- URL: `https://github.com/jihoonLeee/damit/actions/runs/23032231660`
- current path used: `Join Tailscale network (Auth key fallback)`

## What is still blocking the warning cleanup

The repository still does not contain these secrets:

- `TAILSCALE_OAUTH_CLIENT_ID`
- `TAILSCALE_OAUTH_SECRET`

GitHub repository secret inspection on 2026-03-13 showed only:

- `TAILSCALE_AUTHKEY`
- self-host SSH/path secrets

Because of that, the latest successful workflow run still used the auth-key fallback path and produced the Tailscale deprecation warning.

## PM recommendation

- keep OAuth-first and authkey-fallback workflow behavior until the missing secrets are added
- do **not** remove fallback yet, because that would break working self-host deploys
- add the missing OAuth client secrets in GitHub
- rerun `Self-Host Deploy`
- only then mark OAuth migration as fully complete
