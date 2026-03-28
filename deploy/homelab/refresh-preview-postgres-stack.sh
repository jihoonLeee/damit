#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PREVIEW_ENV_FILE="${PREVIEW_ENV_FILE:-$APP_ROOT/deploy/homelab/.env.preview-postgres}"
PROJECT_NAME="${PROJECT_NAME:-damit-preview-postgres}"
COMPOSE_FILE="$APP_ROOT/deploy/homelab/docker-compose.yml"

if [[ ! -f "$PREVIEW_ENV_FILE" ]]; then
  echo "Preview Postgres env not found at $PREVIEW_ENV_FILE. Rebuilding preview rehearsal env first..."
  bash "$APP_ROOT/deploy/homelab/rehearse-postgres-cutover.sh" --project-name "$PROJECT_NAME"
  exit 0
fi

required_env_keys=(
  DATABASE_URL
  STORAGE_ENGINE
  APP_PORT
  APP_BASE_URL
  TRUSTED_ORIGINS
)

for key in "${required_env_keys[@]}"; do
  if ! grep -Eq "^${key}=.+" "$PREVIEW_ENV_FILE"; then
    echo "Preview Postgres env at $PREVIEW_ENV_FILE is missing $key. Rebuilding preview rehearsal env first..."
    bash "$APP_ROOT/deploy/homelab/rehearse-postgres-cutover.sh" --project-name "$PROJECT_NAME"
    exit 0
  fi
done

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Docker Compose is not available."
  exit 1
fi

COMPOSE_ARGS=(-f "$COMPOSE_FILE" --env-file "$PREVIEW_ENV_FILE" -p "$PROJECT_NAME")

echo "Refreshing preview Postgres stack from latest synced code..."
bash "$APP_ROOT/deploy/homelab/deploy.sh" --env-file "$PREVIEW_ENV_FILE" --project-name "$PROJECT_NAME"

echo
echo "Running preview Postgres migrations..."
"${COMPOSE_CMD[@]}" "${COMPOSE_ARGS[@]}" exec -T app node scripts/migrate-postgres.mjs

echo
echo "Running preview Postgres smoke..."
bash "$APP_ROOT/deploy/homelab/smoke-postgres-runtime.sh" --env-file "$PREVIEW_ENV_FILE" --project-name "$PROJECT_NAME"

echo
echo "Preview Postgres stack refresh completed."
