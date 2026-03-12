# GITHUB_ACTIONS_SELF_HOST_SETUP

## Goal

Make the self-host deploy workflows usable today and easier to maintain as GitHub Actions and Tailscale evolve.

## PM decision

The Ubuntu server remains private and reachable through Tailscale, so GitHub-hosted runners must join the tailnet before SSH.

## Secret strategy

Prefer OAuth client secrets for Tailscale.
Keep the existing auth key only as a temporary fallback so deploys do not break during migration.

## Required repository secrets

### Required now

- `SELF_HOST_TAILNET_HOST`
- `SELF_HOST_SSH_PORT`
- `SELF_HOST_SSH_USER`
- `SELF_HOST_SSH_KEY`
- `SELF_HOST_APP_DIR`

### Tailscale authentication

Preferred:

- `TAILSCALE_OAUTH_CLIENT_ID`
- `TAILSCALE_OAUTH_SECRET`
- `TAILSCALE_TAGS`

Temporary fallback:

- `TAILSCALE_AUTHKEY`

## Recommended values for this project

- `SELF_HOST_TAILNET_HOST`: `100.68.88.16`
- `SELF_HOST_SSH_PORT`: `22`
- `SELF_HOST_SSH_USER`: `jihoon`
- `SELF_HOST_APP_DIR`: `/home/jihoon/damit/app`
- `TAILSCALE_TAGS`: `tag:ci`

## `SELF_HOST_SSH_KEY`

Use the private SSH key that matches the public key already trusted by the Ubuntu server.
For CI, use a dedicated deploy key with no passphrase.

Do not commit this key.
Paste it only into the GitHub secret field.

## Exact GitHub UI setup steps

Repository:

- [https://github.com/jihoonLeee/damit](https://github.com/jihoonLeee/damit)

Open:

1. `Settings`
2. `Secrets and variables`
3. `Actions`
4. `New repository secret`

## Secrets to create

### 1. `SELF_HOST_TAILNET_HOST`

Value:

- `100.68.88.16`

### 2. `SELF_HOST_SSH_PORT`

Value:

- `22`

### 3. `SELF_HOST_SSH_USER`

Value:

- `jihoon`

### 4. `SELF_HOST_APP_DIR`

Value:

- `/home/jihoon/damit/app`

### 5. `SELF_HOST_SSH_KEY`

Value:

- full contents of the CI deploy key trusted by the Ubuntu server

### 6. `TAILSCALE_TAGS`

Value:

- `tag:ci`

### 7. Preferred Tailscale secrets

- `TAILSCALE_OAUTH_CLIENT_ID`
- `TAILSCALE_OAUTH_SECRET`

### 8. Legacy fallback secret

- `TAILSCALE_AUTHKEY`

## Tailscale OAuth client setup

Official reference:

- [tailscale/github-action README](https://github.com/tailscale/github-action)
- [GitHub Marketplace: Connect Tailscale](https://github.com/marketplace/actions/connect-tailscale)

Recommended process:

1. Open the Tailscale admin console.
2. Create an OAuth client for CI use.
3. Give it writable `auth_keys` scope.
4. Ensure it is allowed to create nodes with `tag:ci` or a tag you own.
5. Save the client ID as `TAILSCALE_OAUTH_CLIENT_ID`.
6. Save the client secret as `TAILSCALE_OAUTH_SECRET`.
7. Save `tag:ci` as `TAILSCALE_TAGS` unless you intentionally use a different tag.

## Temporary auth key fallback

If OAuth secrets are not present yet, the workflows still fall back to `TAILSCALE_AUTHKEY`.
This keeps deploys working, but Tailscale marks `authkey` as deprecated for this GitHub Action path.

## Workflow behavior

The workflows now do this:

1. check out the repository with `actions/checkout@v5`
2. join the tailnet through OAuth client secrets when present
3. fall back to auth key only when OAuth secrets are missing
4. start `ssh-agent` with an inline shell step instead of a deprecated third-party action
5. trust the server host key
6. sync the repo with `rsync`
7. run the self-host deploy script
8. run the self-host smoke script

The workflow still protects the server-side `deploy/homelab/.env` file during `rsync --delete`.

## How to run after secrets are set

1. Open repository `Actions`
2. Select `Self-Host Deploy`
3. Click `Run workflow`
4. Run it on `main`

## Success criteria

A healthy run should:

- join Tailscale successfully
- SSH into the Ubuntu server
- sync the repository
- run `deploy/homelab/deploy.sh`
- run `deploy/homelab/smoke.sh`
- avoid Node 20 warnings from checkout and ssh-agent

## PM note

This remains the correct deployment shape for a private self-host environment.
It is still separate from public production.
