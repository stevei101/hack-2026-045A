# CivicPulse Mesh architecture

```text
Citizen report (multipart text + optional image bytes)
        |
        v
 FastAPI /api/v1/hazards/report
        |
        +--> civicpulse-heuristic  (model_name recorded)
        |
        v
 IncidentCard  --> in-memory feed + Bun/React Leaflet map
        |                 |
        |                 +-- mapped pin
        |                 +-- unmapped triage queue (null lat/lng)
        v
 GitHub main --Flux civicpulse-prod--> GKE overlay k8s/overlays/prod
        |
        v
 Ingress host hack.oxidizedgraph.dev
```

Coordinates: a missing `reported_lat` / `reported_lng` stays null. Street names are not geocoded. Cached Travis/Williamson pins are demo data only.

Apex `oxidizedgraph.dev` and `www` remain on Cloudflare Pages. CivicPulse is reserved on the `hack` subdomain.
