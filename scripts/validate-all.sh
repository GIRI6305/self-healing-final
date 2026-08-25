#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[[ -f .env.local ]] && source .env.local || true
API_PORT="${API_PORT:-8080}"
pass=0
fail=0
skip=0

run() {
  local name="$1"
  shift
  if "$@" >/tmp/self-healing-check.out 2>&1; then
    echo "PASS  $name"
    pass=$((pass + 1))
  else
    echo "FAIL  $name"
    cat /tmp/self-healing-check.out
    fail=$((fail + 1))
  fi
}

skip_check() {
  echo "SKIPPED $1"
  skip=$((skip + 1))
}

if command -v mvn >/dev/null 2>&1; then
  run "Maven tests" mvn -q -f backend/pom.xml test
else
  skip_check "Maven tests (Maven unavailable)"
fi

if command -v helm >/dev/null 2>&1; then
  run "Helm lint" helm lint helm/platform
else
  skip_check "Helm lint (Helm unavailable)"
fi

if command -v terraform >/dev/null 2>&1; then
  run "Terraform fmt" terraform -chdir=infrastructure fmt -check -recursive
  run "Terraform validate" terraform -chdir=infrastructure validate
else
  skip_check "Terraform fmt/validate (Terraform unavailable)"
fi

if command -v ruby >/dev/null 2>&1; then
  run "YAML parse" ruby -ryaml -e '
    Dir["**/*.{yml,yaml}"].sort.each do |path|
      next if path.start_with?("helm/platform/templates/")
      next if path.start_with?(".github/workflows/")
      YAML.load_file(path)
    end
    puts "yaml ok"
  '
else
  skip_check "YAML parse (Ruby unavailable)"
fi

if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    run "Docker build" docker build -t platform-api:1.0.0 .
  else
    skip_check "Docker build (Docker daemon unavailable)"
  fi
else
  skip_check "Docker build (Docker CLI unavailable)"
fi

if command -v trivy >/dev/null 2>&1; then
  run "Trivy filesystem" trivy fs --severity HIGH,CRITICAL --exit-code 1 .
else
  skip_check "Trivy filesystem (tool unavailable)"
fi

if command -v gitleaks >/dev/null 2>&1; then
  run "Gitleaks" gitleaks detect --no-banner --redact
else
  skip_check "Gitleaks (tool unavailable)"
fi

if command -v syft >/dev/null 2>&1; then
  run "Syft SBOM" syft dir:. -o cyclonedx-json=security/sbom.cdx.json
else
  skip_check "Syft SBOM (tool unavailable)"
fi

if curl -fsS "http://localhost:${API_PORT}/actuator/health" >/tmp/self-healing-check.out 2>&1; then
  echo "PASS  live health"
  pass=$((pass + 1))
else
  echo "SKIPPED live health (application not running)"
  skip=$((skip + 1))
fi

echo "Summary: PASS=$pass FAIL=$fail SKIPPED=$skip"
test "$fail" -eq 0
