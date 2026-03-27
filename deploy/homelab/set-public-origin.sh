#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$APP_ROOT/deploy/homelab/.env"

HOST=""
MODE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:-}"
      shift 2
      ;;
    --mode)
      MODE="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: bash deploy/homelab/set-public-origin.sh --host preview.damit.kr --mode preview"
      exit 1
      ;;
  esac
done

if [[ -z "$HOST" || -z "$MODE" ]]; then
  echo "Missing --host or --mode"
  echo "Usage: bash deploy/homelab/set-public-origin.sh --host preview.damit.kr --mode preview"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

case "$MODE" in
  preview)
    AUTH_DEBUG_LINKS_VALUE="false"
    ;;
  root)
    AUTH_DEBUG_LINKS_VALUE="false"
    ;;
  *)
    echo "Invalid --mode. Use preview or root."
    exit 1
    ;;
esac

BASE_URL="https://$HOST"
TRUSTED_ORIGINS_VALUE="$BASE_URL"

set_env_value() {
  local key="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"
  grep -v "^${key}=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
}

cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d%H%M%S)"

set_env_value "APP_BASE_URL" "$BASE_URL"
set_env_value "TRUSTED_ORIGINS" "$TRUSTED_ORIGINS_VALUE"
set_env_value "AUTH_ENFORCE_TRUSTED_ORIGIN" "true"
set_env_value "AUTH_DEBUG_LINKS" "$AUTH_DEBUG_LINKS_VALUE"

echo "Updated deploy/homelab/.env"
echo "APP_BASE_URL=$BASE_URL"
echo "TRUSTED_ORIGINS=$TRUSTED_ORIGINS_VALUE"
echo "AUTH_ENFORCE_TRUSTED_ORIGIN=true"
echo "AUTH_DEBUG_LINKS=$AUTH_DEBUG_LINKS_VALUE"
echo
echo "Next:"
echo "  bash deploy/homelab/deploy.sh"
