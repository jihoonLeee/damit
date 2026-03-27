#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$APP_ROOT/deploy/homelab/.env.preview-postgres"
PROJECT_NAME="${PROJECT_NAME:-damit-preview-postgres}"
COMPOSE_FILE="$APP_ROOT/deploy/homelab/docker-compose.yml"

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
    *)
      echo "Unknown argument: $1"
      echo "Usage: bash deploy/homelab/rollback-to-sqlite.sh [--env-file deploy/homelab/.env.preview-postgres] [--project-name damit-preview-postgres]"
      exit 1
      ;;
  esac
done

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Docker Compose is not available."
  exit 1
fi

COMPOSE_ARGS=(-f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME")

if [[ -f "$ENV_FILE" ]]; then
  "${COMPOSE_CMD[@]}" "${COMPOSE_ARGS[@]}" down --remove-orphans || true
  echo "Stopped preview Postgres rehearsal stack."
else
  echo "Env file $ENV_FILE is missing. Nothing to stop with that env file."
fi

echo
echo "Next manual step:"
echo "  1. point preview.damit.kr back to 127.0.0.1:3210 in /etc/cloudflared/config.yml"
echo "  2. restart cloudflared"
echo "  3. curl https://preview.damit.kr/api/v1/health and confirm storageEngine=SQLITE"
