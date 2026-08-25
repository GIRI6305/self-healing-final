# Security
Containers run as non-root with dropped capabilities and read-only filesystems. Kubernetes manifests use a dedicated service account, resource constraints, probes, PDB and NetworkPolicy. CI includes secret, SAST, dependency, IaC and image scanning when tools are available. No credentials are stored in source control.
