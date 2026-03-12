#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/srv/damit/app}"
DATA_ROOT="${DATA_ROOT:-/srv/damit/data}"
BACKUP_ROOT="${BACKUP_ROOT:-/srv/damit/backups}"

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg ufw fail2ban git

if ! command -v docker >/dev/null 2>&1; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

sudo mkdir -p "$APP_ROOT" "$DATA_ROOT" "$BACKUP_ROOT"
sudo chown -R "$USER":"$USER" /srv/damit

sudo systemctl enable docker
sudo systemctl start docker

sudo ufw allow OpenSSH
sudo ufw --force enable
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

echo "Bootstrap complete."
echo "APP_ROOT=$APP_ROOT"
echo "DATA_ROOT=$DATA_ROOT"
echo "BACKUP_ROOT=$BACKUP_ROOT"
