#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "[deploy] Pulling latest changes from origin/master..."
git pull --ff-only origin master

echo "[deploy] Rebuilding and starting containers..."
docker compose up -d --build --pull never

echo "[deploy] Container status:"
docker compose ps

echo "[deploy] Health check:"
curl -fsS http://127.0.0.1:8101/api/status
echo
