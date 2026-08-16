# Scaling the stance axis to the whole course

Status: reviewed (`/plan-eng-review`, 2026-08-16). Six issues raised, six resolved.
Scope: all 97 concepts. 566 new variant files.

## The problem, in numbers

The confident/unconfident axis works. It reaches 3 concepts.

```
concepts with atoms          97
concepts with stance variants 3     3.1%
atom files                  793
variant files                16     2.0%
code paths that GENERATE a variant   0
```

All 16 variants were written by hand. Nothing in the codebase has ever produced
one. Interactives are *not* the gap — 96 of 97 concepts already carry an
`interactive-spec`, across 125 atoms and 81 gif-scenes.

The bottleneck is that the cadence is undocumented. The recipe — concrete
numbers before symbols, picture before formula, explicit check, name the one
thing to hold onto, no reassurance — exists only as prose comments inside the
16 authored files. A generator cannot follow it and a gate cannot check it.

## Target

```
97 concepts × 3 narrative atoms (hook, intuition, worked_example) × 2 stances
  = 582 variants
  − 16 already authored
  = 566 new files
```

Verified: all 97 concepts have all three narrative atoms. Zero partials.
No concept gets skipped.

`formal_definition` and `micro_exercise` are deliberately excluded. A definition
does not have a confident and an unconfident form; an exercise with a marked
answer gains nothing from register and doubles the surface for a wrong mark.

## Data flow

```
templates/<topic>.yaml
  stances: { shaken: "...", assured: "..." }        ← the cadence, 6 files
        │
        ▼
  variant generator  (thinking tier)
        │  reads base atom, rewrites prose,
        │  COPIES fenced blocks verbatim
        ▼
  equivalence judge  (intuition + worked_example only, 388 pairs)
        │
        ├── contradicts base ──▶ .data/variant-drafts/   (not served, not lost)
        │
        └── agrees
                ▼
  modules/project-vidhya-content/concepts/<c>/atoms/<atom>-<stance>.md
        │
        ▼
  scripts/check-variant-agreement.ts   ← CI, every PR, every pair, free
        │  fenced blocks byte-identical
        │  concept_id + atom_type match base
        │  variant_of resolves, for_stance ∈ {shaken, assured}
        ▼
  atom-loader.loadConceptAtoms()
        │
        ▼
  foldStanceVariants()      ← unchanged. Already concept-agnostic.
        ▼
  applyStanceVariants(atoms, deriveFraming(...).stance)
        ▼
  the student
```

The read path takes **zero** changes. That is the point: `foldStanceVariants`
has no per-concept coupling, so 566 new files work the day they land.

## Decisions

| # | Decision | Why |
|---|---|---|
| 1A | Generator writes `.md` files, not `atom_versions` rows | `foldStanceVariants` runs only on disk-parsed files (`atom-loader.ts:171`); `atom_versions` has no `variant_of`/`for_stance` column in any migration. A DB variant is unservable. Files also work DB-less, which is where the demo runs, and produce a reviewable diff. |
| 2B | Deterministic CI gate + LLM judge on maths atoms | Structure is exactly checkable; claims are not. Display math is a free variable — `intuition.md` has one `$$` block, `intuition-assured.md` has none, `worked-example.md` has none and its shaken variant has seven. No containment rule survives the accepted exemplars. |
| 3A | Cadence lives in `templates/<topic>.yaml`, not the blueprint | That file already carries per-topic, per-atom-type authoring guidance, on disk, DB-less, already consumed by the generator. Blueprint v1 is permanent (`types.ts:10`), so routing it there costs a `decisions_v2` column and parallel type to store a paragraph. |
| 4A | One motivation vocabulary, exported | Seven hand-typed lists with four memberships. Already caused one defect and is causing a second. |
| 5A | Mutation tests on all three content gates | A gate you have not watched fail is a gate with no evidence it works. |
| 6A | Judge failure fails closed, draft kept outside the content tree | A missing variant is an already-tested state. An unchecked file that looks checked is not. |

## Design decisions

From `/plan-design-review`, 2026-08-16. Eight issues, all resolved. Overall
design completeness 3/10 → 9/10.

The measurement that drove most of them: the shaken variants are **~60% longer**
than their base atoms (`hook` 81→125 w, `intuition` 258→411 w,
`worked_example` 311→497 w) and add up to three `h2` headings, each rendering at
20px with 24px of top margin. `framingInstructions` describes that student as
*"close to giving up"* and asks for *"one concrete, immediately doable
correction."* The authored variants expand instead. Whatever shape these 16
files have is the shape 566 generated files will copy.

