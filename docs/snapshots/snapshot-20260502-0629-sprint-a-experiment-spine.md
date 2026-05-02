# Snapshot snapshot-20260502-0629-sprint-a-experiment-spine

| Field | Value |
|---|---|
| Tag | `snapshot-20260502-0629-sprint-a-experiment-spine` |
| Git branch | `claude/deployment-framework-setup-94Pfr` |
| Git SHA | `b6fd34025f4d5bde4552fbd4ee5cc0d802347dad` |
| Created (UTC) | 2026-05-02T06:29:54Z |
| Created by | `mathconcepts <math.concepts1@gmail.com>` |
| Package version | `4.13.0` |
| Node | `v22.22.2` |
| npm | `10.9.7` |
| Migrations | 21 files |
| Exam packs | 1 (data/curriculum/) |
| Docker image | `project-vidhya:snapshot-20260502-0629-sprint-a-experiment-spine` |

## Recent commits

```
b6fd340 feat(experiments): Sprint A — Content R&D Loop spine
b513589 snapshot: baseline-local-stack — first deployable artifact
1f76e2b feat(deploy): add snapshot mechanism — frozen deployable artifacts
489cb64 fix(server): treat HEAD as GET in route dispatch
d81b12f chore(gitignore): exclude docker-compose.override.yml for local-only overrides
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
docker run -p 8080:8080 --env-file .env project-vidhya:snapshot-20260502-0629-sprint-a-experiment-spine

# Or roll back to this exact code:
git checkout snapshot-20260502-0629-sprint-a-experiment-spine
```

## Notes

<!-- Edit this section with hypothesis, experiment goal, or feedback after deploy -->
