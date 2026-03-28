#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${APP_ROOT}/deploy/homelab/.env.preview-postgres"
PROJECT_NAME="${PROJECT_NAME:-damit-preview-postgres}"
COMPOSE_FILE="${APP_ROOT}/deploy/homelab/docker-compose.yml"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --project-name)
      PROJECT_NAME="${2:-}"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    *)
      break
      ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

if [[ $# -eq 0 ]]; then
  echo "Usage: bash deploy/homelab/run-preview-postgres-command.sh [--env-file ...] [--project-name ...] -- <command...>"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Docker Compose is not available."
  exit 1
fi

COMPOSE_ARGS=(-f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME")

"${COMPOSE_CMD[@]}" "${COMPOSE_ARGS[@]}" exec -T app "$@"
