#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$APP_ROOT/deploy/homelab/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

APP_PORT="${APP_PORT:-3000}"
APP_URL="${APP_URL:-http://127.0.0.1:${APP_PORT}}"
HEALTH_URL="$APP_URL/api/v1/health"

echo "Checking $HEALTH_URL"
curl --fail --silent --show-error "$HEALTH_URL"
echo
echo "Smoke check passed."
