# CivicPulse Mesh · Hack 2026-045A

WarriorHacks 2.0 hazard intake for Travis and Williamson counties. A citizen files text and an optional photo; FastAPI classifies the report; the Bun/React map shows mapped pins and keeps GPS-less reports in an unmapped triage queue.

**Repo:** [github.com/stevei101/hack-2026-045A](https://github.com/stevei101/hack-2026-045A)  
**Public hostname:** `hack.oxidizedgraph.dev` (subdomain on `oxidizedgraph.dev`; apex and `www` stay on Cloudflare Pages)  
**Drafts:** [issue #1](https://github.com/stevei101/hack-2026-045A/issues/1) · [issue #3](https://github.com/stevei101/hack-2026-045A/issues/3) · [issue #7](https://github.com/stevei101/hack-2026-045A/issues/7)

Do not open a second repository named `civicpulse-mesh`.

## Local demo

Needs Python 3.12+, [Bun](https://bun.sh), and no API keys.

```bash
bun install --cwd frontend
bun run --cwd frontend build
python3 -m venv .venv
source .venv/bin/activate
pip install -e 'backend/[dev]'
pytest backend/tests
FRONTEND_DIST=frontend/dist PORT=43211 uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 43211
```

Open [http://127.0.0.1:43211](http://127.0.0.1:43211).

Split mode (Vite on 43211, API on 43201):

```bash
PORT=43201 uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 43201
bun run --cwd frontend dev
```

- The live overlay loads 10 fixed Travis/Williamson demo pins (`fallback-cache-travis-v1`). Those pins are demo data, not a stand-in for a citizen report.
- Leave location off to confirm the API does **not** invent a Pflugerville point (`30.4515, -97.6564`). Unmapped cards stay in **Unmapped incidents — needs triage**.
- Images are optional multipart uploads (`image/jpeg`, `image/png`, `image/webp`). The API reads bytes in memory and never fetches `image_url`.
- `IncidentCard.model_name` is always set (`civicpulse-heuristic` unless `MODEL_NAME` is set).
- No secrets belong in this repository. Optional later Gemini keys come from the environment or Secret Manager, never from git.

## CARTO 311 baseline + React HUD

Issue #7: CARTO Builder is the **city operations baseline**. FastAPI is the **emergency delta**. The iframe `src` is `VITE_CARTO_MAP_URL` and does not change when a report is filed or a pin is selected, so the embed does not hard-reload.

1. Export a 1,000-row Austin 311 subset (writes to `/tmp`, not git):

```bash
python3 scripts/fetch_austin_311.py
```

2. In [clausa.app.carto.com](https://clausa.app.carto.com), upload that CSV, add a Category widget on `sr_type_desc` and an H3 hexbin, set the map to **Public**, and confirm it loads in an incognito window.
3. Put the share URL in `frontend/.env`:

```bash
VITE_CARTO_MAP_URL=https://clausa.app.carto.com/map/<public-uuid>
```

Until that URL exists, the baseline pane stays empty. `YOUR_PUBLIC_MAP_UUID` is not committed. Leaflet stays the live triage overlay: a new report docks a dispatch banner and, when GPS is present, a pin. A report with no GPS stays in the unmapped queue.

Nearby ticket copy comes from `GET /api/v1/austin311/context` against the public SODA resource `xwdj-i9he`. If SODA is down or the category has no filter, the banner omits the count. There is no hardcoded “47 nearby tickets” and no fallback pin at `30.3150, -97.7280`.

## Public hostname

`oxidizedgraph.dev` and `www.oxidizedgraph.dev` already CNAME to `oxidizedgraph-dev.pages.dev`. CivicPulse uses **`hack.oxidizedgraph.dev`**.

Cloudflare currently has a reservation TXT at `_civicpulse.hack.oxidizedgraph.dev`. Do not create an A/CNAME for `hack` until a GKE Ingress address exists. The Kustomize Ingress already names the host.

## GitOps on GKE

Cluster target: `hack-gke-primary` in `us-central1`, GCP project `inert-synergies-llc`. There is no cluster yet; Flux is not bootstrapped.

```text
k8s/base/                         namespace, service account, service, deployment, ingress
k8s/overlays/dev|staging|prod
clusters/inert-synergies-llc/     Flux GitRepository + Kustomization civicpulse-prod
```

Prod namespace is `civicpulse`. Dev and staging use `civicpulse-dev` and `civicpulse-staging`. Flux object `civicpulse-prod` applies `./k8s/overlays/prod` and does not set `targetNamespace`.

```bash
flux bootstrap github \
  --owner=stevei101 \
  --repository=hack-2026-045A \
  --branch=main \
  --path=clusters/inert-synergies-llc \
  --personal
```

```bash
kustomize build k8s/overlays/dev
kustomize build k8s/overlays/staging
kustomize build k8s/overlays/prod
kustomize build clusters/inert-synergies-llc
```

Image: `ghcr.io/stevei101/hack-2026-045A:unreleased`, port **8080**, uid **65532**.

## Attribution & model disclosure

| Asset | Attribution |
| --- | --- |
| Classifier | `civicpulse-heuristic` (keyword rules in `backend/app/agent.py`) |
| Demo pins | `fallback-cache-travis-v1` in `backend/app/mock_data.py` |
| Map tiles | © OpenStreetMap contributors, © CARTO |
| 311 baseline | [City of Austin 311 Public Data](https://data.austintexas.gov/Utilities-and-City-Services/Austin-311-Public-Data/xwdj-i9he) via SODA (`sr_type_desc`) |
| Spatial engine | CARTO Builder (`clausa.app.carto.com`) public map embed |
| UI | React, Leaflet, Tailwind CSS, Bun, Vite |
| API | FastAPI / Pydantic |

If a hosted model is wired later, every `IncidentCard.model_name` must name that checkpoint. Do not geocode street names into invented coordinates.

## WarriorHacks notes

- A human must submit the **WarriorHacks 2.0 Track Selection Form** on Devpost and choose **Hackathon Track**. An unsubmitted form is a disqualification. Deadline: 13 Oct 2026, 11:45 PM CDT.
- Team discussion stays in the public Discord channel or on Devpost (two-adult rule; no private one-to-one with a minor). See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache License 2.0. See [LICENSE](LICENSE).