| # | Decision | Why |
|---|---|---|
| 1A | Extra scaffolding goes into the `guided_walkthrough` spec, not the prose. Prose is capped by an absolute budget (see R1A). Headings ≤ base + 1, no `h1`. | A struggling student needs more support, not more text on screen at once. `guided_walkthrough` is already 105 of 125 interactive uses and reveals steps on demand. **Amends decision 2B** — see R2A for the exact comparison rule. |
| 2A | Coverage shows two figures — in-rollout (denominator = concepts whose topic template has a `stances` block) and course-wide (denominator = 97) — plus a distinct `rejected` count. | The current counter skips concepts with no variants. Correct today; during a 6-PR rollout it reads near-100% throughout, and a topic the judge rejected wholesale disappears rather than showing as a problem. |
| 3A | `student-model.ts:246` uses `STRUGGLING_STATES` instead of the literal `'frustrated'`, and lifts to `'steady'` after 2 consecutive correct rather than 1. | Recovery currently fires only for `frustrated`. `anxious` and `flagging` never recover, so those students stay shaken permanently — including both demo personas. A framing that cannot notice improvement contradicts Compounding, the product's stated memorable thing. A 2-streak rather than 1 keeps the register from flipping on a lucky guess. |
| 4A | Gate additions: opening 4-gram repeated across >20% of a topic's variants fails; `h1` inside an atom body fails; any emoji fails. Cadence carries an explicit "vary the opening move" constraint. | *"one X at a time"* already opens 3 of 8 hand-authored shaken variants (38%). A generator given one cadence paragraph 291 times will do this much harder, and prose sameness is the AI-slop failure mode no human catches across 566 files. |
| 5A | Variants never render `ReceiptBorder`. | A judge pass verifies the variant does not contradict its base. It makes no claim about whether the base is correct. The receipt border is the product's one visual promise; attaching it to a weaker check is how it stops meaning anything. A base atom's own receipt is inherited unchanged. |
| 6A+ | Fix `GuidedWalkthrough` (type to the 17px floor, 44px target, drop reserved indigo, add `prefers-reduced-motion`) **and** sweep reserved indigo from `Manipulable:80`, `DesmosLite:130`, `Verify:118`. | Four design-system non-negotiables broken in the component 1A makes load-bearing: the revealed answer renders at 12px behind a ~26px button in the reserved AI accent, with no reduced-motion support. Scope extended to all four call sites by operator decision. `Verify:118` needs care — green there may read as "already marked correct"; prefer a neutral fill. |
| 7A | Regenerate the 3 demo concepts through the new pipeline as its first end-to-end run; diff against the hand-authored originals and keep the better file each time. | The 16 exemplars fail two of the gates derived from them (the `h1` in `orthogonality/worked-example-shaken`, and the 38% repetition). Regenerating resolves that and proves generator + judge + gates on content that can be judged at a glance, before 566 files. Originals stay in git as the comparison. |
| 8A | `served_stance` stays invisible to students; the operator walkthrough surfaces it per atom as `band / stance / mode`. | Telling a student they got the gentler version is the labelling that makes someone feel handled. But the demo's central claim needs evidence, and `served_stance` is that evidence sitting unread. Different audiences, different answers. |

**Stated default, not a decision to defer:** a topic whose judge rejects some
files ships partial. 2A's `rejected` count is what makes the gap visible rather
than silent.

## Eng review re-run (against the design decisions)

`/plan-eng-review`, second pass, 2026-08-16. Two of the design decisions
specified gates that could not be built as written. Both corrected here.

**The measurement that forced R1A.** Raw word counts understated the problem
because they count LaTeX tokens. Measured on prose alone (LaTeX and fenced
blocks stripped), variants run **2.0× to 4.6×** their base — and `assured`
inflates as much as `shaken` (2.45×, 2.90×, 3.88×). So this is not a
too-gentle cadence; authored variants systematically expand. They also converge
on a house length of ~130–210 prose words *regardless of base length*
(`determinants/intuition`, the longest base, is the only pair that shrinks, at
0.84×). A `≤ base` rule therefore punishes concepts whose base happened to be
terse and would have rejected 14 of the 16 authored files.

