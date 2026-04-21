# ops/

Ops artifacts that can't be installed via this repo's scripts or CI directly.

## `content-engine.yml` — Nightly Content Pipeline

**What it does**
Runs nightly on GitHub Actions: scrape new problems → top up explainers
via Gemini → Wolfram-verify new problems → rebuild `content-bundle.json`
→ commit back to `main`, which triggers Render auto-deploy.

**Why it's here and not in `.github/workflows/`**
Installing it requires a Personal Access Token with the `workflow` scope,
which Anthropic's sandboxed build environment for this repo doesn't hold.
GitHub refuses to accept `.github/workflows/*.yml` creations or updates
from tokens without that scope — even with full repo write access.

**How to install it (one-time, ~30 seconds)**

Option A — Web UI
1. Visit https://github.com/mathconcepts/project-vidhya
2. Click the "Actions" tab
3. Click "New workflow" → "set up a workflow yourself"
4. Name the file `content-engine.yml`
5. Paste the contents of `ops/content-engine.yml` from this repo
6. Click "Commit changes..."

Option B — Local git push with a personal token that has `workflow` scope
```bash
# Create a fine-grained or classic PAT with repo + workflow scopes at
# https://github.com/settings/tokens
git clone https://github.com/mathconcepts/project-vidhya
cd project-vidhya
mkdir -p .github/workflows
cp ../project-vidhya/ops/content-engine.yml .github/workflows/
git add .github/workflows/content-engine.yml
git commit -m "chore(ci): install content-engine workflow"
git push   # prompts for credentials — use the PAT with workflow scope
```

**Required secrets** (set in GitHub repo settings → Secrets and variables → Actions)
- `GEMINI_API_KEY` — for explainer top-ups
- `WOLFRAM_APP_ID` — for answer verification

Without those secrets the workflow will still run but will skip the
relevant stages gracefully.

**Schedule**
Runs daily at 03:00 UTC. Can also be triggered manually from the Actions
tab via workflow_dispatch.

**Cost per run**
- Scrape: $0 (licensed public sources)
- Explainer top-up: ~$0.001 per new concept (rare — all 82 are seeded)
- Wolfram verify: ~$0.002 per new problem (amortized over many student
  requests → essentially free at read time)
- GitHub Actions compute: free tier covers this at nightly cadence

**Verifying it installed correctly**
After upload, the Actions tab should show "Content Engine Pipeline" in
the workflow list. First run will trigger automatically on the next cron
tick, or you can run it manually via "Run workflow".
