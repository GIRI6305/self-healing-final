# Deployment
Build the image, load it into the local Kubernetes runtime, then install the Helm chart. For kind: `kind load docker-image platform-api:1.0.0`; for Docker Desktop Kubernetes, the local image is normally directly available. Use `helm upgrade --install platform-api helm/platform`.
