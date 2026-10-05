# Contributing to CivicPulse Mesh

This repository is the only CivicPulse Mesh tree for WarriorHacks 2.0. Do not open a second repository named `civicpulse-mesh`.

## Youth safety (two-adult rule)

WarriorHacks admits participants 13+. All pairing, review, and mentoring follows the two-adult rule:

- No one-on-one private messages between an adult and a minor on Discord, Devpost, GitHub, or email.
- No private breakout rooms with a single adult and a minor.
- Technical coordination stays in the public Discord team channel, public GitHub issues, or a session with at least two adults present.

## Secrets

Never commit API keys, tokens, service-account JSON, `.env` files, or kubeconfigs. Name environment variables in docs. Put values in Secret Manager or a local untracked file.

## Local checks

```bash
bun run --cwd frontend build
pytest backend/tests
kustomize build k8s/overlays/prod
```

## Public hostname

Use `hack.oxidizedgraph.dev`. Leave the apex and `www` records on Cloudflare Pages.
