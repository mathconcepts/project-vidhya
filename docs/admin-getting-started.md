# Admin guide: from a fresh laptop to a cloud deploy serving real students

> **Who this is for:** an admin who wants to start from zero — clone the repo, generate content locally, prove it works on their own machine, then push to a cloud deploy serving a real cohort.
>
> **Running scenario (same as the [companion guide](./admin-guide-jee-tn.md)):** a small batch of Tamil Nadu state-board class 12 students preparing for IIT JEE Main, several anxious and low-confidence after a rough mid-term.
>
> **Time:** ~2 hours from `git clone` to live deploy. ~10 minutes per week to keep it moving after that.
>
> **Companion:** this guide is the **before** ("how do I even get there?"). The [admin runbook](./admin-guide-jee-tn.md) is the **after** ("now that I'm in the admin UI, what do I do?"). Read them in order.

---

## The mental shape of "local first, then cloud"

The strongest move with Vidhya is to do the **expensive, slow, error-prone work** (content generation, persona validation, blueprint iteration) on your laptop where:

- You can re-run things instantly without redeploys
- You don't pay cloud LLM bills until you're sure the blueprint is right
- A flaky internet connection at the wrong moment doesn't lose you anything
- You can experiment with rulesets and personas without affecting any real student

Then you push the **good** state to the cloud, where:

- Real students hit the production URL
- The lift ledger runs nightly against real attempts
- The auto-promote/demote loop closes
- You watch the dashboards weekly

```
   YOUR LAPTOP                           THE CLOUD
   ───────────                           ─────────
   docker compose up                     Render auto-deploys main
        │                                       │
   generate + validate                   serves real students
        │                                       │
   git push to main  ───────────────→    nightly ledger
                                                │
                                          weekly digest PR ─→ back to your laptop
```

The repo is built around this. The same code paths run locally and in the cloud; the differences are config (DB connection string, LLM keys, env vars).

---

## Step 0 · Prerequisites

What you need on the machine, in priority order:

| Tool | Why | Install |
|---|---|---|
| **Git** | Clone + push | Likely already installed |
| **Node ≥ 20** + npm | Backend + frontend | https://nodejs.org |
| **Docker Desktop** | Local Postgres + auto-applied migrations | https://www.docker.com/products/docker-desktop |
| **A Gemini API key** | Generation (only needed when you actually generate, not for setup) | https://aistudio.google.com/app/apikey |
| **A GitHub account** | Cloud deploy via Render watches `main` | If you don't have one, make one |
| **A Render account** | Free tier is enough for a small cohort | https://render.com (free, no card needed for the free tier) |

**Optional but useful:**

