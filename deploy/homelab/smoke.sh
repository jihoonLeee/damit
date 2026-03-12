#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
HEALTH_URL="$APP_URL/api/v1/health"

echo "Checking $HEALTH_URL"
curl --fail --silent --show-error "$HEALTH_URL"
echo
echo "Smoke check passed."
