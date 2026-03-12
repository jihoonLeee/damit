# GITHUB_REPOSITORY_SETUP

## Purpose

Prepare this repository to be safely managed on GitHub.

## PM decision

GitHub management is now recommended because:

- the product has grown beyond a single local prototype
- documentation and implementation now need durable history
- self-host, local, and future production tracks should be traceable
- CI and release discipline are now worth the overhead

## What is safe to commit

- source code
- docs
- specs
- deployment templates
- GitHub workflow files
- example environment files with placeholders only

## What must never be committed

- real `.env` files
- live `OWNER_TOKEN` values
- live `DATABASE_URL` values
- live mail provider keys
- SQLite DB files
- uploaded files
- backup artifacts
- local tool state such as `.fly-config/`

## Branch recommendation

- default branch: `main`
- feature branches: `codex/<topic>`

## Recommended GitHub repository settings

- repository type: `private`
- branch protection on `main` after the first stable setup
- require CI to pass before merge once collaboration increases

## GitHub Actions included

- CI workflow for core regression checks
- manual self-host deployment workflow template

## Secrets to prepare later

For self-host deployment workflow:

- `SELF_HOST_SSH_HOST`
- `SELF_HOST_SSH_PORT`
- `SELF_HOST_SSH_USER`
- `SELF_HOST_SSH_KEY`
- `SELF_HOST_APP_DIR`

The workflow assumes the server already has a valid `deploy/homelab/.env` file.