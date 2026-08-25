# Observability
Spring Boot Actuator exposes health, metrics and Prometheus endpoints. Prometheus scrapes the API and evaluates version-controlled alerts. Grafana is provisioned from files and includes API availability, request-rate and JVM panels. OpenTelemetry is an optional extension point; the project keeps Micrometer as the baseline to avoid unnecessary local complexity.