| # | Correction | Why |
|---|---|---|
| R1A | Prose budget is **absolute per atom type**, not relative to base: `hook ≤ 130`, `intuition ≤ 200`, `worked_example ≤ 220`, measured with LaTeX and fenced blocks stripped. Budgets live in `templates/*.yaml` so a topic can raise its own. | Calibrated from the 16 authored files: passes 14, fails 2 genuine outliers (`determinants/worked-example-shaken` at 270, `orthogonality/worked-example-assured` at 229), both of which T15 regenerates anyway. Measures reading load rather than LaTeX density. |
| R2A | The `guided_walkthrough` carve-out is **field-level, not block-level**. `kind` must match. `title`, `caption`, `steps[].prompt`, `steps[].hint` may differ. The base's sequence of `steps[].answer` (and `eqn`) must be a **subsequence** of the variant's, in order, and the final answer must be byte-identical. An unparseable spec in either file refuses the variant. | "Skip walkthroughs when comparing" would have left 105 of 125 interactive blocks ungated for answer drift — reintroducing exactly what 2B prevents, in the component 1A steers shaken students into by default. Subsequence rather than equality is what still permits inserting intermediate steps. |

**Estimate correction, not a decision change:** T13 is not a three-line edit.
`student_model` is column-per-field (`011_gbrain_cognitive_architecture.sql:8`)
with no `correct_streak` column, so the 2-streak needs migration 035 plus the
interface field and UPDATE statement. Idempotent and auto-applied at boot like
034, so low risk — but a migration.

**Resolved from the design review's open concern:** `Verify.tsx:118` should use
`--surface-fill-strong` (`colors.css:36`), not green. Green carries the mastery
meaning and would read as "already marked correct" on a control that has not
run yet.

## What already exists

| Piece | Reused or rebuilt |
|---|---|
| `foldStanceVariants` / `applyStanceVariants` | Reused unchanged. Concept-agnostic already. |
| `deriveFraming`, `framingSignature` | Reused unchanged. |
| `templates/<topic>.yaml` | Extended with a `stances` block. Not replaced. |
| `check-content-integrity.ts`, `check-demo-rails.ts` | Joined by a third gate; both backfilled with tests. |
| `generateConcept` + thinking/formatting tiers (v4.32.0) | Reused as the generation engine. |
| `experiments` / `lift_v1` machinery | Untouched. `target_kind` already accepts `'atom'`. |
| Interactive widgets | Untouched — already on 96/97 concepts. |
| `stanceCoverage()` | Already wired to `admin-content-maturity-routes.ts:311`. Extended to report per concept. |

Nothing here rebuilds an existing flow.

## NOT in scope

| Deferred | Rationale |
|---|---|
| DB-backed variant storage (`variant_of`/`for_stance` on `atom_versions`) | Would need a migration, a second fold site, and two fold implementations kept in agreement — the drift class the repo already warns about. Files cover every current need. |
| Blueprint stance axis for cadence attribution | TODOS.md. Needs a second cadence and n≥30 per arm before it can measure anything. |
| `formal_definition` / `micro_exercise` variants | A definition has no confident form; a marked exercise doubles the wrong-mark surface for no register gain. |
| Per-student generated bodies | `student_atom_overrides` already does this and is out of scope here. |
| Retiring the `confident` motivation value from persona fixtures | None use it; only the two unreachable code branches are removed. |

## Failure modes

| Codepath | Realistic production failure | Test? | Handled? | Visible? |
|---|---|---|---|---|
| Generator writes a file | Clobbers a hand-authored variant | **must add (CRITICAL)** | must add: refuse if file exists | silent today |
| Generator copies fenced block | Regenerates instead of copying → widget drifts | **must add** | CI gate catches at PR | caught |
| Judge | Times out mid-batch | must add | 6A: fail closed, draft to `.data/` | run log |
| Judge | Passes a real contradiction (false negative) | eval | CI gate does not catch this | **silent — residual risk** |
| CI gate | Body deleted / always returns pass | **must add (mutation)** | none today | silent — this is why 5A |
| `templates/*.yaml` | `stances` key absent | must add | base-only generation | run log |
| `foldStanceVariants` | Orphan variant | covered ✓ | dropped + warning | log |
| Cohort trigger | New motivation state added to one list only | must add | 4A makes it a compile error | was silent |

**One residual critical gap:** a judge false-negative — the judge approving a
variant that does contradict its base — has no second line of defence. The CI
gate is structural and cannot see it. Mitigation is the per-topic PR review;
accepted knowingly rather than papered over.

## Parallelization

Six topics, disjoint file sets, one template each.