- **Ollama** (https://ollama.com) — run a local LLM for free on your laptop. Useful for tinkering with prompts before spending Gemini credits. Vidhya supports it as a configured provider.
- **`gh` CLI** — for the weekly ledger PR auto-open feature later (not needed at start).

You do **not** need a paid Supabase account. The local stack uses plain Postgres in Docker; the cloud deploy uses Render's managed Postgres or a free Supabase instance — your call.

---

## Step 1 · Clone and start the local stack

```bash
git clone https://github.com/mathconcepts/project-vidhya
cd project-vidhya

# Start the full stack: Postgres + pgvector + the Vidhya server with all
# migrations auto-applied. ~3 minutes the first time (it builds the
# Docker image), seconds thereafter.
docker compose up --build -d

# Sanity check — the API root returns 403 by design (auth-gated).
curl -sI http://localhost:8080
```

If you see `HTTP/1.1 403 Forbidden`, the backend is up. If you see `Connection refused`, give it another 30 seconds — Postgres takes a moment to settle on first boot.

In a separate terminal, start the frontend dev server:

```bash
cd frontend
npm install      # ~1 minute
npm run dev      # serves on http://localhost:3000
```

Open `http://localhost:3000`.

> 🟢 **Try this.** When `GOOGLE_OAUTH_CLIENT_ID` is unset (the local default), the sign-in page renders a **"Local dev quick start"** panel with three role buttons. Click **Admin (Arjun)**. You'll be redirected to `/admin/content-rd`. From there you can reach every screen the [admin runbook](./admin-guide-jee-tn.md) talks about.

---

## Step 2 · (Optional) Configure a local LLM via Ollama

You can skip this step — the next steps don't need an LLM until you actually generate content. But if you want to author and tweak rulesets / blueprints / personas without burning Gemini credits, run Ollama locally.

```bash
# Install Ollama from https://ollama.com, then pull a small model:
ollama pull llama3.2:3b    # ~2 GB; fine for sanity-checking prompts

# Ollama serves at http://localhost:11434 by default. The Vidhya
# AI config page already knows about it — visit /llm-config.
```

In `/llm-config`:
1. Pick **Ollama (local)** as the primary provider.
2. Leave the endpoint blank (default `http://localhost:11434/v1` is correct).
3. Click **Save without testing** — the test endpoint is smart enough to detect that you're hitting localhost from a hosted server, but on a local box it'll work either way.

> ⚠ **Quality caveat.** A local 3B model is good enough for "does this prompt produce the *shape* I expect?" — it's not good enough for production content. When you're ready to actually generate atoms students will see, switch the primary provider back to Gemini.

---

## Step 3 · Author rulesets + a blueprint locally

Everything from steps 3–4 of the [admin runbook](./admin-guide-jee-tn.md#step-3--encode-the-cohorts-character-with-rulesets) works exactly the same on `localhost:3000` as it will on the cloud deploy. Walk through that companion doc now:

1. `/admin/rulesets` → write 4 cohort rulesets for `jee-main`
2. `/admin/blueprints` → create one blueprint per concept (`limits-jee`, `derivatives-basic`, `continuity-differentiability-jee` — three concepts is enough to start)
3. Approve each blueprint

> 🟢 **Local advantage.** You can iterate on rulesets and blueprints freely. Nothing is shipped until you `git push`. Wrong rule? Delete it. Wrong blueprint? Edit the JSON in place. The data lives in your local Postgres container — nuking it (`docker compose down -v && docker compose up -d`) is fast.

---

## Step 4 · Validate with a persona scenario (locally)

This is where the local-first move pays off most. Persona scenarios cost zero LLM credits (they drive scripted policies through the existing atom loader) and are byte-deterministic (`SHA-256(persona.id + ':' + concept_id + ':' + atom_idx)` seed).

Build a TN-board persona at `data/personas/anitha-tn-12-anxious.yaml`:

```yaml
schema_version: 1
id: anitha-tn-12-anxious
display_name: "Anitha — TN Class 12, exam-anxious"
description: |
  Strong on Tamil Nadu syllabus calculation, freezes on unfamiliar JEE
  framings. Prefers geometric/visual intuition. Tripped on chain-rule
  sign errors recently.
seed:
  representation_mode: geometric
  motivation_state: anxious
  knowledge_track_id: TN-12-MATH
  exam_id: jee-main
  initial_mastery:
    limits-jee: 0.45
    derivatives-basic: 0.62
  recent_misconceptions:
    - m_inverts_chain_rule
    - m_drops_negatives
answer_policy:
  type: scripted
  rules:
    - on: first_exposure
      action: pick_distractor_kind
      kind: algebraic_trap
      probability: 0.6
    - on: default
      action: pick_correct
      probability_fn: mastery_plus_0_2
```

Run her through your blueprint:

```bash
npm run demo:scenario anitha-tn-12-anxious limits-jee --atoms 5
```

Then visit `/admin/scenarios` (still on `localhost:3000`). Find the run. Click **Show neutral version** on each event row.

> 🟢 **The success bar — three out of three for an anxious cohort:**
> 1. Personalised side leads with intuition; neutral leads with formal definition.
> 2. Personalised side references the Tamil Nadu state-board framing where the concept overlaps; neutral doesn't.
> 3. Personalised side phrasing is gentler ("let's see how this behaves" vs "consider the limit definition").
>
> Two of three is shippable. One of three means your rulesets aren't doing their job — go back to step 3.

---

## Step 5 · Snapshot the working state

When the local validation is clean, capture the state as a snapshot before pushing.

> **What Vidhya does:** every state worth deploying is a triple of (git tag, Docker image tag, markdown manifest). `npm run snapshot` writes a manifest with SHA, branch, version, migration count, exam packs, and a notes section for hypothesis + feedback.
>
> **What you do:** run the snapshot script.

```bash
npm run snapshot -- "tn-jee-anxious-pilot-v1"
# → Creates tag snapshot-YYYYMMDD-HHMM-tn-jee-anxious-pilot-v1
# → Writes docs/snapshots/snapshot-YYYYMMDD-HHMM-tn-jee-anxious-pilot-v1.md
# → Updates docs/snapshots/INDEX.md
```

Open the manifest, fill in the **Notes** section with your hypothesis (one paragraph): *"First TN-board cohort. Four cohort rulesets for anxiety/scaffolding. Three concept blueprints (limits, derivatives, continuity). Expecting +0.05 mastery lift over a 2-week window vs the same students on neutral content."*

Commit + push:

```bash
git add docs/snapshots/ data/personas/
git commit -m "snapshot: TN JEE anxious pilot v1 — initial blueprints + persona"
git push
```

> 🟢 **Why bother with snapshots.** In 2 months, after the lift ledger has had time to compound and you've made dozens of ruleset edits, you'll want to know exactly what state shipped on day 1. The snapshot is the contract. Without it, learnings can't be reproduced or rolled back.

---

## Step 6 · Set up the cloud deploy

The fastest path: Render auto-deploys from `main`. One click.

1. Sign in to https://render.com (free, no card for the free tier).
2. Click the **Deploy to Render** button in `README.md`.
3. Render reads `render.yaml`, provisions the service, and starts the first build (~5 minutes).

You'll get a URL like `https://vidhya-XXXX.onrender.com`. Bookmark it.

### Critical env vars to set on Render

The free-tier defaults work for a hello-world but the cohort use case needs four env vars set in the Render dashboard (Settings → Environment):

| Var | Value | Why |
|---|---|---|
| `DATABASE_URL` | (auto-provisioned by Render Postgres or your Supabase URL) | Required for blueprints, rulesets, lift ledger, persona scenarios |
| `GEMINI_API_KEY` | (your key from `aistudio.google.com`) | Required for actual content generation |
| `CRON_SECRET` | (a long random string — `openssl rand -hex 32`) | Required for nightly scheduled jobs to authenticate themselves |
| `VIDHYA_PEDAGOGY_GATE` | `on` | Tier 4 verifier blocks content that fails the rubric |

Two more are **optional but recommended for a real cohort:**

| Var | Value | Why |
|---|---|---|
| `VIDHYA_BLUEPRINT_LLM_JUDGE` | `on` | The arbitrator's LLM overlay (~1¢ per blueprint, large quality win) |
| `VIDHYA_LEDGER_PR` | `on` | Sundays-only auto-PR with the weekly digest into your repo (needs `gh` auth on the deploy; skip if you'd rather copy the digest manually) |

After saving env vars, trigger a manual deploy from the Render dashboard. Wait for the green check (~2 minutes).

> 🟢 **Sanity check.** Visit `https://your-deploy.onrender.com/api/auth/config`. You should see `{"local_dev": false, ...}`. If you see `local_dev: true`, your env vars didn't save — double-check.

### Your first cloud sign-in

The local dev quick-start panel is hidden in production (because `GOOGLE_OAUTH_CLIENT_ID` controls it). For the cloud deploy you have two options:

- **Option A (fastest, lowest friction):** keep using email/password sign-in. Email yourself an invite from `/admin/users` once you've signed up.
- **Option B (cleanest, recommended):** wire Google OAuth. Set `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_CLIENT_SECRET` from a Google Cloud Console project, redirect URI `https://your-deploy.onrender.com/auth/google/callback`. Sign in with your Google account; promote yourself to admin via psql or an existing admin's UI.

Once you're in as admin, you'll see the same screens as locally — but now with cloud DB + cloud LLM credentials.

---

## Step 7 · Push your blueprints + rulesets to the cloud

Three approaches, in order of cleanliness:

### Approach A — re-create them in the cloud UI (simplest, best for ≤5 blueprints)

The cloud UI is the same as your local one. Sign in, visit `/admin/rulesets` and `/admin/blueprints`, paste the same rulesets and blueprint JSON you'd authored locally. ~10 minutes if you have 5 of each.

> 🟢 **Why this is fine.** Blueprints and rulesets are small, structured, and you've already validated their JSON locally. There's no operational risk in re-typing them; the persistence layer enforces the same validators on both sides.

### Approach B — `psql` dump + restore (when you have ≥10 blueprints)

```bash
# Dump from local
docker compose exec db pg_dump -U postgres -t content_blueprints -t blueprint_rulesets postgres > blueprints.sql

# Edit blueprints.sql to remove the CREATE TABLE statements (the cloud DB
# already has them from migration 027/028). Keep just the INSERTs.

# Restore to cloud (use Render's "Connect" → External database URL)
psql "$RENDER_DATABASE_URL" < blueprints.sql
```

Mirrors local exactly. Risk: ID collisions if the cloud already has blueprints. Mitigation: `psql -c "DELETE FROM content_blueprints WHERE created_by = 'template';"` first.

### Approach C — author them ONLY in the cloud (most disciplined long-term)

The local stack stays for persona validation + dev. All real blueprints + rulesets live in the cloud DB. Your local environment becomes a sandbox; production state never leaves the cloud.

Pick one and stick with it. **For most admins, A is correct.**

---

## Step 8 · Launch the first production generation run

You're now in the cloud admin UI with your blueprints in place. Everything from this point lives in the [admin runbook](./admin-guide-jee-tn.md) — specifically [steps 6–9](./admin-guide-jee-tn.md#step-6--generate-content-at-scale-batch-mode).

The short version:

1. `/admin/content-rd` → set hypothesis, pick the blueprint, set $5 cost cap
2. **Dry run** — verify the cost estimate
3. **Launch** — runs in batch mode by default for unit-mode runs; ~24h SLA for results
4. Wait for the next morning, then check `/admin/content-rd` for the run status

> 🟢 **Cloud-vs-local cost reality.** The same generation run that cost you nothing locally (because Ollama or stubs) costs $3–5 in the cloud (Gemini Batch). Set tight `max_cost_usd` caps for the first three runs until you've calibrated the dry-run estimator vs actual cost. Variance >20% triggers a recalibration alert in the weekly digest.

---

## Step 9 · The ongoing monitoring loop

This is the steady state. Once the cloud deploy is humming, your admin work compresses to about 30 minutes a week.

### Daily (5 minutes if anything)

You don't need to do anything daily. The cron jobs run themselves:

- `batchPoller` every 5 min (drives in-flight batch runs forward)
- `rateLimitCheckpoint` every hour (flushes telemetry to disk)
- `learningsLedger` nightly (recomputes lift, auto-promotes/demotes, writes weekly digest)
- `cohortAggregator` nightly (rolls up `atom_engagements` for misconception cards)
- `regenScanner` nightly (auto-regen for students who tripped 3× on the same atom)

If a student is stuck, you find out from the weekly digest, not from a daily check.

### Weekly (30 minutes — the real loop)

| When | Where | What you're looking for |
|---|---|---|
| Mon AM | `/admin/content-rd` Effectiveness Ledger | Sort by **PYQ Δ**. Wins are auto-promoted; losses are auto-demoted. You're sanity-checking the math, not making decisions. |
| Mon AM | `/admin/holdout` 28-day timeline | The lagging north-star. Should be trending up on the concepts you generated for. If flat, your rulesets aren't differentiated enough — go to scenarios. |
| Mon AM | `docs/learnings/<YYYY-Www>.md` | The weekly digest. Reads like a one-pager. The **Rate limits hit this week** section tells you whether to nudge anyone toward batch mode. |
| Mon PM | `/admin/rulesets` | Based on what won this week, write 1 new ruleset. **One.** Resist over-engineering. |
| Mon PM | `/admin/blueprints` | If a clear winning shape emerged, supersede the loser blueprints with new ones using the winner's stages. The `superseded_by` chain preserves history. |

### Monthly (1 hour — the cost + drift check)

| Where | What |
|---|---|
| Render dashboard → Bandwidth + DB usage | Confirm you're still in free-tier limits. Free tier has ephemeral disk; if `.data/` is mission-critical, upgrade to a paid plan with a persistent volume mount. |
| `/admin/content-rd` Active Runs | Any runs stuck in `submitted` >24h? They're past Gemini Batch's SLA. Mark them failed + Resubmit. |
| `docs/snapshots/INDEX.md` | Is the last snapshot >4 weeks old? Run `npm run snapshot -- "monthly-checkpoint-$(date +%Y%m%d)"`. Capture the current state of blueprints + rulesets in the manifest notes. |
| `PENDING.md` | Re-read §14. Is anything you previously deferred now blocking you? Bump priority. |

---

## Step 10 · When something breaks

A short troubleshooting catalogue, ranked by what's most likely to bite an admin:

**"My local Postgres is gone after a restart."**
Free-tier ephemeral disk. `docker compose down -v` wipes the volume; restart re-runs migrations into a fresh DB. Either re-author your blueprints + rulesets (10 min, see step 7 approach A) or use a named Docker volume that survives restarts.

**"I clicked Test & save on the AI config page and got 'Test skipped — local endpoint'."**
Working as intended. The hosted server can't reach your laptop's `localhost:11434`. Click **Save without testing** — your browser will reach Ollama directly when you actually use the app.

**"`/admin/content-rd` shows 'DATABASE_URL not configured'."**
Render env var didn't save, or the cloud DB isn't provisioned. Settings → Environment → confirm `DATABASE_URL` is set; trigger manual deploy.

**"My batch generation run has been in `submitted` for 23 hours."**
Gemini Batch is at the edge of its 24h SLA. Wait; the next poller tick will likely transition to `downloading`. If it goes to `failed:provider_timeout` after 24h, click **Resubmit** — the same custom_ids re-submit, nothing duplicates.

**"The weekly digest shows blueprints I don't recognise."**
The arbitrator created them via `proposeBlueprint`. Filter `/admin/blueprints?created_by=arbitrator` to see them all. Each has a `rationale_id` per stage explaining why the LLM picked that atom_kind.

**"A student says she got the wrong answer marked correct."**
Check the verification log: `npx tsx src/gbrain/operations/verify-sweep.ts <atom_id>`. The 3-tier verifier (RAG cache → Gemini dual-solve → Wolfram Alpha) catches drift; if all three agree but the student is right, file the atom for human review.

---

## Step 11 · Backup + DR

Production state is in three places:

1. **Postgres** (Render-managed or Supabase): nightly snapshots are automatic on paid tiers. **Free tier doesn't auto-backup.** If you're on free tier, `pg_dump` weekly to a local file and commit to a private repo.
2. **`.data/` flat files** (rate-limit checkpoints, scenarios, neutral cache): ephemeral on Render free tier. Not mission-critical individually, but the rate-limit telemetry feeds the weekly digest. Backup script: `tar czf .data-$(date +%F).tgz .data/` from a local cron via SSH or scheduled GitHub Action.
3. **`docs/snapshots/`**: in git. Already backed up.

If a Render deploy goes pear-shaped:

```bash
# Roll back to the last snapshot
git checkout snapshot-YYYYMMDD-HHMM-tn-jee-anxious-pilot-v1
git push --force-with-lease origin main   # ⚠ only if you're certain; this overwrites
```

Render auto-deploys the rolled-back state. ~5 minutes to revert.

---

## What "effective monitoring" actually looks like

For TN-board, anxious, IIT-aspirant students specifically, three signals matter more than the rest:

### 1. PYQ accuracy delta (`/admin/holdout`)

The honest north-star. Anxious students are easy to over-coach with confidence-boosting feedback that doesn't actually move PYQ score. The holdout is the antidote — it's a frozen bank of past papers that students hit alongside their normal lessons. If their accuracy on holdout PYQs is flat while everything else looks great, your blueprints are training to the practice set, not to the real exam.

> 🟢 **Healthy curve:** the 28-day rolling holdout accuracy line trends up by 2-5 percentage points per month for the cohort. Flat or down → audit the persona side-by-side; your blueprints aren't differentiating from neutral.

### 2. Motivation state distribution (`/admin/cohort-analysis`)

The cohort-analysis CLI / page surfaces how motivation states are trending across all your students. For an anxious cohort:

- Healthy: `anxious` shrinks, `steady` grows, `flagging` stays small
- Worrying: `anxious` flat or growing, `frustrated` appearing
- Crisis: `flagging` >20% — students are checking out

Vidhya's calm-by-design choices (no streaks, no comparisons, gentle ruleset language) should pull the distribution up over weeks. If it doesn't, the cohort needs intervention beyond what the system can do alone — that's a teacher conversation.

### 3. Personalised regen rate

Visit `/admin/regen-monitor` (or check the nightly job logs). For each student, the system caps personalised variants at 1 per concept per week. If you see a student hitting the cap repeatedly, they're stuck in a way that the auto-regen can't fix.

> 🟢 **Concrete escalation rule:** any student with ≥3 personalised variants generated in a single week → run `npx tsx src/gbrain/operations/student-audit.ts <session_id>` and read the action plan. Usually the gap is a prerequisite concept the cohort never properly learned in school.

---

## TL;DR — the day-1 to week-4 path

If you can't read the whole guide:

```
Day 0:    docker compose up. Sign in as Admin (Arjun). 5 min.
Day 1:    Write 4 cohort rulesets (/admin/rulesets). 10 min.
Day 1:    Build 3 concept blueprints (/admin/blueprints). 30 min.
Day 1:    Validate one against Anitha persona. Side-by-side check. 15 min.
Day 1:    Snapshot. git push. Deploy to Render. 30 min.
Day 2:    Set Render env vars. Re-create blueprints in cloud UI. 20 min.
Day 2:    Launch first cloud generation run with $5 cap. Wait.
Day 3:    First run completes. Spot-check 3 atoms in the UI. 15 min.
Week 1:   Read the first weekly digest. Don't change anything. 30 min.
Week 2:   Add ONE ruleset based on what won. 15 min.
Week 4:   Holdout timeline check. Trending up?
            ✓ → keep iterating
            ✗ → audit persona side-by-side, rewrite rulesets
```

Everything else is depth on those steps.

---

## Where to next

| Task | Document |
|---|---|
| Day-to-day admin workflow | [admin-guide-jee-tn.md](./admin-guide-jee-tn.md) (the companion to this) |
| 3-minute moat demo to a prospect | [moat-demo.md](./moat-demo.md) |
| Customising the content module | [`../EXTENDING.md`](../EXTENDING.md) |
| Production hardening checklist | [`../PRODUCTION.md`](../PRODUCTION.md) |
| What's NOT done yet | [`../PENDING.md`](../PENDING.md) — esp. §14 for blueprint follow-ups |
| Project context for new agents | [`../CLAUDE.md`](../CLAUDE.md) |

---

## A note on responsibility

Vidhya is built around a specific bet: **the stressed student is the profitable one, and Vidhya refuses that trade.** As an admin running a real cohort, you're the person making sure that promise holds in practice.

That means:
- Don't write rulesets that demand "more practice" or "more review" — that's how anxious cohorts get worse.
- When the lift ledger demotes content, trust it. Reverting demotions because "but I liked that atom" puts ego over evidence.
- When a student is stuck, the right answer is usually a human conversation, not another regen.
- The seven surveillance invariants in `src/personalization/__tests__/surveillance-invariants.test.ts` are not bureaucracy — they are how the calm promise stays true at scale. If you ever find yourself wanting to relax one, the test failure is the system asking you to think twice.

You'll know the system is working when students stop apologising for missing things and start asking better questions. That's the signal we built it for.
