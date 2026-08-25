# Architecture
```mermaid
flowchart LR
  Dev[Developer] --> Git[Git/GitHub]
  Git --> CI[GitHub Actions]
  CI --> Image[Container Image]
  Image --> K8s[Kubernetes]
  K8s --> API[Spring Boot API]
  API --> Prom[Prometheus]
  Prom --> Graf[Grafana]
  Prom --> Alert[Alert Rules]
  Alert --> Rem[Controlled Remediation]
  Rem --> API
```
The application is intentionally a single bounded service so the reliability behavior is easy to understand and operate locally. Kubernetes provides restart/self-healing primitives; application endpoints provide safe failure injection and remediation demonstration.