| Step | Modules touched | Depends on |
|------|-----------------|------------|
| S1 template `stances` schema + loader | `modules/.../templates/`, generator | — |
| S2 variant generator | `src/content/`, `src/generation/` | S1 |
| S3 CI gate + mutation tests | `scripts/`, `src/__tests__/` | — |
| S4 motivation vocabulary consolidation | `src/teaching/`, `src/api/` | — |
| S5 coverage on maturity card | `src/api/`, `frontend/src/components/admin/` | — |
| S6a–f generate per topic | `modules/.../concepts/<topic-concepts>/` | S1, S2, S3 |

```
Lane A: S1 → S2 ──┐
Lane B: S3 ───────┼──▶ S6a  linear-algebra   (26 concepts, 156 files)
Lane C: S4        │    S6b  calculus
Lane D: S5        │    S6c  complex-numbers
                  │    S6d  probability
                  │    S6e  discrete-math
                  └──▶ S6f  algorithms
```

Lanes A–D are fully independent (no shared module directory). S6a–f are
independent of each other — disjoint concept directories, one PR per topic.

Conflict flag: S4 and S5 both touch `src/api/`, but different files
(`admin-cohort-routes.ts` vs `admin-content-maturity-routes.ts`). Low risk,
worth a heads-up if run in separate worktrees.

## Implementation Tasks

- [ ] **T1 (P1, human: ~4h / CC: ~30min)** — templates — add a `stances` block to all 6 topic YAMLs
  - Surfaced by: Issue 3 — the cadence exists only as prose in 16 file comments
  - Files: `modules/project-vidhya-content/templates/*.yaml`, template loader
  - Verify: loader test — `stances` parsed; absent key falls back to base-only without throwing
- [ ] **T2 (P1, human: ~3d / CC: ~2h)** — generation — variant generator writing `.md` files
  - Surfaced by: Issue 1 — `atom_versions` rows are unservable by `foldStanceVariants`
  - Files: `src/content/variant-generator.ts`, `src/generation/run-dispatcher.ts`
  - Verify: refuses to overwrite an existing authored variant; fenced blocks byte-identical to base
- [ ] **T3 (P1, human: ~1d / CC: ~45min)** — scripts — `check-variant-agreement.ts` + mutation tests
  - Surfaced by: Issues 2 and 5 — a third gate on an untested gate family
  - Files: `scripts/check-variant-agreement.ts`, `src/__tests__/variant-agreement.test.ts`, `package.json`
  - Verify: passes a clean pair; fails each of 5 mutations with the right reason
- [ ] **T4 (P1, human: ~1d / CC: ~1h)** — generation — equivalence judge, maths atoms, fail-closed
  - Surfaced by: Issues 2 and 6 — structural checks cannot see a contradicted number
  - Files: `src/content/verifiers/stance-equivalence.ts`, generator wiring
  - Verify: contradiction blocks the write; judge error routes the draft to `.data/variant-drafts/`
- [ ] **T5 (P2, human: ~2h / CC: ~15min)** — teaching/api — one exported motivation vocabulary
  - Surfaced by: Issue 4 — seven lists, four memberships, `anxious` missing from the cohort trigger
  - Files: `src/teaching/motivation-source.ts` + 6 call sites, `src/sessions/learner-framing.ts`
  - Verify: regression test per call site; anxious personas appear on `/admin/cohort`
- [ ] **T6 (P2, human: ~4h / CC: ~30min)** — gates — backfill tests for the two existing content gates
  - Surfaced by: Issue 5 — both about to carry 566 more files, neither has a test
  - Files: `src/__tests__/content-integrity.test.ts`, `src/__tests__/demo-rails.test.ts`
  - Verify: each fails on a deliberately broken fixture
- [ ] **T7 (P2, human: ~3h / CC: ~25min)** — admin — per-concept stance coverage on the maturity card
  - Surfaced by: the plan's own reporting requirement; `stanceCoverage()` already exists
  - Files: `src/api/admin-content-maturity-routes.ts`, `frontend/src/components/admin/ContentMaturityCard.tsx`
  - Verify: zero coverage renders as an honest zero, never as unknown or rounded up
- [ ] **T8 (P1, human: ~2w / CC: ~1d + review)** — content — generate 566 variants, one PR per topic
  - Surfaced by: the objective — scale the accepted cadence to the rest of the course
  - Files: `modules/project-vidhya-content/concepts/*/atoms/*-{shaken,assured}.md`
  - Verify: `ci:content-integrity`, `ci:content-gate`, `check-variant-agreement` all green per PR
  - Blocked by: T15 (the exemplars must pass the gates before the gates run on anything else)
