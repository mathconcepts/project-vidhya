# Snapshot snapshot-20260502-0820-auth-jwt-claim-fallback

| Field | Value |
|---|---|
| Tag | `snapshot-20260502-0820-auth-jwt-claim-fallback` |
| Git branch | `claude/deployment-framework-setup-94Pfr` |
| Git SHA | `e35436cf9981ca635feddc9a44bc3a10d405d2e7` |
| Created (UTC) | 2026-05-02T08:20:30Z |
| Created by | `mathconcepts <math.concepts1@gmail.com>` |
| Package version | `4.13.0` |
| Node | `v22.22.2` |
| npm | `10.9.7` |
| Migrations | 21 files |
| Exam packs | 1 (data/curriculum/) |
| Docker image | `project-vidhya:snapshot-20260502-0820-auth-jwt-claim-fallback` |

## Recent commits

```
e35436c snapshot: pending manifest checkpoint
83184c8 fix(auth): honour JWT role claim for demo/dev users
a5bbb6a snapshot: pending manifest checkpoint
dfca3e6 fix(demo-login): read role from URLSearchParams correctly
a240c95 fix(docker): add .dockerignore to exclude stale demo-tokens + dev artifacts
```

## Required env vars (minimum to boot)

- `JWT_SECRET` — 16+ char secret
- `DATABASE_URL` — Postgres connection string (or compose's bundled db)

## Optional env vars (degrade gracefully)

- `GEMINI_API_KEY` — chat + content generation (otherwise 503 on /api/chat)
- `OPENAI_API_KEY` — TTS narration + multi-LLM consensus (otherwise narration off)
- `ANTHROPIC_API_KEY` — alternate LLM provider
- `WOLFRAM_APP_ID` — Tier 3 verification (otherwise verifier degrades to LLM-only)

## How to deploy this snapshot

```bash
# Local re-run:
docker run -p 8080:8080 --env-file .env project-vidhya:snapshot-20260502-0820-auth-jwt-claim-fallback

# Or roll back to this exact code:
git checkout snapshot-20260502-0820-auth-jwt-claim-fallback
```

## Notes

<!-- Edit this section with hypothesis, experiment goal, or feedback after deploy -->
