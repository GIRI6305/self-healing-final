# Runbook
1. Confirm Prometheus alert state.
2. Inspect API pods and events.
3. Check readiness and liveness.
4. Use the controlled failure endpoint only for demo/testing.
5. Restart/roll back through Kubernetes rather than deleting unrelated resources.
6. Verify recovery through health, metrics and pod readiness.
