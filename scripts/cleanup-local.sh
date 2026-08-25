#!/usr/bin/env bash
set -euo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"
docker compose --env-file .env.local down --remove-orphans 2>/dev/null || docker compose down --remove-orphans 2>/dev/null || true
rm -f .env.local
kubectl delete namespace platform-system --ignore-not-found 2>/dev/null || true
