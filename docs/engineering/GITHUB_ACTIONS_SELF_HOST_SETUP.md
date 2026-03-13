# GITHUB_ACTIONS_SELF_HOST_SETUP

## Goal

Make GitHub Actions deploy to the Ubuntu self-host environment through Tailscale using OAuth client credentials and an SSH deploy key.

## Required repository secrets

- `TAILSCALE_OAUTH_CLIENT_ID`
- `TAILSCALE_OAUTH_SECRET`
- `TAILSCALE_TAGS` (recommended: `tag:ci`)
- `SELF_HOST_TAILNET_HOST`
- `SELF_HOST_SSH_PORT`
- `SELF_HOST_SSH_USER`
- `SELF_HOST_SSH_KEY`
- `SELF_HOST_APP_DIR`

## Temporary fallback

If OAuth client secrets are not yet present, the current workflows still fall back to:

- `TAILSCALE_AUTHKEY`

This fallback is temporary and exists only to keep the working self-host deploy path healthy.
Once OAuth secrets are added and verified, the fallback should be removed.

## Recommended values

- `SELF_HOST_TAILNET_HOST`: the Ubuntu server Tailscale IPv4 or stable MagicDNS name
- `SELF_HOST_SSH_PORT`: `22`
- `SELF_HOST_SSH_USER`: deployment account on the Ubuntu server
- `SELF_HOST_APP_DIR`: absolute deploy path on the server
- `TAILSCALE_TAGS`: `tag:ci`

## Workflow layout

### Manual maintenance deploy

- workflow: `.github/workflows/self-host-deploy.yml`
- trigger: `workflow_dispatch`
- use case: operational sync, small fixes, internal maintenance

### Release deploy

- workflow: `.github/workflows/self-host-release-deploy.yml`
- trigger: GitHub Release `published`
- use case: versioned deploys only

## Security posture

- preferred path: Tailscale OAuth client credentials
- temporary compatibility path: `TAILSCALE_AUTHKEY` fallback
- GitHub Actions SSH uses a dedicated deploy key, not a personal interactive key
- server `.env` is preserved during sync
- deploy still runs over a private Tailscale route

## Validation

After secrets are set, verify:

1. `Self-Host Deploy` can run successfully from Actions
2. `Self-Host Release Deploy` is available for `v*` releases
3. workflow dispatch remains available
4. once OAuth secrets are present, no Tailscale `authkey` deprecation warning appears in workflow logs
