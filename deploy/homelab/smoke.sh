#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$APP_ROOT/deploy/homelab/.env"
EXPECTED_STORAGE_ENGINE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --expect-storage-engine)
      EXPECTED_STORAGE_ENGINE="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: bash deploy/homelab/smoke.sh [--env-file deploy/homelab/.env] [--expect-storage-engine SQLITE]"
      exit 1
      ;;
  esac
done

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

APP_PORT="${APP_PORT:-3000}"
APP_URL="${APP_URL:-http://127.0.0.1:${APP_PORT}}"
HEALTH_URL="$APP_URL/api/v1/health"

echo "Checking $HEALTH_URL"
HEALTH_BODY="$(curl --fail --silent --show-error "$HEALTH_URL")"
echo "$HEALTH_BODY"

if [[ -n "$EXPECTED_STORAGE_ENGINE" ]]; then
  echo "$HEALTH_BODY" | grep -q "\"storageEngine\":\"$EXPECTED_STORAGE_ENGINE\"" || {
    echo "Expected storageEngine=$EXPECTED_STORAGE_ENGINE but got:"
    echo "$HEALTH_BODY"
    exit 1
  }
fi

echo
echo "Smoke check passed."
