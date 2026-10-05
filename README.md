# CivicPulse Mesh · Hack 2026-045A

WarriorHacks 2.0 hazard intake for Travis and Williamson counties. A citizen files text and an optional photo; FastAPI classifies the report; the Bun/React map shows mapped pins and keeps GPS-less reports in an unmapped triage queue.

**Repo:** [github.com/stevei101/hack-2026-045A](https://github.com/stevei101/hack-2026-045A)  
**Public hostname:** `hack.oxidizedgraph.dev` (subdomain on `oxidizedgraph.dev`; apex and `www` stay on Cloudflare Pages)  
**Drafts:** [issue #1](https://github.com/stevei101/hack-2026-045A/issues/1) · [issue #3](https://github.com/stevei101/hack-2026-045A/issues/3)

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

- The map loads 10 fixed Travis/Williamson demo pins (`fallback-cache-travis-v1`). Those pins are demo data, not a stand-in for a citizen report.
- Leave location off to confirm the API does **not** invent a Pflugerville point. Unmapped cards stay in **Unmapped incidents — needs triage**.
- Images are optional multipart uploads. The API reads bytes in memory and never fetches `image_url`.
- `IncidentCard.model_name` is always set (`civicpulse-heuristic` unless `MODEL_NAME` is set).
- No secrets belong in this repository.

## Public hostname

`oxidizedgraph.dev` and `www` already CNAME to Cloudflare Pages. CivicPulse uses **`hack.oxidizedgraph.dev`**.

A reservation TXT lives at `_civicpulse.hack.oxidizedgraph.dev`. Do not create an A/CNAME for `hack` until a GKE Ingress address exists.

## GitOps on GKE

Prod namespace is `civicpulse`. Flux object `civicpulse-prod` applies `./k8s/overlays/prod` and does not set `targetNamespace`.

Image: `ghcr.io/stevei101/hack-2026-045A:unreleased`, port **8080**, uid **65532**.

## License

Apache License 2.0. See [LICENSE](LICENSE).
