# hack-2026-045A

CivicPulse Mesh for GKE in GCP project `inert-synergies-llc` (organization `34571522265`).

This repository uses GitHub as the remote. The delivery stack is TypeScript and Bun, React, Rust, YAML, GitHub Actions, GKE, External Secrets Operator with OIDC, Crossplane, Flux, Kubernetes manifests, and Kustomize overlays.

Crossplane provisions the cluster. Flux reconciles this repo. The app overlay does not install Flux, Crossplane, or the External Secrets operator, and it does not ship a one-container External Secrets deployment. Secret values stay in GCP Secret Manager. The `ExternalSecret` only names the remote key `civicpulse-gemini`. The ServiceAccount annotation `iam.gke.io/gcp-service-account: civicpulse@inert-synergies-llc.iam.gserviceaccount.com` is the Workload Identity subject. GitHub Actions requests `id-token: write` and does not store a cloud key in the workflow.

## Layout

```text
frontend/                         React, Vite, Bun
backend/                          FastAPI intake
src/                              Rust org-guard
k8s/base/                         namespace, service account, service, deployment, ExternalSecret
k8s/overlays/dev/
k8s/overlays/staging/
k8s/overlays/prod/                path Flux applies
clusters/inert-synergies-llc/     Flux GitRepository and Kustomization
.github/workflows/ci.yml          Bun, pytest, cargo test, kustomize
```

The prod overlay deploys namespace `civicpulse`. Dev and staging use `civicpulse-dev` and `civicpulse-staging`. The container image is `ghcr.io/stevei101/hack-2026-045A:unreleased` until the prod overlay pins a digest.

## Flux

There is no GKE cluster in the project yet. Crossplane is what creates it. After the cluster exists and the External Secrets operator is installed with `ClusterSecretStore` `gcp-secret-manager`, install Flux from this repo:

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

## App

Local development comes before a cluster. The API listens on port 8080, the same port the Deployment probes. The UI uses Bun on port 5173.

```bash
cd backend && uv run uvicorn app.main:app --reload --port 8080
cd frontend && bun install && bun run dev
```

`POST /api/v1/hazards/report` accepts multipart text and an optional jpeg, png, or webp. It does not fetch image URLs. A report with no GPS keeps `latitude` and `longitude` null and shows under unmapped incidents. The eight cached pins are the demo dataset. They are not substituted for a citizen report that omitted a location.

Provider API keys stay in the environment. This build does not call Gemini or OpenAI. If `GEMINI_API_KEY` or `OPENAI_API_KEY` is set, the report still returns HTTP 200 with `model_name` `fallback-cache-travis-v1` and does not print the key.

## Attribution

Map tiles are OpenStreetMap data rendered by CARTO. The intake classifier in this draft is `local-rules-v1`. The seeded pins are labeled `fallback-cache-travis-v1`. No foundation-model checkpoint is called from the repository. Frameworks: FastAPI, Pydantic, React, Leaflet, Tailwind, Vite, Bun.
