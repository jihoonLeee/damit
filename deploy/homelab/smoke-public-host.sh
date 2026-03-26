#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-}"

if [[ -z "$HOST" ]]; then
  echo "Usage: bash deploy/homelab/smoke-public-host.sh preview.damit.kr"
  exit 1
fi

BASE_URL="https://${HOST}"

check() {
  local path="$1"
  local url="${BASE_URL}${path}"
  echo "Checking ${url}"
  curl --fail --silent --show-error --location "$url" >/dev/null
}

check "/"
check "/login"
check "/api/v1/health"

echo "Public smoke passed for ${BASE_URL}"
