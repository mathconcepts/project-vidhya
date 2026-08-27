# Content Verification Runbook

**Owner:** Content Operations
**Plan:** `docs/designs/2026-08-27-content-readiness-market-research-integration.md` (W3.5, W1.3, D4, D15)
**Companion:** `docs/2026-08-09-gate-em-content-readiness-runbook.md` (the concept-level content plan; this file is the *verification* half)

---

## Purpose

This is the operator's procedure for the **50-item anatomy pilot** and the
wave-1 fill that follows it. Its output is not content — it is two
numbers:

1. **measured operator-minutes-per-verified-item**, and
2. **measured error rate** (share of generated items whose answer key the
   operator rejects).

Everything downstream is derived from those two: the sampled spot-check
rate, the wave-1 target, and whether the kill criterion trips. They are
recorded **into this file**, in §6, in the same commit as the pilot.

The plan's premise 5 is the reason: *verification labor, not generation, is
the inventory bottleneck.* The 123 hand-verified Linear Algebra items were
a significant one-operator effort. Anything that sets a fill target from a
guessed throughput is setting it from nothing.

---

## 1. Prerequisites

### 1.1 The clock has not started

Plan **E16** (clock honesty): live generation has **never run** in any of
this repo's environments — no provider key has ever been present. The
6-week kill clock in §7 starts when a working provider key exists in the
operator's launch environment, **not** when this file lands. The criterion
measures verification throughput, never key-provisioning delay.

### 1.2 Provider keys

| Need | Env var | Refused without it |
|---|---|---|
| Primary generation | any one of `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `OPENROUTER_API_KEY` | the run cannot generate at all |
| mcq / msq verification (dual-model consensus) | a **second** key on a **different** provider | `PracticeItemLaunchGuardError` at launch, naming the primary model |
| nat verification (Wolfram) | `WOLFRAM_APP_ID` | `PracticeItemLaunchGuardError` at launch |
| Persistence + the gate ledger | `DATABASE_URL` | review queue returns 503; no ledger, no promotion |

The two-provider requirement is not incidental. `answer-check.ts`'s
`resolveDistinctSecondaryModel` refuses a same-provider second opinion, and
`src/generation/practice-item-factory/launch-guard.ts` turns that into one
loud failure at launch instead of fifty quiet per-item refusals at poll
time. Confirm both keys before launching, not after.

### 1.3 Vidhya-side configuration

```bash
# Applied automatically at boot by src/db/auto-migrate.ts; listed so an
# operator can confirm them against a live database.
#   055_content_gate_ledger.sql   the five-gate ledger
#   050_assessment_contracts.sql  the marking contract the gate names
```

Sanity checks before launch:

```bash
npm run ci                     # every blocking gate, including ci:practice-items
npx tsx src/server.ts          # boot once; watch for migration 055 applying
curl -s localhost:8080/api/admin/review-queue -H "Authorization: Bearer $JWT" | jq
```

An empty `items: []` is the correct pre-pilot state.

---

## 2. What the gates are

Five named gates per item, in `content_gate_ledger` (migration 055),
written by `src/generation/gate-ledger.ts`:

| Gate | Decided by | Passes when |
|---|---|---|
| `scope` | pipeline | `concept_id` resolves in the concept graph and `topic` agrees with it |
| `mathematics` | **operator, always** | you approve the answer key at `/admin/review-queue` |
| `assessment_contract` | pipeline | `question_type` + `marks` + the answer field that kind needs + a resolved contract version |
| `misconception_coverage` | pipeline | every mcq distractor names a failure hypothesis (waived, with the untagged count recorded, when the run did not set `require_failure_tags`) |
| `provenance` | pipeline | the item carries `generation_run_id` **and** an `evidence_level` |

**The `mathematics` gate is never auto-passed.** The verification cascade's
agreement is written into the gate's `reason` as *evidence*; the verdict is
yours. `recordGates()` throws rather than write a decided verdict on it, so
this is a code path, not a convention.

**Scope (plan E8):** all of this applies **only** to items carrying
`generation_run_id` provenance. The 505 committed items in
`data/practice-items/` and the PYQ bank are covered by the floor gates
(`ci:practice-items`, `ci:syllabus-floor`, `ci:la-walkthrough`) plus the
hand-verification protocol, and the DB-less demo has no ledger and nothing
generated to gate. If you ever see a committed item in the review queue,
something has mis-stamped provenance — stop and investigate rather than
approving it.

**Enforcement lands in two places, both fail-closed:**

- **Serving** — `filterByGateLedger` in
  `src/scoring/learning-object-catalog-pg.ts` drops a provenance-carrying
  `generated_problems` row until all five gates are passed-or-waived.
- **Promotion** — `PgLearningsLedgerRepo.applyPromotion` refuses to flip
  `canonical = TRUE` on such a row for the same reason.

"Fail closed" means: no ledger row, an unreachable table, or a failed query
all read as *not passed*. An item nobody has gated stays invisible.

---

## 3. Launching the 50-item anatomy pilot

### 3.1 The wave-1 spec

The pilot batch is 50 items, generated against the **anatomy** shape the
plan's wave-1 runs use:

| Setting | Value | Why |
|---|---|---|
| Mode mix | 60% mcq / 20% msq / 20% nat | mirrors the GATE paper's own mix closely enough to measure per-mode review cost separately |
| `require_failure_tags` | **on** | makes `misconception_coverage` a real verdict rather than a recorded waiver, and forces W3.4's misconception-linked distractors |
| NAT tolerance | from the assessment contract, never hand-set | `resolveAssessmentContract()` supplies `tolerance_epsilon`; `deriveMarking` authors `max(0.01, 0.5%·\|v\|)` per item |
| Concepts | the top-10 leverage atoms: `LA-05, PS-03, VC-11, CA-21, CA-13, NM-08, NM-09, PS-04, DE-05, CA-18` | ordering is a `design_hypothesis`, per the plan — 5 items each |
| Cost cap | set `quota.max_cost_usd` deliberately | `cost-meter.ts` throws `RunBudgetExceeded` **before** the provider call, not after |

Config shape (`POST /api/admin/runs`, or the RunLauncher form):

```jsonc
{
  "target": {
    "practice_item_specs": [
      { "concept_id": "eigenvalues", "topic": "linear-algebra",
        "format": "mcq", "difficulty": 0.5, "require_failure_tags": true }
      // … 50 entries
    ]
  },
  "quota": { "count": 50, "max_cost_usd": 5.0 },
  "verification": { "tier_ceiling": "wolfram", "wolfram_required": true }
}
```

### 3.2 Honest gap in the launch path

**Read this before planning the pilot's first hour.** The repo wires
generation→verification→bank-write end to end *from the poll step onward*:
`handleJobProcessed` routes a practice-item job through parse → assemble →
verify → gate-ledger write → bank write, and every step of that is tested.
What is **not** in the repo is the step that turns
`config.target.practice_item_specs[]` into the `AtomSpec[]` handed to the
batch orchestrator's `prepare()`. Nothing calls `prepare()` with
`atom_specs` today.

So the pilot's launch is presently an **operator step**: build the
`AtomSpec[]` (one per spec, `prompt_vars` carrying `format`, `topic`,
`difficulty_frac`, and `require_failure_tags`) and drive
`createBatchOrchestrator(...).step()` from a script. Everything after
submission — polling, resume, ingestion, gating — is the shipped path.

This is written down rather than glossed because a docblock in
`curriculum-unit-orchestrator.ts` once claimed a wiring that did not exist,
and the repo lost a release to it.

### 3.3 Launch

```bash
# Confirm the guard passes BEFORE spending anything.
# A refusal here names the missing provider or key.
npx tsx -e "import('./src/generation/practice-item-factory/launch-guard').then(m => m.assertPracticeItemLaunchReady(specs, { primaryModelId: 'gemini-2.5-flash' }))"

