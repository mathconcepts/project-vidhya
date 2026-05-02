# Snapshot snapshot-20260502-0721-sprint-b3a-content-rd-ui-final

| Field | Value |
|---|---|
| Tag | `snapshot-20260502-0721-sprint-b3a-content-rd-ui-final` |
| Git branch | `claude/deployment-framework-setup-94Pfr` |
| Git SHA | `29bc034826c382892cc8303ee6ef71dcb4176e3d` |
| Created (UTC) | 2026-05-02T07:22:11Z |
| Created by | `mathconcepts <math.concepts1@gmail.com>` |
| Package version | `4.13.0` |
| Node | `v22.22.2` |
| npm | `10.9.7` |
| Migrations | 21 files |
| Exam packs | 1 (data/curriculum/) |
| Docker image | `project-vidhya:snapshot-20260502-0721-sprint-b3a-content-rd-ui-final` |

## Recent commits

```
29bc034 snapshot: sprint-b3a-content-rd-ui — admin Content R&D page live
e955765 fix(server): static + SPA fallback now handles HEAD too
616999c feat(admin-ui): Sprint B3a — Content R&D admin page
2f09dbf snapshot: sprint-b3b-jwt-auth — admin routes now JWT-aware
96e7f83 snapshot: sprint-b2-admin-api — admin REST surface ready
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
docker run -p 8080:8080 --env-file .env project-vidhya:snapshot-20260502-0721-sprint-b3a-content-rd-ui-final

# Or roll back to this exact code:
git checkout snapshot-20260502-0721-sprint-b3a-content-rd-ui-final
```

## Notes

<!-- Edit this section with hypothesis, experiment goal, or feedback after deploy -->
