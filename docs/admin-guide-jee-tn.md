# Admin guide: launching JEE prep for Tamil-Nadu-board, anxious students

> **Who this is for:** an admin running Vidhya for a real cohort. Specifically, the running example is **a small batch of Tamil Nadu state-board class 12 students preparing for IIT JEE Main, several of them anxious and low-confidence after a rough mid-term.** Substitute your own scenario freely — the steps are the same; the decisions are different.
>
> **What you'll build by the end:** a generation-and-measurement loop that produces lessons calibrated to *these* students (state-board prior knowledge, anxiety-aware tone, geometric framing where the syllabus allows it), measures whether the lessons actually move mastery, and auto-promotes the winners.
>
> **Time:** ~30 minutes for setup, then everything compounds.
>
> **Companion (read this first if you're starting from scratch):** [admin-getting-started.md](./admin-getting-started.md) — clones the repo, runs locally, snapshots, deploys to Render. **This guide picks up after you have the cloud deploy live.**

---

## The mental model

Vidhya separates **what you ask for** from **what gets generated**. There's a deliberate spec layer between them — a **blueprint** — that records explicit decisions: which atom kinds, in which order, with which constraints, and **why**. The admin's job is to author or approve good blueprints. Vidhya does the rest:

```
   YOU ──→  Blueprint  ──→  Generation run  ──→  Lessons
              │                    │                  │
              │                    │                  ├── Holdout PYQ accuracy
              │                    │                  ├── Mastery delta (lift_v1)
              │                    │                  └── Personalised per student
              │                    │
              │                    └── Cost-capped, batch-eligible, resumable
              │
              └── Operator rulesets attach as constraints
                  Persona scenarios validate the blueprint before it ships
```

You'll touch six screens. Bookmark them now:

| URL | Purpose |
|---|---|
| `/admin/exam-packs` | Define or pick the exam (e.g. `jee-main`) |
| `/admin/rulesets` | Cohort-wide constraints ("always lead geometric for vectors") |
| `/admin/blueprints` | The spec layer for a single concept |
| `/admin/scenarios` | Validate a blueprint against a persona before generating |
| `/admin/content-rd` | Launch generation runs + watch the effectiveness ledger |
| `/admin/holdout` | The honest accuracy signal against frozen past-paper PYQs |

---

## Step 1 · Pick (or build) the exam pack

> **What Vidhya does:** an exam pack is a YAML or DB-defined config that names the syllabus, sections, weights, holdout PYQs, and capability flags (e.g. `interactives_enabled`). `jee-main` ships canonical; you don't usually need a custom one.
>
> **What you do:** confirm `jee-main` is the right target. Visit `/admin/exam-packs`.

For this scenario `jee-main` is correct — IIT JEE Main is the test, the holdout PYQ bank is already seeded (≥30 stratified questions), and the pack has `interactives_enabled: true` so manipulables and simulations can ship.

> 🟢 **Try this.** Pull up a holdout snapshot at `/admin/holdout?exam=jee-main` to see what the PYQ ground truth looks like before you generate anything. The accuracy timeline starts empty; you'll watch it move as your students attempt these.

If you were running a niche custom exam (e.g. a mock test for a specific coaching centre), this is where you'd `POST /api/admin/exam-packs` to register it. You don't need that here.

---

## Step 2 · Tell Vidhya about your cohort's prior curriculum

> **What Vidhya does:** the `student_context` payload (PR #37) threads the student's `knowledge_track_id` into every generated atom's prompt. A Tamil Nadu state-board student gets atoms that lean on the framings she already knows; a CBSE student gets a different prompt for the same JEE concept.
>
> **What you do:** make sure the right knowledge track exists. `src/knowledge/tracks.ts` already lists `TN-12-MATH` (Tamil Nadu Class 12 Mathematics). When students sign up they pick this track in onboarding; the prior-curriculum signal flows from there.

There's nothing for the admin to do here unless the track is missing — in which case add it via PR to `src/knowledge/tracks.ts` (small change, gets picked up at next deploy).

> 🟢 **Sanity check.** As a temporary test, sign in as a demo student, set their exam profile to `{ exam_id: 'jee-main', knowledge_track_id: 'TN-12-MATH' }`, then watch a generated atom — the prompt should reference Tamil Nadu Class 12 framing. The mechanism is documented in CLAUDE.md under §5.2.

---

## Step 3 · Encode the cohort's character with rulesets

This is where your knowledge of *these specific students* shows up in the system.

> **What Vidhya does:** `/admin/rulesets` (PR #54) lets you author plain-text constraints scoped by `(exam_pack_id, concept_pattern)`. The arbitrator reads applicable rulesets and threads them as `constraints` into every blueprint it produces. They appear in the generation prompt and the LLM judge respects them.
>
> **What you do:** write 3–5 short rulesets that capture what's distinctive about this cohort.

For Tamil-Nadu-board, anxious, IIT-aspirant students, four concrete rulesets:

```
Exam pack: jee-main
Concept pattern: %       (whole pack — applies everywhere)

Rule 1: "Lead with intuition before any formal definition. These students freeze
         when jargon appears first."

Rule 2: "Where possible, tie new concepts to the Tamil Nadu Class 12 syllabus —
         students recognise vectors and calculus from the state board, but
         the JEE framings push further. Build on what they already trust."

Rule 3: "Default tone: gentle and concrete. One step at a time. Avoid 'obviously',
         'clearly', 'trivially', and any phrasing that implies a missed concept
         is unusual."

Rule 4: "When introducing a new technique, anchor it to a real PYQ from the
         last 5 years. These students have been told for a year that JEE is
         hard; show them the actual question is approachable."
```

> 🟢 **Try this.** Visit `/admin/rulesets`. Click **New ruleset**. Set `exam_pack: jee-main`, `concept_pattern: %`, paste rule 1. Save. Repeat for 2, 3, 4. Each one is independently toggleable — disable one, the next blueprint won't include it.
>
> **For concept-specific rules** (e.g. "for vectors-jee, always include 2D geometric framing first"), use a tighter pattern like `vectors-%` or just `vectors-jee`.

> ⚠ **Surveillance discipline.** Rulesets are about *content*, not *students*. Don't write rules like "remember Priya struggles with limits". The system enforces this — surveillance invariant 8 will reject rulesets that include behavioural field names. The right path for student-specific calibration is the personalisation layer (mastery vector, recent misconceptions); rulesets stay cohort-wide.

---

## Step 4 · Build a content blueprint

A blueprint is the spec for ONE concept. You'll author one per concept you're prepping (start with 3–5 concepts; iterate from there).

> **What Vidhya does:** the `proposeBlueprint(input)` function produces a structured plan — stages, atom kinds, constraints, rationale ids — either deterministically (template) or via LLM arbitrator that overlays the template. Both paths feed your rulesets in. The blueprint is human-editable JSON before generation fires.
>
> **What you do:** create the blueprint, review the stages, edit anything that's wrong, approve.

Concrete example for `limits-jee` (a calculus concept on the JEE Main syllabus, also covered in TN Class 12):

1. Visit `/admin/blueprints` → **New blueprint**.
2. Fill in:
   - `concept_id: limits-jee`
   - `exam_pack_id: jee-main`
   - `target_difficulty: medium`
   - **Run arbitrator (LLM may override template)**: ✓ checked. With your rulesets in place, the arbitrator reads them and may shift the intuition stage to `simulation` instead of `visual_analogy` (limits benefit from a watching-the-slope-shrink animation).
3. Click **Build from template** (despite the name, it routes through the arbitrator when the checkbox is set).

You'll land on the blueprint detail. You'll see something like:

```yaml
Stage 1 · intuition       → simulation         (concept_is_geometric)
                                                Plot the secant slope as h shrinks; show the limiting line.
Stage 2 · discovery       → manipulable        (param_space_small_enough)
Stage 3 · worked_example  → worked_example     (default_template)
Stage 4 · practice        → mcq × 4            (default_practice_mix; easy 30 / med 50 / hard 20)

Constraints:
  • no_jargon_first_definition          (template)
  • rs_a1b2c3d4 (rule 1)                (ruleset)
  • rs_e5f6g7h8 (rule 2)                (ruleset)
  • rs_i9j0k1l2 (rule 3)                (ruleset)
  • rs_m3n4o5p6 (rule 4)                (ruleset)
```

The `rationale_id` after each stage is the join key for the lift ledger. Six months from now the system will be able to tell you "blueprints with `simulation` intuition and `param_space_small_enough` discovery had +0.07 lift over their `visual_analogy` siblings for `limits-jee`". That's the compounding payoff.

### Decision points an admin might hit

**The arbitrator suggested `visual_analogy` but I want a `manipulable` for intuition.**
Click **Edit JSON**. Change `stages[0].atom_kind` to `"manipulable"`, set `rationale_id` to `param_space_small_enough` (so the ledger groups your override with similar overrides). Save. The ETag concurrency check will warn you if someone else edited in the meantime.

**The blueprint is good but the practice difficulty mix is too hard for an anxious cohort.**
Edit JSON. Change `stages[3].difficulty_mix` from `{ easy: 30, medium: 50, hard: 20 }` to `{ easy: 50, medium: 40, hard: 10 }`. The validator enforces the sum-to-100 invariant — if you typo'd, you'll get a clear 400 error.

**I want this blueprint to require human approval before any run uses it.**
Edit JSON, set `requires_review: true` (or use the **Needs review** badge if it's already showing). Approved-by tracking is recorded on the row.

> 🟢 **Approve when satisfied.** Click **Approve**. The blueprint locks for the next generation run. Future edits create a NEW blueprint with `superseded_by` pointing back, so the audit trail is preserved.

---

## Step 5 · Validate the blueprint with a persona scenario (the moat surface)

Before you spend any LLM dollars generating real content, prove the blueprint will land.

> **What Vidhya does:** `/admin/scenarios` (PRs #41–#43) drives a scripted persona through atoms generated for a concept. The persona has a deterministic answer policy — anxious students pick the algebraic-trap distractor 60% of the time on first exposure; driven students pick correct 70%+ of the time. The trial outputs a JSON ledger and a side-by-side comparison: **what your blueprint produced vs what a generic prompt would have produced.**
>
> **What you do:** build a persona for your cohort, run a scenario, look at the side-by-side. If the blueprint side is meaningfully different and feels right, you're ready to generate at scale.

Two locked personas ship in the repo:

- `priya-cbse-12-anxious` — CBSE-12, anxious, geometric reasoner. Closest to your TN-12 cohort character even though the board differs.
- `arjun-iit-driven` — IIT-aspirant, driven, algebraic. Useful as a foil to confirm your blueprint isn't ONLY anxious-friendly.

**For the running scenario,** drop a TN persona file at `data/personas/anitha-tn-12-anxious.yaml`:

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

Then drive the trial:

```bash
npm run demo:scenario anitha-tn-12-anxious limits-jee --atoms 5
```

This deterministically runs Anitha through the first 5 atoms loaded for `limits-jee`. The trial JSON lands at `.data/scenarios/<run-id>/`. Visit `/admin/scenarios`, find the run, and click **Show neutral version** on each event row.

> **What you're looking at.** Left pane: the atom served to Anitha (calibrated by the blueprint + her student context). Right pane: what a *generic* prompt would have produced for any student. The difference is the moat. If the difference is invisible, your rulesets aren't doing their job — go back to step 3.

> 🟢 **Concrete success criteria.** For an anxious-cohort blueprint:
> - The personalised side leads with intuition; the neutral side often leads with formal definition.
> - The personalised side references Tamil Nadu state-board terminology where the concept overlaps; the neutral side doesn't.
> - The personalised side phrasing is gentler ("let's see how this behaves" vs "consider the limit definition").
>
> If two of three are visibly different, the blueprint is doing its job. Ship it.

---

## Step 6 · Generate content at scale (batch mode)

> **What Vidhya does:** `/admin/content-rd` is the operator surface for launching `GenerationRun`s. Every run wraps in an experiment, has a cost cap, dual-metric lift measurement (mastery + PYQ accuracy delta against holdout), and — for any run > 5 atoms — should ride the Gemini Batch path. Batch is ~50% cheaper, async (24h SLA), no rate-limit pain. Mid-flight resume is built in: a server crash mid-batch picks up exactly where it left off after the boot poller fires.
>
> **What you do:** point the run at the blueprint, set a cost cap, hit launch.

The launcher form:

| Field | Value for this scenario |
|---|---|
| **Exam pack** | jee-main |
| **Hypothesis** | "Anxious TN-12 cohort — geometric-first blueprints with state-board scaffolding lift mastery on limits and derivatives." |
| **Mode** | Curriculum unit |
| **Blueprint** | (paste the `bp_xxx` id you approved in step 4) |
| **Count** | 12 (4 per concept × 3 concepts: limits, derivatives, continuity) |
| **Max cost** | $5 (tight; the dry-run estimator will warn if your blueprint shape costs more) |

> 🟢 **Click "Dry run" first.** The estimator reads your blueprint, projects per-atom cost, and tells you "this run will cost ~$3.20 over ~14 minutes". If the cap is too tight, it warns. Free signal before you spend.

The batch path: **default ON** for unit-mode runs with `count > 5`. The launcher creates the run with `batch_state='queued'`, the next 5-min poller tick prepares + submits to Gemini Batch, and the status pill in `ActiveRunsPanel` shows `batch:submitted` with an ETA.

### What if the run fails mid-flight

It can't lose work. The five-state machine + per-atom `processed_at` flag means:

- **Server restart**: boot poller resumes from the persisted state. Provider de-dupes on `display_name=run_id`.
- **JSONL on disk wiped** (Render free-tier ephemeral disk): rebuilt deterministically from `batch_jobs` rows.
- **Provider 24h timeout**: marked `failed:provider_timeout`. Click **Resubmit** in `ActiveRunsPanel`. The same custom_ids re-submit; nothing duplicates.
- **Cost cap exceeded mid multi-batch**: 3-of-5 batches succeed, 2 are marked `budget_exceeded`. Click **Resume with new budget** to fund the rest.

> 🟢 **Watch the cost meter.** `cost_usd` updates as results land. You'll typically see actual cost within ~10% of the dry-run estimate; >20% drift triggers a recalibration alert in the weekly digest.

---

## Step 7 · Watch the effectiveness ledger

After your run completes, the new atoms are in `generated_problems` with `canonical=false` (yet). They're served to students; their attempts populate `mastery_snapshots` and (when they hit holdout PYQs) the accuracy timeline.

> **What Vidhya does:** the nightly **learnings ledger** (Sprint C) recomputes lift for every active experiment, **auto-promotes winners** to canonical, **auto-demotes losers** so they stop being served. Both metrics gate the promotion: `lift_v1 > 0.05 ∧ p < 0.05 ∧ n ≥ 30`. The ledger writes a markdown digest to `docs/learnings/<YYYY-Www>.md` weekly; on Sundays (gated by `VIDHYA_LEDGER_PR=on`) it can open a PR with the digest.
>
> **What you do:** open `/admin/content-rd` → Effectiveness Ledger. Sort by **PYQ Δ** (the lagging north-star metric). Look for two things:

1. **Wins** — green rows with `lift > 0.05` and `p < 0.05`. Already promoted. Their blueprint shape is what you want to do more of.
2. **Losses** — red rows with `lift < -0.02`. Already demoted. Their blueprint shape is what to avoid. Look at the `rationale_id`s in the blueprint — what choice trended down? That's what your next ruleset should override.

> 🟢 **Concrete operator move at week 2.** Open the digest. You'll see e.g. "blueprints with `simulation` intuition for limits had +0.08 lift; blueprints with `worked_example` intuition had -0.01". Visit `/admin/rulesets`, write a new rule: "For limits-%, always lead with simulation intuition rather than worked_example". Bake the win into the next round.

---

## Step 8 · Monitor a single struggling student

Aggregate lift is great, but admins also need to answer: *"why is Anitha stuck?"*

> **What Vidhya does:** `npx tsx src/gbrain/operations/student-audit.ts <session-id>` produces a deep 360°: mastery heatmap, error patterns, prerequisite alerts, motivation trajectory, and a 3-session action plan. It calls into the student model, error log, and exam profile.
>
> **What you do:** when a teacher / parent flags a student, run the audit, read the action plan, decide which atom to regenerate.

For Anitha specifically: if the audit shows three failures on the same `(student_id, atom_id)` pair within 7 days, the **personalised regen** path (PR #5/E5) auto-fires. A custom variant is generated with her error pattern threaded into the prompt and written to `student_atom_overrides` with a 14-day expiry. She sees the variant on her next atom load — not 24h later, not after operator approval. The cap (1 personalised variant per concept per week per student) prevents thrash.

> 🟢 **You usually don't need to do anything for personalised regen.** It's autonomous. The student-audit CLI is for the harder cases where regen has fired but mastery still isn't moving — the audit surfaces the prerequisite gap, and you decide whether to schedule a teacher session, a different concept, or a different blueprint shape.

---

## Step 9 · Iterate

The compounding loop:

1. Each week the ledger auto-promotes wins + demotes losers
2. The digest tells you which blueprint patterns won + lost
3. You write 1-2 new rulesets that bake the wins in
4. Next week's blueprints inherit those rulesets
5. Lift compounds; cost stays flat

Three checkpoints worth marking on your calendar:

| Checkpoint | What to do |
|---|---|
| **End of week 1** | Open the first weekly digest. Read it. **Don't change anything.** Build intuition for what the data looks like. |
| **End of week 2** | First ruleset edit based on what week 1 showed. Pick ONE clear win to bake in. Resist the urge to over-engineer. |
| **End of week 4** | Run the holdout dashboard. The 28-day accuracy timeline should show movement on the concepts you generated for. If it doesn't, the issue is upstream — your blueprints aren't differentiated enough from neutral. Go back to step 5 and audit the persona side-by-side. |

---

## What you're NOT doing

This guide deliberately doesn't cover:

- **Writing prompts directly.** Vidhya's whole point is that the prompt is generated from the blueprint + student context. If you find yourself wanting to edit a raw prompt, the right move is to write a ruleset instead — it'll affect every future blueprint, not just one.
- **Approving every atom.** That's the trap the system was built to avoid. You approve **blueprints**; the orchestrator generates against them; the ledger decides what's canonical based on measured outcomes. Operator review at the artifact level doesn't scale.
- **Logging student behaviour into rulesets.** Rulesets describe content, not students. Student-specific calibration goes through the personalisation layer (mastery vector, recent misconceptions, prior curriculum) — surveillance invariant 8 enforces this at CI time.
- **Hand-curating a "course".** The unit of work is a blueprint per concept, not a course-wide outline. The exam pack provides the syllabus; blueprints provide the per-concept treatment; the orchestrator composes the lessons.

---

## Surveillance discipline (don't skip this)

Vidhya's positioning (`POSITIONING.md`) explicitly refuses streaks, comparisons, leaderboards, and surveillance language. Seven CI invariants enforce this in code. As an admin, the practical implications:

1. **Don't author rulesets that name students or reference their behaviour.** "Lead with intuition" is correct. "Help anxious students" is correct (cohort-level). "Help Priya with limits" is wrong (student-level).
2. **Don't expose blueprint internals to students.** The `/admin/*` pages are admin-only and gated by `requireRole('admin')`. Surveillance invariants 6 + 7 enforce this.
3. **Don't add columns named `tracked_*`, `behavior_*`, `personalized_*` to schema.** Surveillance invariants 1 + 8 fail the build if you do.
4. **The student never sees a sentence that references their data** ("we noticed you struggled with X"). The personalisation layer threads it into the LLM prompt only — the prompt formatter (`toPromptText` in `student-context.ts`) is the SOLE boundary where context fields cross into externally-visible bytes.

If a future feature legitimately needs to relax one of these, the convention is to update the invariant test in the same PR with `INTENTIONAL: relaxes invariant N because [reason]` in the description. The test failure forces the conversation.

---

## TL;DR — minimum viable launch

If you can't read the whole guide:

```
1. Pick the exam pack       →  /admin/exam-packs (jee-main is fine)
2. Write 4 rulesets         →  /admin/rulesets   (cohort-wide)
3. Build a blueprint        →  /admin/blueprints (one concept; arbitrator on)
4. Validate with a persona  →  npm run demo:scenario; /admin/scenarios
5. Launch a generation run  →  /admin/content-rd (batch mode, $5 cap)
6. Read week 1 digest        →  docs/learnings/<week>.md
7. Iterate                  →  add 1 ruleset based on what won
```

Everything else is depth on those seven steps.

---

## Where things live in the codebase

| Surface | Code |
|---|---|
| Exam packs | `src/curriculum/exam-loader.ts`, `data/curriculum/jee-main.yml` |
| Rulesets | `src/blueprints/rulesets.ts`, `/api/admin/rulesets` |
| Blueprints | `src/blueprints/`, `/api/admin/blueprints` |
| Arbitrator | `src/blueprints/arbitrator.ts` |
| Persona scenarios | `src/scenarios/`, `data/personas/`, `/api/admin/scenarios` |
| Generation runs | `src/api/admin-runs-routes.ts`, `src/generation/` |
| Batch generation | `src/generation/batch/` |
| Lift + ledger | `src/experiments/lift.ts`, `src/jobs/learnings-ledger.ts` |
| Personalisation | `src/personalization/`, `src/personalization/student-context.ts` |
| Holdout PYQs | `src/api/admin-holdout-routes.ts`, `scripts/seed-pyq-holdout.ts` |
| Surveillance invariants | `src/personalization/__tests__/surveillance-invariants.test.ts` |

The pending ledger (`PENDING.md` §14) lists what's deferred — read it before starting any new feature.
