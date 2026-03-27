#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BASE_ENV_FILE="$APP_ROOT/deploy/homelab/.env"
PREVIEW_ENV_FILE="$APP_ROOT/deploy/homelab/.env.preview-postgres"
PROJECT_NAME="${PROJECT_NAME:-damit-preview-postgres}"
PREVIEW_HOST="${PREVIEW_HOST:-preview.damit.kr}"
PREVIEW_PORT="${PREVIEW_PORT:-3211}"
PREVIEW_CONTAINER_NAME="${PREVIEW_CONTAINER_NAME:-damit-homelab-preview-postgres}"
PREVIEW_DATA_DIR="${PREVIEW_DATA_DIR:-$APP_ROOT/data-preview-postgres}"
COMPOSE_FILE="$APP_ROOT/deploy/homelab/docker-compose.yml"

if [[ ! -f "$BASE_ENV_FILE" ]]; then
  echo "Missing $BASE_ENV_FILE"
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

COMPOSE_ARGS=(-f "$COMPOSE_FILE" --env-file "$PREVIEW_ENV_FILE" -p "$PROJECT_NAME")

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  if grep -q "^${key}=" "$file"; then
    sed -i "s#^${key}=.*#${key}=${value}#g" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

cp "$BASE_ENV_FILE" "${BASE_ENV_FILE}.bak.preview-postgres.$(date +%Y%m%d%H%M%S)"
cp "$BASE_ENV_FILE" "$PREVIEW_ENV_FILE"

set_env_value "$PREVIEW_ENV_FILE" "APP_ENV_FILE" ".env.preview-postgres"
set_env_value "$PREVIEW_ENV_FILE" "APP_CONTAINER_NAME" "$PREVIEW_CONTAINER_NAME"
set_env_value "$PREVIEW_ENV_FILE" "APP_HOST_BIND" "127.0.0.1"
set_env_value "$PREVIEW_ENV_FILE" "APP_PORT" "$PREVIEW_PORT"
set_env_value "$PREVIEW_ENV_FILE" "DATA_BIND_DIR" "$PREVIEW_DATA_DIR"
set_env_value "$PREVIEW_ENV_FILE" "APP_BASE_URL" "https://$PREVIEW_HOST"
set_env_value "$PREVIEW_ENV_FILE" "TRUSTED_ORIGINS" "https://$PREVIEW_HOST"
set_env_value "$PREVIEW_ENV_FILE" "STORAGE_ENGINE" "POSTGRES"
set_env_value "$PREVIEW_ENV_FILE" "AUTH_ENFORCE_TRUSTED_ORIGIN" "true"
set_env_value "$PREVIEW_ENV_FILE" "AUTH_DEBUG_LINKS" "false"
set_env_value "$PREVIEW_ENV_FILE" "TRUST_PROXY_HEADERS" "true"

if ! grep -q '^DATABASE_URL=' "$PREVIEW_ENV_FILE"; then
  echo "DATABASE_URL is missing in $PREVIEW_ENV_FILE"
  exit 1
fi

if ! grep -q '^POSTGRES_SSL_MODE=' "$PREVIEW_ENV_FILE"; then
  printf '%s\n' 'POSTGRES_SSL_MODE=require' >> "$PREVIEW_ENV_FILE"
fi

if ! grep -q '^POSTGRES_APPLICATION_NAME=' "$PREVIEW_ENV_FILE"; then
  printf '%s\n' 'POSTGRES_APPLICATION_NAME=damit-preview-postgres' >> "$PREVIEW_ENV_FILE"
fi

if ! grep -q '^POSTGRES_POOL_MAX=' "$PREVIEW_ENV_FILE"; then
  printf '%s\n' 'POSTGRES_POOL_MAX=10' >> "$PREVIEW_ENV_FILE"
fi

mkdir -p "$PREVIEW_DATA_DIR"

echo "Prepared $PREVIEW_ENV_FILE"
echo "Running Postgres readiness, preflight, and migrations..."

"${COMPOSE_CMD[@]}" "${COMPOSE_ARGS[@]}" run --rm app node scripts/postgres-readiness-check.mjs
"${COMPOSE_CMD[@]}" "${COMPOSE_ARGS[@]}" run --rm app node scripts/postgres-preflight.mjs
"${COMPOSE_CMD[@]}" "${COMPOSE_ARGS[@]}" run --rm app node scripts/migrate-postgres.mjs
"${COMPOSE_CMD[@]}" "${COMPOSE_ARGS[@]}" run --rm app node scripts/migration-status.mjs

echo
echo "Deploying preview Postgres rehearsal stack..."
bash "$APP_ROOT/deploy/homelab/deploy.sh" --env-file "$PREVIEW_ENV_FILE" --project-name "$PROJECT_NAME"

echo
echo "Running local smoke..."
bash "$APP_ROOT/deploy/homelab/smoke-postgres-runtime.sh" --env-file "$PREVIEW_ENV_FILE" --project-name "$PROJECT_NAME"

echo
echo "Next manual step:"
echo "  1. point preview.damit.kr to 127.0.0.1:$PREVIEW_PORT in /etc/cloudflared/config.yml"
echo "  2. restart cloudflared"
echo "  3. curl https://$PREVIEW_HOST/api/v1/health"
