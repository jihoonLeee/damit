# SSH_HANDOFF_CHECKLIST

## Goal

Provide the minimum information needed so the deployment can be executed remotely over SSH.

## What I need from you

- server public IP or DDNS hostname
- SSH username
- SSH port if not `22`
- auth method:
  - private key file path on this machine, or
  - password if you intend to type it yourself during an interactive login
- target deployment directory on the server if different from `/srv/damit/app`

## Recommended SSH posture

- key-based auth only
- password login disabled after setup
- root login disabled
- non-root sudo user used for deployment

## Optional but helpful

- whether Docker is already installed
- whether UFW is already enabled
- whether Tailscale or Cloudflare Tunnel is already installed

## After handoff

Once the SSH details are available, the next steps are:

1. verify SSH connectivity
2. verify Docker and filesystem layout
3. copy or sync the repo to the server
4. create `deploy/homelab/.env`
5. run [../../deploy/homelab/deploy.sh](../../deploy/homelab/deploy.sh)
6. run [../../deploy/homelab/smoke.sh](../../deploy/homelab/smoke.sh)
7. decide on Tailscale or Cloudflare Tunnel exposure
