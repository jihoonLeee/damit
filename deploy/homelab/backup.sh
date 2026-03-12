#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/srv/damit/app"
COMPOSE_FILE="$APP_ROOT/deploy/homelab/docker-compose.yml"
ENV_FILE="$APP_ROOT/deploy/homelab/.env"
STAMP="$(date +%Y%m%d-%H%M%S)"

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Docker Compose is not available."
  exit 1
fi

cd "$APP_ROOT"
"${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T app node scripts/local-restore-rehearsal.mjs

echo "backup-and-restore rehearsal completed at $STAMP"