# Then launch, and watch:
#   /admin/content-rd   → Active runs (status, cost, artifacts)
#   /admin/review-queue → items arriving as their gates are written
```

---

## 4. Reviewing through `/admin/review-queue`

The queue is the measuring instrument. Review **through it**, not by
editing JSON — a pilot run through a text editor measures a text editor
(plan D4).

**Per item, one row shows everything:** question, options with the proposed
key marked, the NAT accepted range, the worked solution, per-distractor
failure tags, and each of the five gates with its recorded reason.

**Controls:** checkbox + select-all, `j`/`k` (or arrows) to move, `space`
to toggle, `enter` to expand. Three decisions:

| Decision | Ledger effect | Notes |
|---|---|---|
| Approve | `mathematics` → `passed`, `decided_by` = you | item becomes servable/promotable once the other four are satisfied |
| Reject | `mathematics` → `failed` | **notes required** — the reason is refused as empty otherwise |
| Needs fix | stays `pending`, `decided_at`/`decided_by` stamped | stays in the queue, flagged `needs fix` |

**Discipline for the pilot specifically:** review every one of the 50. The
whole point is to measure the error rate on an unsampled batch, so that §5
can derive a sampled rate for everything after.

**The throughput meter** at the top of the page shows items decided this
session, elapsed, and minutes/item. The clock anchors at your **first
decision**, not at page load, so a tab left open over lunch does not
flatter the number. It is session-local and not persisted — copy it into
§6 at the end of the sitting. If you review across several sittings, record
each sitting as its own row and total them; do not average the averages.

---

## 5. Deriving the sampled spot-check rate

Once §6 has a measured error rate `e`, later modules are reviewed by
**sample**, not exhaustively. The rate is derived, not chosen.

Let a module contain `N` generated items, of which `e·N` are expected to
carry a wrong key. Reviewing a random sample of `r·N` of them catches at
least one bad item with probability

```
P(detect) = 1 − (1 − r)^(e·N)
```

Solve for the `r` that holds `P(detect) ≥ 0.95`:

```
r ≥ 1 − 0.05^(1 / (e·N))
```

Worked, for a 200-item module:

| measured `e` | expected bad items | required `r` | items to review |
|---|---|---|---|
| 0.20 | 40 | 7.2% | 15 |
| 0.10 | 20 | 13.9% | 28 |
| 0.05 | 10 | 25.9% | 52 |
| 0.02 | 4 | 52.7% | 106 |
| ≤ 0.01 | ≤ 2 | — | **review all** |

Two hard rules on top of the formula:

1. **`e > 0.15` → no sampling.** Review the module in full and fix the
   generation spec first. A sample cannot rescue a batch that is wrong one
   time in seven.
2. **`e ≤ 0.01` → review all anyway.** At that rate the formula demands
   nearly everything regardless, and the arithmetic stops being the reason
   to sample.

Re-derive `r` per module from that module's own measured `e`. A rate
carried forward from an earlier, easier topic is a guess wearing a
formula's clothes.

---

## 6. Measured results

> **This table is the deliverable.** It is committed empty and filled in by
> the operator who runs the pilot, in the same commit as the pilot's
> output. Every cell is measured. Leave a cell blank rather than estimating
> it — a blank says "not measured yet", an estimate says something false.

### 6.1 Anatomy pilot (50 items)

| Field | Value |
|---|---|
| Date run | |
| Run id (`generation_runs.id`) | |
| Provider(s) used | |
| Items generated | |
| Items refused pre-review (assemble / verification) | |
| Items reaching the review queue | |
| Items approved | |
| Items rejected | |
| Items returned as needs-fix | |
| **Measured error rate `e`** (rejected ÷ reviewed) | |
| Total review sittings | |
| Total elapsed review time | |
| **Measured minutes-per-verified-item** | |
| Total generation cost (USD) | |

### 6.2 Per-mode breakdown

| Mode | Reviewed | Rejected | Error rate | Min/item |
|---|---|---|---|---|
| mcq | | | | |
| msq | | | | |
| nat | | | | |

### 6.3 Derived targets

| Derived quantity | Formula | Value |
|---|---|---|
| Spot-check rate for the next module | §5 | |
| Wave-1 target (items in 6 weeks) | measured min/item × available operator hours | |
| Kill threshold check | see §7 | |

### 6.4 Observations

> Free text: which modes were slowest to review and why, what kinds of key
> errors appeared, what the generation spec should change before wave 1.

---

## 7. Kill criterion and reassessment

**Kill criterion (plan W3.5, locked):** if 6 weeks of wave 1 produce
**fewer than 300 verified items**, stop and reassess the protocol before
any wave 2.

The clock starts when a working provider key exists in the launch
environment (§1.1), and it measures verified items — items whose
`mathematics` gate an operator has passed — not generated items.

**Triggers a reassessment before the 6 weeks are up:**

- Measured error rate `e > 0.15` on any module. The generation spec is
  wrong; more volume multiplies the review cost rather than the inventory.
- Measured minutes-per-item more than 2× the pilot's number on a later
  module. Either the topic is harder than the pilot's or the queue is being
  used differently — find out which before extrapolating.
- Any provenance-carrying item found servable without five passed gates.
  That is an enforcement failure, and it invalidates the trust the whole
  ledger exists to create. Stop, fix, re-verify what shipped.

**What a reassessment considers, in order:** tightening the generation spec
(distractor rules, mode mix, difficulty), narrowing the concept set to
higher-leverage atoms, and only then changing the target. Lowering the
target because the protocol is slow is the one move that makes the number
meaningless.

---

## 8. Reference

| Thing | Where |
|---|---|
| Ledger schema | `supabase/migrations/055_content_gate_ledger.sql` |
| Gate evaluation + enforcement | `src/generation/gate-ledger.ts` |
| Review queue API | `src/api/admin-review-queue-routes.ts` |
| Review queue UI | `frontend/src/components/admin/ReviewQueuePanel.tsx` |
| Serving enforcement | `src/scoring/learning-object-catalog-pg.ts` (`filterByGateLedger`) |
| Promotion enforcement | `src/storage/repositories/learnings-ledger-repo.ts` (`applyPromotion`) |
| Item factory | `src/generation/practice-item-factory/` |
| Launch guard | `src/generation/practice-item-factory/launch-guard.ts` |
| Writer overwrite guard (D5) | `src/generation/practice-item-factory/writer.ts` |

---

*Runbook version 1.0 — 2026-08-27 — Project Vidhya. §6 unfilled by design.*
