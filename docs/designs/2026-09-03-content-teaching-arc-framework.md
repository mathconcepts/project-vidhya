# Content teaching arc: a common presentation contract, from two live-QA bugs

Live-QA report (2 screenshots) on spectral-theorem: (1) a resonance-beat
scene ("flipped arrow") stated the rule and the answer in the same beat,
with no moment for the student to think first; (2) a wrong-answer solution
on a spectral-theorem practice item read as a dense textbook proof, out of
register with the polished lesson content, and left the student with no
path to understand WHY they picked the wrong method. The user's framing
went further than the two bugs: "reimagine the content delivery from first
principles... this needs to be a common framework across all topics for any
exam." This doc root-causes both bugs, then answers the broader ask
honestly — most of the requested loop (diagnose → intervene → track → next
action) already exists in this codebase; the real, closable gap is a
**presentation-sequencing contract**, and a **discoverability** gap in a
tool that already solves the second half of the ask.

## Part 1 — the two bugs, root-caused

### Bug 1: "drives directly into a solution without preparing the student"

`modules/project-vidhya-content/concepts/spectral-theorem/atoms/hook.md`'s
resonance-beat scene had a beat at `at_progress: 0.55` that did three things
in one sentence: showed the eigenvector flip, stated the rule ("a flipped
arrow is still an eigenvector"), and gave the eigenvalue's sign — with
nothing before it inviting a guess. This is a **sequencing** defect, not a
content-quality one: the scene's math, `emphasize`, and existing `trap` beat
(a different misconception — assuming any matrix's eigenvectors are
perpendicular) were all correct. The fix is Predict-Observe-Explain (POE):
split the single beat into PREDICT ("does a flipped arrow still count?") →
REVEAL (the answer, plainly) → EXPLAIN (why, plus the trace/det cross-check
on its own beat). Shipped as a 5-beat scene in `hook.md` /
`hook-shaken.md` / `hook-assured.md` (byte-identical fences, per
`ci:variant-agreement`'s rule).

### Bug 2: readability/intuition gap vs. "explore this concept"

The screenshot shows `PracticeAttemptPage.tsx`'s post-answer `solution_steps`
render — traced to `data/practice-items/gate-ma-la-eigen.json`'s
`pi-spectral-theorem-002`. Two separable findings:

1. **Content register.** The steps read as a compressed proof
   ("A = QΛQᵀ... A³ = QΛ³Qᵀ...") with no connection to the lesson's own
   "flipped arrow" framing and no explanation of WHY cubing a matrix cubes
   its eigenvalues, or why trace is the eigenvalue sum. Rewritten to open
   by referencing the concept page's own demo matrix and eigenvalues, then
   states each computational move as a plain-English reason before the
   arithmetic — the same register as the lesson atoms, per the tone
   directive already in place platform-wide (CLAUDE.md, 2026-09-02).
2. **A structural finding, more important than this one item.**
   `PracticeAttemptPage.tsx` renders `solution_steps` as plain strings
   (`<li>{s}</li>`) — **no `MarkdownAtomRenderer`, no KaTeX**. Atom bodies
   and resonance-beat narration both route through the shared renderer;
   `solution_steps` is a third, disconnected surface. This is the SAME bug
   class as two earlier findings this session (`ConceptMathViz`'s
   disconnection from the tone pipeline; the bracket-array-vs-LaTeX bug in
   `guided_walkthrough` specs) — independently-built content-authoring
   surfaces drift from the platform's rendering/register standard because
   each has its own code path. **Not fixed in this pass** (a rendering
   change, not a content rewrite, and out of the two screenshots' scope) —
   tracked in TODOS.md as its own item, since fixing content register
   without fixing the renderer just moves where LaTeX would break next.

## Part 2 — the "solver for different types" ask

Re-reading point 2's aside ("if required, for each type of problem, create
solver that can solve different types") against the codebase: this already
exists. `frontend/src/components/lesson/interactives/GuidedWalkthrough.tsx`'s
`branches` extension (plan W2.5/D1-D3) is exactly a "pick the right method
for this problem type, then see why" solver — `TheoremWizardPage.tsx`'s
`linear-algebra` trainer already has an `la_power` node (compute Aⁿ:
diagonalize vs. Cayley-Hamilton vs. "is it symmetric") and an `la_definite`
node (quadratic-form sign via eigenvalues) — the exact territory a
spectral-theorem miss sits in.

**The actual gap: discoverability, not capability.** `grep`-ing the
frontend found `/theorem-wizard/:module` and `/distribution-selector`
reachable ONLY via a direct URL and `App.tsx`'s route table — no lesson
page, concept card, or practice-attempt screen ever links to either. A
student who gets a spectral-theorem question wrong (screenshot 2's exact
moment) had no path to the tool built to teach method selection.

**Fixed:** `PracticeAttemptPage.tsx` gains a `wizardRouteForTopic(topic)`
helper and a new CTA ("Which method applies? Work through it", `GitBranch`
icon, indigo — AI/tutor semantic per Vidhya Clarity) that appears on a
wrong answer when the item's `topic` maps to a real trainer
(`linear-algebra` → `/theorem-wizard/linear-algebra`, `vector-calculus` →
`/theorem-wizard/vector-calculus`, `probability-statistics` →
`/distribution-selector`). Topic values are normalized (trim + lowercase +
space-to-hyphen) rather than exact-matched, since an audit of
`data/practice-items/*.json` found one bank (`gate-ma-linear-algebra.json`)
using `"Linear Algebra"` where every other bank uses the kebab-case slug —
a display-only casing drift is not a reason to withhold a real link, but an
unmapped topic still renders no button rather than a guessed one (fail
closed, same discipline as every other honest-degradation rule in this
codebase). 5 new tests in `PracticeAttemptPage.test.tsx` cover: link
renders + navigates for LA and PS topics, normalizes title-case, absent for
an unmapped topic, absent on a correct answer.

**Not done:** authoring a NEW branching spec specific to spectral-theorem's
own problem shapes (e.g. "compute a function of a symmetric matrix" as its
own decision tree, distinct from the existing power/definiteness nodes) —
the existing `la_power`/`la_definite` nodes already cover this item's
territory, so a duplicate spec would fragment rather than extend the tool.
Extending `THEOREM_WIZARD_TRAINERS` to the 8 topics with no trainer at all
(only linear-algebra, vector-calculus, and probability-statistics have one)
is real future work, named in TODOS.md.

## Part 3 — the "common framework" ask, answered honestly

The user's four-part ask — why students get it wrong, what to do, how to
present, how to track understanding, what to do next — is not a green
field. An audit of what this codebase already ships (all pre-existing,
documented across this file's own history) against each part:

| Part of the loop | Already built | Where |
|---|---|---|
| Why wrong (diagnosis) | Yes — Elo joint ability/difficulty, `error-taxonomy.ts` LLM classifier, `distractor_failure_tags` (authored per-mcq-option), `diagnostic-probe.ts`'s bounded-depth prerequisite search, `mock-to-marks.ts`'s knew-it-vs-didn't split | `src/gbrain/elo.ts`, `src/gbrain/error-taxonomy.ts`, `src/gbrain/marking-derivation.ts`, `src/gbrain/diagnostic-probe.ts` |
| What to do (intervention) | Yes — `nextBestAction()`'s four-arm loop (Retain/Practice/Teach/Diagnose), `MotivationAwareTeachingPolicy`, FIRe implicit-credit propagation, personalization's 5-layer re-ranker | `src/readiness/next-best-action.ts`, `src/teaching/motivation-aware-policy.ts`, `src/gbrain/fire.ts`, `src/personalization/selector.ts` |
| How to present | **Partial** — resonance beats encode segmenting+signaling (Mayer) correctly where authored, but had no PREDICT step (this pass's Bug 1) and coverage is uneven (v4.44-45 notes) | `frontend/.../interactives/types.ts`'s `SimulationSpec`, now + `ped_predict_before_reveal` |
| Track understanding | Yes — FSRS-6 memory model, mastery snapshots, `attempt_facts` ledger, XP-per-cycle, checkpoint quizzes | `src/gbrain/fsrs.ts`, migration 051 (`attempt_facts`), `src/scoring/xp.ts` |
| What's next | Yes — the same `nextBestAction()` above, wired live at `GET /api/readiness/next-action` | `src/api/readiness-routes.ts` |

**The honest gap this pass closes is narrower than "reimagine from first
principles":** it's a **presentation-sequencing contract** — the platform
had the segmenting/signaling machinery but no registered rule that a
prediction must precede a reveal, and it had a real method-selection
solver with no path from the exact moment (a wrong answer) a student needs
it. Both are now closed as REUSABLE, cross-topic mechanisms, not one-off
content edits:

1. **`ped_predict_before_reveal`** — new entry in
   `data/registry/pedagogy-patterns.yml` (Track E4's Pedagogy Pattern
   Library, the SAME real, tested mechanism `ped_method_selector` uses —
   not a new system). `applicable_modules` spans all 10 topic families
   (full-catalogue reach, like `ped_method_selector`); `blueprint_stages:
   [intuition, discovery]`. Directives require a SEPARATE, narrowly-cued
   beat/sentence before any reveal of a rule/sign/classification the
   student couldn't yet derive, explicitly reject open-ended "what do you
   think happens?" prompts (grounded in Sweller's worked-example effect —
   novices need scaffolding, not blank-page discovery), and explicitly
   distinguish a predict cue (about the current step) from a trap/
   misconception callout (a different, tempting error) so the two
   mechanisms don't get conflated by a generator. Evidence cites White &
   Gunstone 1992 (POE), Slamecka & Graf 1978 (generation effect), and this
   live-QA report. Verified loading + rendering via
   `buildPatternPromptBlock('linear-algebra', ['ped_predict_before_reveal'])`
   — every future `intuition`/`discovery` atom generated for ANY topic now
   carries this directive automatically, the same way `ped_method_selector`
   already reaches every topic.

2. **The wizard-link fix (Part 2)** generalizes past spectral-theorem: any
   wrong answer on ANY item whose topic has a trainer now surfaces the
   solver, not just this one concept.

## What this pass does NOT claim

- It does not audit or fix the other ~100 concepts' resonance beats for the
  same reveal-without-predict defect — `spectral-theorem/atoms/hook.md` was
  the one reported. A systemic audit (which beats combine observe+reveal)
  is real, scoped work — tracked in TODOS.md, same 5-6-concept-per-batch
  precedent as every other wave this repo has run.
- It does not ELI5-rewrite the other ~500 practice items' `solution_steps`
  — `pi-spectral-theorem-002` was the reported item.
- It does not fix `solution_steps`'s missing KaTeX/tone pipeline (Part
  1's structural finding) — a renderer change, tracked separately since it
  blocks EVERY practice item with real LaTeX in its solution, not just
  spectral-theorem's.
- It does not extend `THEOREM_WIZARD_TRAINERS` to the 8 topics without one.
- The new pedagogy pattern shapes future LLM-GENERATED content
  (`buildPrompt()`'s pattern-injection seam); it does not retroactively
  rewrite the ~880 already-committed base atoms for predict-before-reveal
  sequencing where a reveal-only version already exists and isn't reported
  broken.

## Verification

`npx tsx scripts/check-practice-items.ts` (505 items, unchanged count),
`npx tsx scripts/lint-interactive-specs.ts` (383 blocks, unchanged —
edited an existing block, not a new one), `npx tsx scripts/check-katex-
fences.ts`, `npx tsx scripts/check-content-integrity.ts`, `npx tsx
scripts/check-variant-agreement.ts` (610 pairs), `npx tsx scripts/check-la-
walkthrough.ts` (26/26, spectral-theorem row unchanged), full `npm run ci`
(18 gates, exit 0), backend `npx vitest run` (4672 passed), frontend
`npx vitest run` (2572 passed, +21 new: 16 existing +5 wizard-link), `tsc
--noEmit` clean both sides.
