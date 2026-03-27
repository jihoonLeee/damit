#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="${APP_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
STAMP="$(date +%Y%m%d-%H%M%S)"

cd "$APP_ROOT"
node scripts/local-restore-rehearsal.mjs

echo "local restore rehearsal completed at $STAMP"
