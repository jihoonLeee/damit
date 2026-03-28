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
HEALTH_WAIT_SECONDS="${HEALTH_WAIT_SECONDS:-60}"
HEALTH_RETRY_INTERVAL_SECONDS="${HEALTH_RETRY_INTERVAL_SECONDS:-2}"

echo "Checking $HEALTH_URL"
HEALTH_BODY=""
HEALTH_ERROR=""
deadline=$((SECONDS + HEALTH_WAIT_SECONDS))

while true; do
  if HEALTH_BODY="$(curl --fail --silent --show-error "$HEALTH_URL" 2>&1)"; then
    break
  fi

  HEALTH_ERROR="$HEALTH_BODY"
  if (( SECONDS >= deadline )); then
    echo "$HEALTH_ERROR"
    exit 1
  fi

  echo "Health endpoint not ready yet. Retrying in ${HEALTH_RETRY_INTERVAL_SECONDS}s..."
  sleep "$HEALTH_RETRY_INTERVAL_SECONDS"
done

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
