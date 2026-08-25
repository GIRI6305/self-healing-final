# Disaster Recovery
Kubernetes manifests and Helm values are the desired-state source. Recovery is achieved by reinstalling the chart and rebuilding/loading the immutable image. For a real cloud deployment, store images in a registry and Helm/Git state in source control; add managed database backups before introducing stateful production data.
