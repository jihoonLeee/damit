# GITHUB_ACTIONS_SELF_HOST_SETUP

## Goal

Make the self-host deploy workflow actually usable from GitHub Actions.

## PM decision

Because the Ubuntu server is private and reachable through Tailscale, the GitHub workflow must also join the tailnet.

Direct LAN SSH from GitHub-hosted runners is not viable.

## Required repository secrets

- `TAILSCALE_AUTHKEY`
- `SELF_HOST_TAILNET_HOST`
- `SELF_HOST_SSH_PORT`
- `SELF_HOST_SSH_USER`
- `SELF_HOST_SSH_KEY`
- `SELF_HOST_APP_DIR`

## Recommended values for this project

- `SELF_HOST_TAILNET_HOST`: `100.68.88.16`
- `SELF_HOST_SSH_PORT`: `22`
- `SELF_HOST_SSH_USER`: `jihoon`
- `SELF_HOST_APP_DIR`: `/home/jihoon/damit/app`

## Values you must provide manually

### `TAILSCALE_AUTHKEY`

Create a reusable auth key in the Tailscale admin console for GitHub Actions.

Recommended shape:

- reusable key
- tagged or user-scoped for CI use only
- expiry kept short if possible

### `SELF_HOST_SSH_KEY`

Use the private SSH key that matches the public key already trusted by the Ubuntu server.

For this machine, that is the content of:

- `C:\Users\jihoo\.ssh\id_rsa`

Do not commit this key. Paste it only into the GitHub secret field.

## Exact GitHub UI setup steps

Repository:

- [https://github.com/jihoonLeee/damit](https://github.com/jihoonLeee/damit)

Open:

1. `Settings`
2. `Secrets and variables`
3. `Actions`
4. `New repository secret`

Create these secrets one by one:

### 1. `TAILSCALE_AUTHKEY`

Value:

- the auth key you create in Tailscale admin

### 2. `SELF_HOST_TAILNET_HOST`

Value:

- `100.68.88.16`

### 3. `SELF_HOST_SSH_PORT`

Value:

- `22`

### 4. `SELF_HOST_SSH_USER`

Value:

- `jihoon`

### 5. `SELF_HOST_APP_DIR`

Value:

- `/home/jihoon/damit/app`

### 6. `SELF_HOST_SSH_KEY`

Value:

- full contents of `C:\Users\jihoo\.ssh\id_rsa`

## Tailscale auth key creation steps

Open Tailscale admin console and create an auth key for GitHub Actions.

Recommended process:

1. Go to Tailscale admin
2. Open `Settings` or `Keys`
3. Create new auth key
4. Prefer `reusable` for GitHub Actions
5. Copy the generated key immediately
6. Save it as `TAILSCALE_AUTHKEY` in GitHub Actions secrets

## Workflow path

The workflow now does this:

1. checks out the repository
2. joins the tailnet with Tailscale
3. starts an SSH agent
4. trusts the server host key
5. syncs the repo with `rsync`
6. runs the self-host deploy script
7. runs the self-host smoke script

The workflow protects the server-side `deploy/homelab/.env` file during `rsync --delete`, so local secrets stored on the Ubuntu host are not removed on each deploy.

## How to run after secrets are set

1. Open repository `Actions`
2. Select `Self-Host Deploy`
3. Click `Run workflow`
4. Run it on `main`

## What success looks like

The workflow should:

- join Tailscale successfully
- SSH into the Ubuntu server
- sync the repository
- run `deploy/homelab/deploy.sh`
- run `deploy/homelab/smoke.sh`

## Current blocker

The workflow file is ready, but the secrets cannot be committed and must be added in GitHub settings.

## PM note

This is the correct deployment shape for a private self-host environment.
It is still not the same thing as public production.
