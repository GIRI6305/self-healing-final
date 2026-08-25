#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ -f .env.local ]]; then source .env.local; fi
BASE="${BASE_URL:-http://localhost:${API_PORT:-8080}}"
curl -fsS "$BASE/actuator/health"; echo
curl -fsS "$BASE/api/v1/services"; echo
curl -fsS -X POST "$BASE/api/v1/failure" -H 'content-type: application/json' -d '{"enabled":true}'; echo
echo "Incident state:"; curl -fsS "$BASE/api/v1/incidents"; echo
echo "Remediating:"; curl -fsS -X POST "$BASE/api/v1/remediation"; echo
echo "Recovered:"; curl -fsS "$BASE/actuator/health"; echo
