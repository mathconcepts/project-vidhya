# Snapshot snapshot-20260502-0702-sprint-b3b-jwt-auth

| Field | Value |
|---|---|
| Tag | `snapshot-20260502-0702-sprint-b3b-jwt-auth` |
| Git branch | `claude/deployment-framework-setup-94Pfr` |
| Git SHA | `96e7f83254af2f6b96b9eb0a656b75900fe41151` |
| Created (UTC) | 2026-05-02T07:02:24Z |
| Created by | `mathconcepts <math.concepts1@gmail.com>` |
| Package version | `4.13.0` |
| Node | `v22.22.2` |
| npm | `10.9.7` |
| Migrations | 21 files |
| Exam packs | 1 (data/curriculum/) |
| Docker image | `project-vidhya:snapshot-20260502-0702-sprint-b3b-jwt-auth` |

## Recent commits

```
96e7f83 snapshot: sprint-b2-admin-api — admin REST surface ready
bb0c5bb refactor(admin-api): migrate to requireRole('admin') for JWT-aware auth
1c1c068 feat(admin-api): Sprint B2 — admin REST surface for experiments + runs
2e9724b snapshot: sprint-a-experiment-spine — Content R&D Loop spine ready
b6fd340 feat(experiments): Sprint A — Content R&D Loop spine
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
docker run -p 8080:8080 --env-file .env project-vidhya:snapshot-20260502-0702-sprint-b3b-jwt-auth

# Or roll back to this exact code:
git checkout snapshot-20260502-0702-sprint-b3b-jwt-auth
```

## Notes

<!-- Edit this section with hypothesis, experiment goal, or feedback after deploy -->
