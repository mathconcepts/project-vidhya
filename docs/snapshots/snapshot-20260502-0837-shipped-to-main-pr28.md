# Snapshot snapshot-20260502-0837-shipped-to-main-pr28

| Field | Value |
|---|---|
| Tag | `snapshot-20260502-0837-shipped-to-main-pr28` |
| Git branch | `main` |
| Git SHA | `6ae84214a04efc87259089a6983da2d98c38164c` |
| Created (UTC) | 2026-05-02T08:38:03Z |
| Created by | `mathconcepts <math.concepts1@gmail.com>` |
| Package version | `4.13.0` |
| Node | `v22.22.2` |
| npm | `10.9.7` |
| Migrations | 21 files |
| Exam packs | 1 (data/curriculum/) |
| Docker image | `project-vidhya:snapshot-20260502-0837-shipped-to-main-pr28` |

## Recent commits

```
6ae8421 docs: document Content R&D Loop release (PR #28) (#29)
1be984c feat: deployment framework + Content R&D Loop (Sprints A → B3a + local-dev UX) (#28)
350c7a5 Merge pull request #27 from mathconcepts/docs/multi-modal-release
03fc5dc docs: sync CLAUDE.md + PENDING.md with multi-modal v4.11.0–v4.13.0 ship
3a7e85e Merge pull request #26 from mathconcepts/feat/multi-modal-narration-ab
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
docker run -p 8080:8080 --env-file .env project-vidhya:snapshot-20260502-0837-shipped-to-main-pr28

# Or roll back to this exact code:
git checkout snapshot-20260502-0837-shipped-to-main-pr28
```

## Notes

<!-- Edit this section with hypothesis, experiment goal, or feedback after deploy -->
