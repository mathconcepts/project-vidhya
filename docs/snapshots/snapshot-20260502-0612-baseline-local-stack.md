# Snapshot snapshot-20260502-0612-baseline-local-stack

| Field | Value |
|---|---|
| Tag | `snapshot-20260502-0612-baseline-local-stack` |
| Git branch | `claude/deployment-framework-setup-94Pfr` |
| Git SHA | `1f76e2b6a622743a6bb0361e7184ac0d239319e1` |
| Created (UTC) | 2026-05-02T06:13:01Z |
| Created by | `mathconcepts <math.concepts1@gmail.com>` |
| Package version | `4.13.0` |
| Node | `v22.22.2` |
| npm | `10.9.7` |
| Migrations | 20 files |
| Exam packs | 1 (data/curriculum/) |
| Docker image | `project-vidhya:snapshot-20260502-0612-baseline-local-stack` |

## Recent commits

```
1f76e2b feat(deploy): add snapshot mechanism — frozen deployable artifacts
489cb64 fix(server): treat HEAD as GET in route dispatch
d81b12f chore(gitignore): exclude docker-compose.override.yml for local-only overrides
649519b fix(local-dev): unblock docker-compose boot — auth stub, scheduler ESM, dockerfile
350c7a5 Merge pull request #27 from mathconcepts/docs/multi-modal-release
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
docker run -p 8080:8080 --env-file .env project-vidhya:snapshot-20260502-0612-baseline-local-stack

# Or roll back to this exact code:
git checkout snapshot-20260502-0612-baseline-local-stack
```

## Notes

<!-- Edit this section with hypothesis, experiment goal, or feedback after deploy -->
