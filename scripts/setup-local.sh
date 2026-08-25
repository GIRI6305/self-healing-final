#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

say() { printf '%s\n' "$*"; }

say "Checking required tools..."
command -v java >/dev/null 2>&1 || { say "FAIL: Java 21 is required."; exit 1; }
command -v mvn >/dev/null 2>&1 || { say "FAIL: Maven 3.9+ is required."; exit 1; }
command -v docker >/dev/null 2>&1 || { say "FAIL: Docker CLI is required. Install Docker Desktop and retry."; exit 1; }
command -v curl >/dev/null 2>&1 || { say "FAIL: curl is required."; exit 1; }

say "Checking Docker daemon..."
if ! docker info >/dev/null 2>&1; then
  say "FAIL: Docker CLI is installed, but the Docker daemon is not running."
  say "Start Docker Desktop, wait until Docker is running, then rerun:"
  say "  ./scripts/setup-local.sh"
  exit 1
fi

# Pick a free host port without touching unrelated containers or processes.
port_is_free() {
  local port="$1"
  ! (curl -sS --connect-timeout 0.2 "http://127.0.0.1:${port}" >/dev/null 2>&1 || \
     nc -z 127.0.0.1 "$port" >/dev/null 2>&1)
}

pick_port() {
  local preferred="$1"
  local port
  for port in $(seq "$preferred" $((preferred + 30))); do
    if port_is_free "$port"; then
      printf '%s' "$port"
      return 0
    fi
  done
  return 1
}

# Keep a stable local port selection once chosen. This avoids changing URLs between commands.
if [[ -f .env.local ]]; then
  # shellcheck disable=SC1091
  source .env.local
fi

API_PORT="${API_PORT:-}"
PROMETHEUS_PORT="${PROMETHEUS_PORT:-}"
GRAFANA_PORT="${GRAFANA_PORT:-}"

[[ -n "$API_PORT" ]] || API_PORT="$(pick_port 8080)" || { say "FAIL: No free API port found."; exit 1; }
[[ -n "$PROMETHEUS_PORT" ]] || PROMETHEUS_PORT="$(pick_port 9090)" || { say "FAIL: No free Prometheus port found."; exit 1; }
[[ -n "$GRAFANA_PORT" ]] || GRAFANA_PORT="$(pick_port 3000)" || { say "FAIL: No free Grafana port found."; exit 1; }

cat > .env.local <<ENV
API_PORT=${API_PORT}
PROMETHEUS_PORT=${PROMETHEUS_PORT}
GRAFANA_PORT=${GRAFANA_PORT}
ENV

say "Local ports: API=${API_PORT}, Prometheus=${PROMETHEUS_PORT}, Grafana=${GRAFANA_PORT}"
say "Building application and running tests..."
mvn -q -f backend/pom.xml clean test package

say "Starting local platform with Docker Compose..."
# Remove only this repository's previous Compose resources. Never touch unrelated stacks.
docker compose --env-file .env.local down --remove-orphans >/dev/null 2>&1 || true
docker compose --env-file .env.local up -d --build

BASE_URL="http://localhost:${API_PORT}"
say "Waiting for the API..."
for _ in {1..30}; do
  if curl -fsS "${BASE_URL}/actuator/health" >/dev/null 2>&1; then
    say "Platform started successfully."
    say "API:        ${BASE_URL}"
    say "Prometheus: http://localhost:${PROMETHEUS_PORT}"
    say "Grafana:    http://localhost:${GRAFANA_PORT}"
    exit 0
  fi
  sleep 2
done

say "FAIL: Containers started, but the API did not become healthy within 60 seconds."
say "Run: docker compose --env-file .env.local ps"
say "Run: docker compose --env-file .env.local logs --tail=200 platform-api"
exit 1