- [ ] **T9 (P1, human: ~1d / CC: ~1h)** — gates — absolute prose budget per atom type + heading cap
  - Surfaced by: Design 1A, corrected by R1A — variants run 2.0–4.6× base prose and converge on a house length independent of base
  - Files: `scripts/check-variant-agreement.ts`, budgets in `templates/*.yaml`
  - Verify: prose counter strips LaTeX and fenced blocks; `hook`>130 fails, 130 passes; the 2 known outliers fail
- [ ] **T16 (P1, human: ~1d / CC: ~45min)** — gates — field-level walkthrough equivalence
  - Surfaced by: R2A — block-level skip would leave 105 of 125 interactive blocks ungated for answer drift
  - Files: `scripts/check-variant-agreement.ts`
  - Verify: prompt/hint differ → pass; a base answer missing from the variant → fail; answers reordered → fail; final answer differs → fail; unparseable spec → refuse
- [ ] **T17 (P1, human: ~2h / CC: ~15min)** — db — migration 035 adds `correct_streak`
  - Surfaced by: R1 re-run estimate correction — `student_model` has no such column, T13 depends on it
  - Files: `supabase/migrations/035_correct_streak.sql`, `src/gbrain/student-model.ts`
  - Verify: idempotent (`IF NOT EXISTS`); existing rows default 0; auto-applied at boot
- [ ] **T10 (P1, human: ~1d / CC: ~45min)** — gates — repetition, h1 and emoji checks
  - Surfaced by: Design 4A — "one X at a time" opens 3 of 8 shaken variants
  - Files: `scripts/check-variant-agreement.ts`
  - Verify: a topic with 3 of 8 sharing an opening 4-gram fails and names them
- [ ] **T11 (P1, human: ~1d / CC: ~40min)** — interactives — GuidedWalkthrough to design-system compliance
  - Surfaced by: Design 6A — 12px answer, ~26px target, reserved indigo, no reduced-motion
  - Files: `frontend/src/components/lesson/interactives/GuidedWalkthrough.tsx`
  - Verify: answer/hint/prompt at 17px; button ≥ 44px; no `var(--indigo)`; honours `prefers-reduced-motion`
- [ ] **T12 (P2, human: ~4h / CC: ~30min)** — interactives — sweep reserved indigo from the remaining three
  - Surfaced by: Design 6A extended — operator chose to clear the rule in this PR
  - Files: `Manipulable.tsx:80`, `DesmosLite.tsx:130`, `Verify.tsx:118`
  - Verify: no `var(--indigo)` outside AI/tutor surfaces; Verify's fill does not read as "correct"
- [ ] **T13 (P1, human: ~3h / CC: ~20min)** — student-model — recover from every struggling state
  - Surfaced by: Design 3A — `anxious` and `flagging` never recover; both demo personas are `anxious`
  - Files: `src/gbrain/student-model.ts:244-249`
  - Verify: an anxious student with 2 correct in a row derives as `steady`; 1 correct does not flip it
- [ ] **T14 (P2, human: ~4h / CC: ~30min)** — admin — two-figure coverage + rejected count + served_stance on walkthrough
  - Surfaced by: Design 2A and 8A
  - Files: `src/api/admin-content-maturity-routes.ts`, `ContentMaturityCard.tsx`, `src/api/admin-walkthrough-routes.ts`
  - Verify: in-rollout and course-wide differ during a partial rollout; no student-facing stance label
- [ ] **T15 (P1, human: ~1d / CC: ~1h)** — content — regenerate the 3 demo concepts as the pipeline pilot
  - Surfaced by: Design 7A — the 16 exemplars fail two gates derived from them
  - Files: `modules/project-vidhya-content/concepts/{eigenvalues,determinants,orthogonality}/atoms/`
  - Verify: all 16 regenerated files pass every gate; per-file diff reviewed against the originals

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 2 | CLEAR (PLAN) | 8 issues, 1 critical gap |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (FULL) | score: 3/10 → 9/10, 8 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** ENG + DESIGN CLEARED — ready to implement.

**Outside voice:** not run. Codex is not installed in this environment, and the
documented fallback (a Claude subagent) is not authorised in this session
without an explicit request. Two-model agreement is absent from both reviews.

**Residual critical gap (from eng review):** a judge false-negative — the
equivalence judge approving a variant that does contradict its base — has no
second line of defence. The structural gate cannot see it. Per-topic PR review
is the only mitigation, accepted knowingly.

NO UNRESOLVED DECISIONS
