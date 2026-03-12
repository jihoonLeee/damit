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
- project-local `skills/` definitions that belong to this repository workflow

## What must never be committed

- real `.env` files
- live `OWNER_TOKEN` values
- live `DATABASE_URL` values
- live mail provider keys
- SQLite DB files
- uploaded files
- backup artifacts
- local tool state such as `.fly-config/`
- personal keys or machine-specific secret exports

## PM note on skills

Repository-local skills should be versioned with the project because they are part of the team workflow.
Personal or system-level skills outside the repository should stay out of Git.

## Branch recommendation

- default branch: `main`
- feature branches: `codex/<topic>`

## Recommended GitHub repository settings

- repository type: `private`
- branch protection on `main` after the first stable setup
- require CI to pass before merge once collaboration increases

## GitHub Actions included

- CI workflow for core regression checks
- manual self-host deployment workflow through Tailscale

## Secrets to prepare

For self-host deployment workflow:

- `TAILSCALE_AUTHKEY`
- `SELF_HOST_TAILNET_HOST`
- `SELF_HOST_SSH_PORT`
- `SELF_HOST_SSH_USER`
- `SELF_HOST_SSH_KEY`
- `SELF_HOST_APP_DIR`

See [GITHUB_ACTIONS_SELF_HOST_SETUP.md](GITHUB_ACTIONS_SELF_HOST_SETUP.md).

The workflow assumes the server already has a valid `deploy/homelab/.env` file.
