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

### `SELF_HOST_SSH_KEY`

Use the private SSH key that matches the public key already trusted by the Ubuntu server.

## Workflow path

The workflow now does this:

1. checks out the repository
2. joins the tailnet with Tailscale
3. starts an SSH agent
4. trusts the server host key
5. syncs the repo with `rsync`
6. runs the self-host deploy script
7. runs the self-host smoke script

## Current blocker

GitHub repository secrets still need to be entered before the workflow can run end to end.
The workflow file is ready, but the secrets cannot be committed and must be added in GitHub settings.

## PM note

This is the correct deployment shape for a private self-host environment.
It is still not the same thing as public production.
