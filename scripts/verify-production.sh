#!/bin/sh
set -eu
BACKEND_URL="${BACKEND_URL:-https://self-healing-final.onrender.com}"
FRONTEND_URL="${FRONTEND_URL:-https://self-healing-final-866indtze-giri6305s-projects.vercel.app}"
echo "Checking backend..."
curl --fail --silent --show-error --retry 5 "$BACKEND_URL/actuator/health"
echo
echo "Checking frontend..."
curl --fail --silent --show-error --retry 5 -I "$FRONTEND_URL"
echo
echo "PRODUCTION VERIFICATION PASSED"
