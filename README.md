# Self-Healing Cloud-Native Platform

A local-first, production-style DevOps/SRE portfolio platform. It is intentionally designed to run without AWS credentials or paid services.

## Prerequisites
- JDK 21
- Maven 3.9+
- Docker Desktop with Kubernetes, or kind/k3d
- kubectl and Helm
- Optional: Terraform, Trivy, Gitleaks, Syft, Semgrep

## Quick start
```bash
./scripts/setup-local.sh
./scripts/validate-all.sh
./scripts/demo.sh
```

## Architecture
See `docs/ARCHITECTURE.md`, `docs/OBSERVABILITY.md`, and `docs/RUNBOOK.md`.

## Local endpoints
- API: printed by `setup-local.sh` (normally http://localhost:8080)
- Actuator: `${API_URL}/actuator/health`
- Prometheus: printed by `setup-local.sh` (normally http://localhost:9090)
- Grafana: printed by `setup-local.sh` (normally http://localhost:3000)

If a default port is already occupied, `setup-local.sh` automatically selects the next available port and records it in `.env.local`.

## Cleanup
`./scripts/cleanup-local.sh`

The scripts are defensive: unavailable optional tools are reported as SKIPPED rather than silently treated as passed.
