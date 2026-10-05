# hack-2026-045A

CivicPulse Mesh manifests for GKE in GCP project `inert-synergies-llc` (organization `34571522265`).

GitHub is the git remote. Flux reconciles this repo. The workload is a Kustomize base plus dev, staging, and prod overlays.

## Layout

```text
k8s/base/                         namespace, service account, service, deployment
k8s/overlays/dev/
k8s/overlays/staging/
k8s/overlays/prod/                path Flux applies
clusters/inert-synergies-llc/     Flux GitRepository and Kustomization
```

The prod overlay deploys namespace `civicpulse`. Dev and staging use `civicpulse-dev` and `civicpulse-staging`. The container image is `ghcr.io/stevei101/hack-2026-045A:unreleased` until the prod overlay pins a digest.

## Flux

There is no GKE cluster in the project yet. After one exists, install Flux from this repo:

```bash
flux bootstrap github \
  --owner=stevei101 \
  --repository=hack-2026-045A \
  --branch=main \
  --path=clusters/inert-synergies-llc \
  --personal
```

Bootstrap writes the Flux controllers under `clusters/inert-synergies-llc/flux-system/`. The `civicpulse-prod` Kustomization then applies `k8s/overlays/prod`.

## Check the manifests

```bash
kustomize build k8s/overlays/prod
kustomize build clusters/inert-synergies-llc
```
