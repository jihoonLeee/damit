#!/usr/bin/env bash
set -euo pipefail

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is not installed."
  exit 1
fi

echo "cloudflared binary:"
command -v cloudflared
echo

echo "cloudflared version:"
cloudflared --version
echo

echo "cloudflared service status:"
if systemctl list-unit-files | grep -q '^cloudflared\.service'; then
  systemctl --no-pager --full status cloudflared || true
else
  echo "cloudflared.service not found. You may be using a manual or user-level setup."
fi
