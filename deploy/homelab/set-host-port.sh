#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$APP_ROOT/deploy/homelab/.env"

PORT="${1:-}"

if [[ -z "$PORT" ]]; then
  echo "Usage: bash deploy/homelab/set-host-port.sh 3210"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  echo "Copy deploy/homelab/.env.example to deploy/homelab/.env first."
  exit 1
fi

set_env_value() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s#^${key}=.*#${key}=${value}#g" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d%H%M%S)"

set_env_value "APP_PORT" "$PORT"

echo "Updated APP_PORT=$PORT in deploy/homelab/.env"
echo "Next:"
echo "  bash deploy/homelab/deploy.sh"
