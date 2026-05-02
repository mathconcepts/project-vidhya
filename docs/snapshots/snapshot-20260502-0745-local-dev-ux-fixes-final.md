# Snapshot snapshot-20260502-0745-local-dev-ux-fixes-final

| Field | Value |
|---|---|
| Tag | `snapshot-20260502-0745-local-dev-ux-fixes-final` |
| Git branch | `claude/deployment-framework-setup-94Pfr` |
| Git SHA | `bed3973acf42551e3deb2b2532c92b2aea036835` |
| Created (UTC) | 2026-05-02T07:46:09Z |
| Created by | `mathconcepts <math.concepts1@gmail.com>` |
| Package version | `4.13.0` |
| Node | `v22.22.2` |
| npm | `10.9.7` |
| Migrations | 21 files |
| Exam packs | 1 (data/curriculum/) |
| Docker image | `project-vidhya:snapshot-20260502-0745-local-dev-ux-fixes-final` |

## Recent commits

```
bed3973 snapshot: pending UX fix manifest checkpoint
b6ea97a fix(docker): copy demo/ into runtime image for auto-seed
51a3af6 feat(local-dev): one-click admin sign-in + Calm Mode icon fix
b002745 snapshot: sprint-b3a-content-rd-ui-final — HEAD fallback for SPA paths
29bc034 snapshot: sprint-b3a-content-rd-ui — admin Content R&D page live
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
docker run -p 8080:8080 --env-file .env project-vidhya:snapshot-20260502-0745-local-dev-ux-fixes-final

# Or roll back to this exact code:
git checkout snapshot-20260502-0745-local-dev-ux-fixes-final
```

## Notes

<!-- Edit this section with hypothesis, experiment goal, or feedback after deploy -->
