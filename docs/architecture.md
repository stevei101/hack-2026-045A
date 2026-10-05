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
 IncidentCard
        |
        +--> React HUD Incident Banner (emergency delta)
        +--> GET /api/v1/austin311/context  --> live SODA count or omitted
        +--> Leaflet live overlay pin (only when lat/lng present)
        +--> unmapped triage queue (null lat/lng)
        |
 CARTO iframe (VITE_CARTO_MAP_URL, src never mutated)
        |
        v
 hack.oxidizedgraph.dev  (Cloudflare Container today)
 later: GitHub main --Flux civicpulse-prod--> GKE overlay k8s/overlays/prod
```

Coordinates: a missing `reported_lat` / `reported_lng` stays null. Street names are not geocoded. Cached Travis/Williamson pins are demo data only. The CARTO embed is the Austin 311 baseline and is not updated in-process when FastAPI accepts a report.

Apex `oxidizedgraph.dev` and `www` remain on Cloudflare Pages. CivicPulse is reserved on the `hack` subdomain.
