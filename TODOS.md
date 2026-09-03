# TODOS

Deferred work with enough context to pick up cold. Each entry states its
trigger — the condition that makes it worth doing — so nothing sits here
being vaguely important forever.

## Audit other concepts' `intuition`/`mnemonic` atoms for the same wall-of-text pattern

**Trigger:** the next live-QA report naming a different concept's
intuition or mnemonic card, or a decision to sweep this systematically
before the next content wave.

`/investigate` (2026-09-03, "explanation is not resonant... interactive
and text are in silos") found `cayley-hamilton/atoms/intuition.md` was a
274-word static wall (formal definition + numbered list) with zero
connection to its own concept's `hook.md` resonance-beat scene, and fixed
it by threading ONE shared worked example through both atoms via a new
predict-before-reveal scene (see CLAUDE.md's 2026-09-03 "cramped CTAs +
Cayley-Hamilton silo" section for the exact pattern and Wolfram-verification
discipline used). This was NOT audited corpus-wide — Cayley-Hamilton was
the one concrete example the report named. The same pattern (an
`intuition`/`mnemonic` atom authored independently of its concept's hook,
with no shared example or interactive element) likely recurs elsewhere;
`scripts/check-reading-load.ts` (`npm run content:reading-load-report`)
already flags atoms with zero beat coverage and can seed the worklist.

**What:** for each flagged concept, read its `hook.md` (does it already
carry a resonance scene? what matrix/example does it use?) before writing
anything — the fix is threading the SAME example through `intuition.md`,
not inventing a new one. Follow the exact discipline used on
cayley-hamilton: verify every numeric claim live (Wolfram or by hand),
keep the new fence byte-identical across base/shaken/assured, validate
against `ci:interactive-specs`/`ci:variant-agreement`/`ci:katex-fences`/
`ci:content-integrity`/`ci:la-walkthrough` before committing.

**Where to start:** `modules/project-vidhya-content/concepts/<id>/atoms/hook.md`
+ `intuition.md` pairs, prioritized by `npm run content:reading-load-report`'s
output (atoms with the highest real-vs-gate-visible reading-load ratio are
the ones most likely authored independently of their hook).

**Effort:** M per concept (authoring + Wolfram verification + the 5-gate
validation pass), same shape repeated across however many concepts the
audit flags.
**Priority:** P2 — the report's core complaint, fixed for one worked
example; scope was explicitly one concept, not the corpus.
**Deferred from:** `/investigate` live-QA pass, 2026-09-03, branch
`claude/content-strategy-framework-o9afoc`.

## Mnemonic atoms could carry a `manipulable` interactive widget, not just prose

**Trigger:** the audit above lands and a pattern emerges for which
mnemonic atoms would actually benefit (a formula with 2+ free numbers,
like Cayley-Hamilton's trace/determinant shortcut, is the natural
candidate — a mnemonic that's just one fact doesn't need a slider).

`/investigate` (2026-09-03) gave `cayley-hamilton/atoms/mnemonic.md` a
prose-only pass (glossed "trace"/"determinant" on first use, dropped an
unexplained "adjugate method" comparison) rather than building a second
interactive scene — `AtomCardRenderer.tsx`'s figure-promotion logic is NOT
gated by atom_type (confirmed by reading `promotedSimSpec`'s condition:
`parsedSpec.spec.kind === 'simulation' && presentation.stage !== 'in_disclosure'`,
and `mnemonic`'s own `ATOM_PRESENTATION_MAP` entry is `stage: 'above'`, not
`in_disclosure`), so a `mnemonic.md` authored with a `manipulable` or
`simulation` fence would already render exactly like a hook's. The gap is
content, not code. A natural first candidate: a `manipulable` slider over
$\text{tr}(A)$ and $\det(A)$ that live-updates $A^{-1}=\frac{1}{\det(A)}(\text{tr}(A)I-A)$
as the reader drags — reinforcing "read the trace, read the determinant,
done" by feel instead of by re-reading the sentence.

**What:** author + Wolfram-verify a `manipulable` spec for
`cayley-hamilton/atoms/mnemonic.md` (no stance variants exist for this
atom today, so no byte-identical-fence constraint to satisfy), then decide
whether the pattern generalizes to other concepts' mnemonic atoms.

**Where to start:** `frontend/src/components/lesson/interactives/types.ts`'s
`validateManipulable()` for the exact schema; `Manipulable.tsx` for how it
renders.

**Effort:** S for the one Cayley-Hamilton case; M+ if generalized corpus-wide.
**Priority:** P3 — a real enhancement, not a reported defect (the prose
pass already closed the "unglossed jargon" complaint for this atom).
**Deferred from:** `/investigate` live-QA pass, 2026-09-03, branch
`claude/content-strategy-framework-o9afoc`.

## `common_traps` needs a `stances:` guidance block and a prose budget

**Trigger:** an editorial decision on the right word ceiling (this review
measured the gap; it did not decide the number), or before the next
content wave touches `common_traps` atoms.

`/design-review`'s first-principles content review (2026-09-03,
`docs/designs/2026-09-03-content-delivery-first-principles-review.md`)
measured `common_traps` as the longest atom type in the corpus (average
146 words across 101 concepts, worst case 406) and the only one of 11 atom
types with zero density discipline anywhere: no `ASSURED_PROSE_BUDGET`
entry (`src/content/prose-budget.ts`), no `stances:` guidance block in any
topic template (`modules/project-vidhya-content/templates/*.yaml` —
contrast its bare one-line `guidance:` with `hook`/`intuition`/
`worked_example`'s multi-paragraph stance instructions). This is the
highest-cognitive-load atom type in the system by delivery timing —
`pedagogy-engine.ts`'s error-streak handling (E5) force-injects it to the
front of the queue after 3 consecutive wrong answers.

**What:** author a `stances:` block for `common_traps` in every topic
template matching the existing pattern (absolute ceiling for
assured/base, "capped against its own base" for shaken), and add its
entry to `ASSURED_PROSE_BUDGET`. Re-run `npm run content:reading-load-report`
after to see how many existing atoms would need trimming under the new
ceiling before deciding whether to gate it in `ci:variant-agreement`.

**Where to start:** `modules/project-vidhya-content/templates/linear-algebra.yaml`'s
`common_traps:` block (line ~75) as the template; `src/content/prose-budget.ts`'s
`ASSURED_PROSE_BUDGET`.

**Effort:** M — editorial ceiling decision + template authoring across 10
topics + likely content trims once the real numbers are visible.
**Priority:** P2 — the review's #1 "where to concentrate" finding: real,
measured, and touches the highest-load moment in the delivery pipeline.
**Deferred from:** `/design-review` first-principles content review,
2026-09-03, branch `claude/content-strategy-framework-o9afoc`.

## Beat-text reading load should gate `ci:variant-agreement`, once ceilings exist

**Trigger:** the `common_traps` budget item above lands, or a separate
editorial decision on real per-atom-type beat-text ceilings.

The same review that measured `common_traps` also found
`ci:variant-agreement`'s prose gate blind to resonance-beat narration text
— `countProseWords()` strips the `` ```interactive-spec``` `` fence whole,
so a beat-carrying hook's real reading load (prose outside the fence +
`narration_steps[].text` for the served stance) can run 4-6x what the
gate reports (`matrix-inverse/hook-assured.md`: gate sees 28 words, real
load 172). `countBeatProseWords()`/`countTotalReadingLoad()`
(`src/content/prose-budget.ts`, shipped this review) measure it correctly;
nothing gates on it yet.

**What:** once real per-atom-type beat-text ceilings are decided
(editorial, not this item), wire `countTotalReadingLoad()` into
`scripts/check-variant-agreement.ts` in place of (or alongside)
`countProseWords()`. Turning this on before ceilings exist would fail
every one of the 102 beat-carrying atoms retroactively against a budget
they were honestly authored against a broken counter — not a fix, a
punishment for a measurement bug that wasn't theirs.

**Where to start:** `scripts/check-reading-load.ts` (the measurement tool,
already built) and `scripts/check-variant-agreement.ts` (the gate this
would extend). `npm run content:reading-load-report` gives current
per-atom numbers to calibrate a ceiling against.

**Effort:** S once ceilings are decided — the measurement functions
already exist and are tested.
**Priority:** P2 — same review, second-highest finding; blocked on an
editorial decision, not an engineering one.
**Deferred from:** `/design-review` first-principles content review,
2026-09-03, branch `claude/content-strategy-framework-o9afoc`.

## Hook intro-paragraph/beat-1 redundancy check should run corpus-wide

**Trigger:** the two budget items above land, or a decision to do this
systematically before the next resonance-beat authoring wave.

`/design-review`'s content review (2026-09-03) observed that
`eigenvalues/atoms/hook.md`'s pre-fence intro paragraph and its first
narration beat both re-introduce the same setup ("sixteen arrows...
watch what changes" said twice, once outside the fence and once inside
beat 1) — the opposite of "explain more in less." This was confirmed on
ONE example, not measured across all 102 beat-carrying atoms.

**What:** a report (matching `check-reading-load.ts`'s report-only
pattern) that extracts a beat-carrying atom's pre-fence prose and its
first beat's text, and flags pairs with high lexical overlap (a simple
shared-4-gram check, same technique `variant-agreement.ts`'s
`repeatedPhrases` already uses for a different redundancy problem) for
human review.

**Where to start:** `src/content/variant-agreement.ts`'s `repeatedPhrases`
function is the closest existing implementation to adapt.

**Effort:** S — one new report script reusing an existing technique.
**Priority:** P3 — confirmed on one example, not yet known how common it
is corpus-wide.
**Deferred from:** `/design-review` first-principles content review,
2026-09-03, branch `claude/content-strategy-framework-o9afoc`.

## Practice CTA after a wizard mistake should target the misconception, not just the concept

**Trigger:** a decision to deepen the mistake-diagnosis loop, or evidence
that generic concept practice isn't closing the specific gap a wizard
visit surfaced.

`WizardPracticeCTA` (`frontend/src/components/app/WizardMistakeLoop.tsx`,
2026-09-03) routes a student who just worked through the method-selection
wizard to `/smart-practice?concept=<concept>` — the concept's whole
practice pool, not problems selected for the SPECIFIC misconception the
wizard diagnosed (e.g. "picking the wrong approach" vs. a sign error).
`ProtoCATSelector` (`src/scoring/proto-cat-selector.ts`) doesn't currently
accept a misconception/failure_tag filter — it selects by desirable-
difficulty band, not by error type.

**What:** thread the diagnosed `failure_tag`/`mistake` context from the
wizard link through to item selection, so "practice more like this" means
"practice problems shaped like the mistake you made," not just "practice
this concept generally." Needs either a query param `SmartPracticePage`
reads and forwards, or a dedicated endpoint.

**Why not done here:** this investigation's scope was closing the
wizard's two acute gaps (no context, no path back to practice) —
`ProtoCATSelector` gaining a misconception filter is real, separate
selection-logic work with its own design questions (does every
`failure_tag` have enough tagged practice items to filter on? what's the
fallback when it doesn't?).

**Where to start:** `src/scoring/proto-cat-selector.ts`'s `ItemSelector`
interface; `distractor_failure_tags` on `generated_problems` (migration
054) is the existing per-item tagging this would need to query against.

**Effort:** M — a real selection-logic change, not a wiring change.
**Priority:** P3 — no usage data yet on whether generic concept practice
is insufficient after a wizard visit.
**Deferred from:** adaptive-pacing + wizard-mistake-loop investigation,
2026-09-03, branch `claude/content-strategy-framework-o9afoc`. See
`docs/designs/2026-09-03-adaptive-pacing-and-wizard-mistake-loop.md`.

## Static-text motion audit is incomplete outside AtomCardRenderer

**Trigger:** the next live-QA report naming a specific static/dense
screen, or a decision to do this systematically before the next content
wave.

The 2026-09-03 `/design-review` pass ("look at all places where static
text is displayed... think about a better motion/animation/progression")
fixed the two screens actually reported (hook beat pacing, worked-example
step reveal) and confirmed `DefaultAtomCard`'s `.vidhya-atom-body--progressive`
paragraph-stagger already reaches every other atom type in
`AtomCardRenderer.tsx` (the two 2026-09-02 holdouts, `formal_definition`
and `exam_pattern`, are deliberate, not gaps). It did NOT audit surfaces
outside that one file: `PracticeAttemptPage`/mock-exam question rendering,
`CommonTrapsCard`'s row content beyond its existing `structured` stagger,
and any lesson-adjacent card type not routed through `AtomCardRenderer`.

**What:** the same grep-then-read audit pattern used for the visual_analogy
positional-mismatch wave (CLAUDE.md, "the text/diagram mismatch, corpus-
wide") — inventory every remaining static-text screen, judge each on
its own merits (some genuinely don't need motion; `formal_definition`
proves that), fix the ones that do.

**Where to start:** grep for `MarkdownAtomRenderer` / raw `<p>`/`<li>`
usages outside `frontend/src/components/lesson/AtomCardRenderer.tsx`.

**Effort:** M — mostly reading, some component-level changes.
**Priority:** P3 — no specific screen reported broken beyond the two
already fixed.
**Deferred from:** hook-pacing + worked-example-progression investigation,
2026-09-03, branch `claude/content-strategy-framework-o9afoc`.

## `solution_steps` has no LaTeX/tone rendering pipeline

**Trigger:** the next live-QA report on a practice item whose
`solution_steps` contains real LaTeX, or a decision to standardize
practice-item authoring before the next content wave.

`PracticeAttemptPage.tsx` renders `result.solution_steps` as plain strings
(`<li>{s}</li>`) — never through `MarkdownAtomRenderer`. Atom bodies and
resonance-beat narration both get KaTeX + the tone-register pipeline;
`solution_steps` is a third, independently-drifted content surface (same
bug class as `ConceptMathViz`'s pre-2026-09-02 disconnection and the
bracket-array-vs-LaTeX bug in `guided_walkthrough` specs, both fixed
earlier this session). Every `solution_steps` array across all 505 practice
items in `data/practice-items/*.json` is currently authored in literal
Unicode math notation (Λ, ᵀ, ³, —) rather than `$...$` LaTeX, specifically
BECAUSE the renderer can't handle LaTeX there — so this is silently
constraining every future item's authoring style, not just a rendering
polish item.

**What:** wire `PracticeAttemptPage.tsx`'s solution-steps `<ol>` through
`MarkdownAtomRenderer` (same component `AtomCardRenderer.tsx` and
`GuidedWalkthrough.tsx` already use), confirm it doesn't choke on the 505
already-Unicode-authored items (it shouldn't — plain text renders fine
through a markdown+KaTeX pipeline), then the authoring convention can move
to real LaTeX for anything written after.

**Where to start:** `frontend/src/pages/app/PracticeAttemptPage.tsx` around
the `solution_steps.map` block (~line 495 pre-this-pass); the
`MarkdownAtomRenderer` import + `className` prop pattern `GuidedWalkthrough.tsx`
already uses is the template.

**Effort:** S human / CC ~30 min (one component swap + a render-regression
test pass over existing items to confirm nothing breaks).
**Priority:** P2 — cosmetic today (Unicode notation reads fine), but blocks
better-notated practice-item authoring and is the same drift pattern this
repo has fixed twice already; worth closing before a third surface drifts
the same way.
**Deferred from:** content teaching-arc framework pass, 2026-09-03, branch
`claude/content-strategy-framework-o9afoc`. See
`docs/designs/2026-09-03-content-teaching-arc-framework.md`.

## ELI5/register pass over the other ~500 practice items' `solution_steps`

**Trigger:** the `solution_steps` LaTeX-pipeline item above lands, or
another live-QA report names a specific item.

This pass rewrote exactly one item's `solution_steps`
(`pi-spectral-theorem-002` in `data/practice-items/gate-ma-la-eigen.json`)
to match the lesson-content register (plain-English reason before each
computational move, referencing the concept's own worked demo rather than
a generic proof). The other ~504 items across 16 banks have not been
audited for the same register gap — most were authored before the
2026-09-02 ELI5/Indian-English tone directive landed in `orchestrator.ts`'s
`buildPrompt()`, and `solution_steps` specifically is authored by a
different code path than atom generation (see the pipeline gap above), so
the tone directive never reached it even for items generated after that
date.

**What:** same discipline as the `common_traps` rewrite pass (CLAUDE.md,
2026-09-02): batch by concept (5-6 at a time), rewrite `solution_steps`
prose only (never the underlying math, answer key, or `verification_method`),
validate against `ci:practice-items`'s self-re-grade check after each batch.

**Effort:** L human / CC — 500 items ÷ ~5 per batch ≈ 100 batches; likely
worth prioritizing by which concepts get the most practice-attempt traffic
once real usage data exists, rather than doing all 16 banks uniformly.
**Priority:** P3 — no volume signal yet on which items students actually
see wrong-answer solutions for.
**Deferred from:** content teaching-arc framework pass, 2026-09-03, branch
`claude/content-strategy-framework-o9afoc`.

## Extend `THEOREM_WIZARD_TRAINERS` past linear-algebra/vector-calculus

**Trigger:** a live-QA report on a wrong answer in a topic with no trainer,
or a decision to build out method-selection coverage systematically.

`frontend/src/data/method-selection-trainers.ts` has trainers for only 2 of
10 topic families (plus the standalone `DISTRIBUTION_TRAINER` for
probability-statistics). This pass wired `PracticeAttemptPage.tsx`'s
wrong-answer screen to link to whichever trainer exists for the item's
topic (`wizardRouteForTopic()`) — for the other 7 topics (calculus,
differential-equations, complex-variables, numerical-methods, discrete-
mathematics, transform-theory, graph-theory), a wrong answer today shows no
wizard link at all (fails closed, not a broken link) simply because there
is nothing to link to yet.

**What:** author a `MethodSelectionTrainer` (branching `guided_walkthrough`
spec, per `method-selection-trainers.ts`'s existing shape) for each
remaining topic's most common method-selection confusion — the same
territory `ped_method_selector` (Pedagogy Pattern Library) already
identifies as a cross-topic pain point.

**Where to start:** `frontend/src/data/method-selection-trainers.ts`'s
existing 3 trainers as the template; `data/registry/pedagogy-patterns.yml`'s
`ped_method_selector` evidence field cites the specific per-topic confusion
patterns (L'Hospital eligibility, Green's/Stokes'/Gauss' selection, etc.)
to build trainers around.

**Effort:** M human / CC ~1 trainer per session (each is a real content-
authoring task — a decision tree with genuine wrong-answer reasoning, not
boilerplate).
**Priority:** P3 — no per-topic demand signal yet.
**Deferred from:** content teaching-arc framework pass, 2026-09-03, branch
`claude/content-strategy-framework-o9afoc`.

## Motion coverage wave: vector-calculus, probability-statistics, transform-theory, numerical-methods

**Trigger:** operator time for the next content wave, or a fresh live-QA
report on one of these topics.

`docs/designs/2026-09-03-motion-and-plain-language-strategy.md` found these
4 topics are 100% covered by the passive `gif-scene` system but have ZERO
`simulation`-kind (scrubbable, narrated, signaling) scenes — the
pedagogically active layer research ties to real effect sizes. Priority
order (subject-motion fit × gap, full rationale in the doc):
1. vector-calculus (7 concepts remaining after `line-integrals`, this
   pass's pilot) — flux/curl/divergence/Green's/Stokes/Gauss are literal
   motion-through-space; best-suited topic in the curriculum.
2. numerical-methods (6 concepts) — root-finding, integration, ODE solvers
   are iterative-convergence processes, the textbook system-paced case.
3. probability-statistics (9 concepts) — distribution-vs-parameter is a
   `manipulable`-slider case (also 0/9 there); sampling-distributions'
   CLT convergence is a classic animated demonstration.
4. transform-theory (6 concepts) — lower subject-fit (abstract, frequency-
   domain) but still fully passive-only.

Same 5-6-concept-per-batch subagent pattern as the common_traps ELI5 pass:
read the concept's real worked-example numbers (never invent new ones —
`line-integrals`' pilot reused the exact field/path already verified in
`hook-shaken.md`), write one honest `narration_steps` sequence per concept,
respect `MAX_BEAT_TEXT_CHARS=280` and the 8-beat cap, add a `why` line.

**Also:** complex-variables has the worst DEPTH coverage — 4 of 6 concepts
(`analytic-functions`, `complex-integration`, `residue-calculus`,
`taylor-laurent`) have neither `simulation` nor `guided_walkthrough` at
all. Fixing those is arguably higher-urgency than adding a 2nd/3rd scene
to an already-covered topic.

**Effort:** M per 5-6-concept batch, L+ for all 4 topics.

## New interactive-spec kind needed for graph-theory's discrete-traversal concepts

**Trigger:** an operator wants graph-theory's 3 fully-uncovered concepts
(Eulerian & Hamiltonian, Connectivity, Trees) visualized, or a live-QA
report flags one of them specifically.

None of the 3 existing kinds fit honestly: `manipulable` has no notion of
a graph, `guided_walkthrough` has no visual, and `simulation`'s
`parametric`/`linear_map` modes are built for continuous curves and 2×2
matrix transforms — a graph traversal (walk an Euler circuit, grow a
spanning tree edge by edge, flood-fill a connected component) is discrete,
not continuous, and forcing it into `parametric` risks exactly the
"fictional steps" failure the research in the design doc warns about.

This needs a real schema decision: a new `InteractiveKind` (e.g.
`graph_walk` — nodes/edges + a sequence of highlighted-node/edge steps),
a renderer component, and validator rules (reachability/well-formedness,
mirroring `validateBranches`' precedent). Bigger than a content pass —
scope it as its own mini-plan before touching `types.ts`.

**Effort:** M for the schema+renderer, S per concept once it exists.

## `ConceptMathViz`: 52 of 53 descriptions still unaudited for the plain-language rule

**Trigger:** same content-wave cadence as above.

The rule from `docs/designs/2026-09-03-motion-and-plain-language-strategy.md`
§4 (description = what to do/see, ≤~20 words, active voice; why = the
simplification framing, never duplicated in both fields; gloss symbol
chains even when short) was applied and self-corrected on
`matrix-operations` only. The corpus average is 14 words (mostly not
word-dense) but several entries are symbol-dense in the way the readability
research flags (e.g. `determinants`: "det(A - λI) = 0 gives eigenvalues...
λ²-trace·λ+det=0" — zero gloss). Needs a per-entry read against the rule,
not a blanket rewrite.

**Effort:** S per entry, M-L for all 52.

## Why-first interactive framing: 362 of 380 interactive-spec blocks still have no `why`

**Trigger:** an operator wants to spend agent time on the next wave, or a
fresh live-QA report finds another interactive with no framing.

`docs/designs/2026-09-03-why-first-interactive-framing.md` built the
`why?: string` field (schema + validation), the shared `WhyThisHelps`
component, and the `useEliFraming` hide-toggle, then piloted it on the one
concept a live-QA report flagged (matrix-operations) plus the 4 other
concepts sharing its guided_walkthrough bracket-notation bug (lu-
factorization, eigenvalues, change-of-basis, numerical-linear-algebra).
That's 18 of 380 authored interactive-spec blocks (253 guided_walkthrough +
100 simulation + 27 manipulable). The other 362 render exactly as before —
`why` is optional — just without the new framing line. Same 5-6-concepts-
per-batch subagent pattern that worked for the common_traps ELI5 pass
(CLAUDE.md, 2026-09-02) applies here: read each concept's real narration,
write one honest sentence on why THIS widget helps (never a generic
template line), respect `MAX_WHY_CHARS=220`.

**Also flagged, not yet fixed:** `matrix-inverse/atoms/hook.md` carries the
same "circle has become a tilted ellipse" resonance beat as
matrix-operations (confirmed via grep, its own narration read — not
assumed identical) and would benefit from the same why-explains-how
treatment; out of scope here since the live-QA report was scoped to
matrix-operations only.

**Effort:** M per 5-concept batch (~this pass's size for the LaTeX-bug
concepts), L+ for the full remaining 362-block corpus.

## `ConceptMathViz`'s 52 other entries are unaudited for scope-mismatch/jargon-density

**Trigger:** same as above — an operator-driven content wave, or a fresh
live-QA report on a different concept's exploration widget.

`frontend/src/components/lesson/ConceptMathViz.tsx`'s 53-entry `CONCEPT_VIZ`
map is a hardcoded, pre-ELI5-directive widget entirely separate from the
authored atom pipeline — it predates the tone-directive/prompt-registry
work and was never touched by any of it. Only `matrix-operations` has been
checked and fixed (rescoped honestly as a 1-number simplification, ELI5
description, real `why`). The other 52 entries may carry the same kind of
issue found there: a plot that doesn't actually match what the concept's
authored atoms teach, or a `description` written in dense unglossed
register. Each entry needs its own real check against that concept's
actual lesson content — not a templated rewrite.

**Effort:** S per entry once checked against real content, M-L to audit
all 52.

## No server-side/admin-configurable default for the ELI5-framing toggle

**Trigger:** an admin wants to change the platform-wide default (e.g. off
for an advanced-track exam pack) rather than relying on each student
discovering "Hide these tips" themselves.

`useEliFraming.ts` is a per-student client preference only (localStorage,
mirrors `useCalmMode.ts`). The live-QA report's "maybe with an option in
backend to remove" was interpreted as this per-student toggle since content
is static (no per-request LLM call to gate). A genuine server-side default
— an env var or admin setting read at boot, consulted only as the
*initial* value before a student's own localStorage choice takes over —
is real, separate follow-up work, not attempted here.

**Effort:** S — one read at app boot, threaded into `useEliFraming`'s
initial state.

## Existing content corpus mostly not reprocessed against the ELI5/Indian-English register directive

**Trigger:** an operator wants to spend agent time/budget on the next wave,
or a fresh live-QA report surfaces another unglossed-jargon instance
outside Linear Algebra `common_traps`.

**What:** `/investigate` (2026-09-02) added an unconditional
`TONE_REGISTER_BLOCK` to `orchestrator.ts`'s `buildPrompt()` — ELI5
reasoning, gloss any technical term on first use, default to Indian
English, written for an anxious exam student. `/autoplan` (2026-09-02, same
day) closed the pilot slice: all 26 GATE Linear Algebra concepts'
`common_traps` atoms were rewritten via 5 parallel subagents against this
directive, verified against `ci:katex-fences`, `ci:content-integrity`,
`ci:la-walkthrough`, `ci:template-coverage`, `ci:variant-agreement`, and the
frontend's full atom-render regression suite — all clean. The confirmed
instance that surfaced the gap (`symmetric-matrices/atoms/common-traps.md`
Trap 1's ungossed "Hermitian matrix") is fixed.

This closed one (atom_type, topic) slice out of many. NOT touched: every
other atom_type (`hook`, `intuition`, `formal_definition`, `worked_example`,
`micro_exercise`, `retrieval_prompt`, `visual_analogy`, `mnemonic`,
`exam_pattern`, `interleaved_drill`) across all 101 concepts, and
`common_traps` itself on the other 9 topics beyond Linear Algebra. The
880+ base atoms this pass didn't touch keep whatever register they were
originally written in.

**Why the rest isn't done here too:** no LLM provider key is configured in
this environment for the LIVE generation path (`GEMINI_API_KEY`/
`ANTHROPIC_API_KEY`/etc. all unset), so `generateConcept()` itself can't
run — but the pilot proved the workaround (Claude Sonnet subagents doing
the rewrite directly, bypassing the app's runtime LLM client) works and
produces real, CI-clean output. The remaining scope is ~9x this pilot's
size for `common_traps` alone across the other 9 topics, and roughly
10x again per additional atom_type — a real cost that deserves batching
in deliberate, human-checkpointed waves (mirroring this repo's own Wave
1-13 FSRS precedent and the 24-of-26 resonance-beats rollout), not one
unattended mega-run.

**Where to start:** repeat this pass's exact pattern — 5-6 concepts per
subagent batch, dispatched in parallel via the Agent tool, each given the
verbatim tone directive + hard constraints (frontmatter untouched, math
unchanged, same trap/step count, no fabricated claims) — for the next
(atom_type, topic) slice. `common_traps` on Calculus (22 concepts) or
Vector Calculus (11 concepts) is the natural next slice, matching this
pass's atom_type before moving to a new atom_type on Linear Algebra.

**Resolved separately, same day:** the 5 modifiers the uploaded
Wolfram-inspired registry named but Vidhya had no implementation for are
now real (`src/content/prompt-registry/resources/modifiers.ts`), promoted
from `approval_state: 'draft'` to `'pilot'` — opt-in via a new
`active_modifiers`/`prerequisite_gap` field threaded through
`OrchestratorOptions`. `modifier.hindi_glossary` uses a new curated
NCERT-vocabulary data file (`src/content/prompt-registry/data/hindi-math-
glossary.ts`, ~30 Linear Algebra terms) rather than inventing translations
inline. A demonstration pack (`docs/designs/2026-09-02-modifier-
demonstration-samples.md`) shows each modifier applied to real Linear
Algebra content for review before any modifier graduates to `'released'`
or gets applied at scale — none has been exercised by a live generation
run yet (still the same missing-provider-key constraint as the tone-
directive pass above), so `'pilot'` — not `'released'` — is the honest
state until real usage evidence exists. The demo pass itself caught a real
bug before any wider rollout: `modifier.hindi_glossary`'s directive text
originally showed the generator only 4 sample terms (not `eigenvector`),
and applying it to real content produced eigenvalue's gloss on the word
"eigenvectors" — a value/vector mismatch. Fixed by putting the FULL
curated table in the directive instead of a 4-term sample, with an
explicit "match the exact term, not the nearest one" instruction, plus a
regression test locking both distinct glosses in the output.

**Effort:** M per additional (atom_type, topic) slice (~this pass's size),
L+ for the full remaining corpus.
**Priority:** P2 (real but not urgent — new content already gets the
register automatically; this is a backfill).

**Deferred from:** `/autoplan` 2026-09-02, branch
`claude/content-strategy-framework-o9afoc`.

## "Concept learning" room silently bounces students with no knowledge track

**Trigger:** the next time someone touches `RoomsPage`, `KnowledgeHomePage`,
or the room-switcher header — or a support/QA report of "I picked Concept
learning and landed on my exam plan instead."

**What:** `frontend/src/pages/app/KnowledgeHomePage.tsx:67` redirects to
`/planned` whenever `profile.exams[0].knowledge_track_id` is unset — correct
behavior for a student whose only registered exams have no knowledge track
(e.g. the demo's `student-active` persona, registered for
`EXM-BITSAT-MATH-SAMPLE` / `EXM-JEEMAIN-MATH-SAMPLE`, neither of which
carries one). The room-selection screen (`/rooms`) doesn't know this: it
offers "Concept learning — Build deep understanding... follow a concept
curriculum" as a live, tappable card regardless, with no eligibility check
and no messaging when the promise can't be kept. A student picks the room
they want and is silently placed on a different page than the one they
chose, with zero explanation.

**Why not fixed inline:** found during a `/qa` pass (2026-08-30) that fixed
three other bugs in the same journey (see git log around that date), but the
right fix here is a product call, not a guess: grey out / hide the
"Concept learning" card when the student has no knowledge-track exam, show
an inline "not available for your exam yet" state, or route the CTA into
`/warmup` (which *does* work anonymously/track-less) instead of silently
landing on `/planned`. Any of these is a small change; picking the wrong one
guesses at intended room-switching semantics ("switch rooms anytime from the
header" implies rooms should always be choosable) without a decision.

**Where to start:** `frontend/src/pages/app/RoomsPage.tsx` (or wherever the
room cards render — grep for "Build deep understanding") for the gate;
`KnowledgeHomePage.tsx:60-82`'s effect for the existing redirect logic to
mirror the eligibility check from.

**Effort:** S human / few min CC once the desired behavior is picked.
**Priority:** P2 (silent, promise-breaking redirect on a primary nav choice).

**Deferred from:** `/qa` 2026-08-30, branch
`claude/engineering-math-qa-testing-a6r75p`.

## Post-LA scaling of the Math-Academy layer

**Trigger:** LA lift evidence in the effectiveness ledger (the `fire_v1_gate_ma`
experiment resolving) AND catalog depth exceeding ~10 practice items per
concept.

**What:** two mechanisms that only pay off after Linear Algebra proves the
pattern: (a) encompassing edges (`encompasses:` in `data/curriculum/gate-ma.yml`)
for the remaining 71 concepts, and (b) interleaving / non-interference task
ordering in the readiness engine.

**Why:** both are core Math Academy mechanisms (see
`docs/designs/linear-algebra-realtime-and-math-academy-plan.md`). Encompassing
edges beyond LA multiply FIRe's review compression across the whole graph;
interleaving needs item volume that does not exist below ~10/concept, which is
also why quizzes carry a content-depth gate.

**Where to start:** the LA edge-authoring guide and validation CI from B1 apply
unchanged — scaling is authoring, not architecture. Interleaving slots into
`ProtoCATSelector` scoring (`src/scoring/proto-cat-selector.ts`) as a
similarity penalty between consecutively served items.

**Effort:** XL human / L with CC, spread over months. **Priority:** P3.

**Deferred from:** `/plan-ceo-review` 2026-08-18 (D7/OV review), branch
`claude/linear-algebra-realtime-demo-evwq4b`.

## Blueprint stance axis for cadence attribution

**Trigger:** a second cadence worth testing against the first, and session
volume supporting n≥30 per arm.

**What:** add a stance axis to the blueprint layer as `BlueprintDecisionsV2`
plus a `decisions_v2 JSONB` column, so the lift ledger can group measured
outcomes by which cadence produced a variant.

**Why:** six topic cadences will generate 566 variant files. Nothing currently
records *which* cadence shape produced a given variant, so when lift numbers
arrive you can compare "variant vs base" but not "cadence A vs cadence B".
Cadence quality stays a taste call rather than something with evidence.

**Why not now:** with one cadence per topic there is nothing to compare
against. The lift ledger already answers the more basic question.

**Where to start:**
- `src/blueprints/types.ts:10` forbids mutating v1 ("v1 is permanent") and
  names the migration path: a parallel V2 type + a new persisted column.
- `experiment_assignments.target_kind` already accepts `'atom'`, so per-atom
  assignment works today with no schema change. The only missing piece is the
  cadence label to group by.
- `src/experiments/lift.ts` computes `lift_v1` via Welch's t-test with the
  n≥30 / p<0.05 promotion thresholds. That formula is locked — a new metric
  ships as `lift_v2` in a new column, never as an edit.

**Depends on:** ~~the 566-file generation landing~~ (landed in 4.43.0 — 606
base/variant pairs across all 101 concepts), and real session volume.

**Deferred from:** `/plan-eng-review` 2026-08-16, Issue 3 (authoring recipe
correctly lives in `templates/<topic>.yaml`; measurement is the separate
reason the blueprint might earn it later). See
`docs/stance-axis-scaling-plan.md`.

## Flat-file stores are single-instance only

**Trigger:** before any deploy that runs more than one server instance.

**What:** finish the async migration for the three stores now mirrored to
Postgres — `auth/user-store.ts`, `feedback/store.ts`,
`syllabus-bridge/store.ts`.

**Status:** the DATA-LOSS half is fixed (migrations 041 and 042). User
accounts, student feedback and generated bridge content all mirror on write
and restore at boot when `.data` has been wiped. What remains is concurrency.

**Why it is still open:** the file is the read path and it is per-instance.
Two servers each hold their own copy and hydrate only at boot, so a write on
instance A is invisible to B until B restarts. Render's free tier is
single-instance, so this is not a live bug — it becomes one the day the
service scales out.

**Why it was not done:** every export in these modules is synchronous and
Postgres is not. `user-store.ts` alone has 17 sync exports across 13
production files including every auth route, on modules carrying
`@ts-nocheck`. That is a reviewed change, not a loop task.

**Where to start:** the mirrors exist and round-trip, so the work is
mechanical — make the read path async, follow the type errors, drop the file
once every caller awaits. `src/sessions/session-store.ts` is the model for the
finished shape, and `src/storage/repositories/durable-store-repo.ts` already
holds the table mapping.

**Also still file-only:** roughly nine other `createFlatFileStore` call sites
(exams, attention, sample-check, admin-orchestrator, exam-builder, content
telemetry, teaching turns). None were audited for whether they hold anything
worth keeping. That audit is the honest next step, not an assumption that they
are fine.

## The circumstance filter has no empty-set fallback

**Trigger:** the moment work starts on the circumstance axis (T11).

**What:** when a language / bandwidth / device filter removes every candidate
atom, serve degraded content rather than nothing.

**Why:** the CEO review moved circumstance out of the ranking scorer and made
it a pre-ranking FILTER, because low bandwidth means "do not send the 4MB GIF",
not "rank it slightly lower". That is the right call and it introduces a
failure a weight cannot have: a weight can only reorder a non-empty set, a
filter can empty it. A Tamil-medium student on a low-bandwidth connection
would then get a blank lesson, silently, with no error path.

This codebase has already learned the same lesson once: dedup in
`src/personalization/selector.ts` needed progressive backoff (7d → 3d → 1d →
0d) for exactly this reason.

**Where to start:** the filter belongs upstream of `applyPersonalizedRanking`
— that function only re-ranks an already-selected set — so in
`src/personalization/lesson-wire.ts` or the compose route. Mirror the dedup
backoff: relax the constraint by steps rather than returning empty, and when
every step is exhausted serve the unfiltered set instead of nothing.

**Depends on:** T11. **Blocked by:** T1's column allowlist decision, since
where circumstance is stored determines what the filter can read.

## Four board curricula need four bridge mappings, not just four syllabi

**Trigger:** when board expansion is scheduled and someone is named to author
the content.

**What:** correct the scope of "author the missing state-board curricula".

**Why:** `src/syllabus-bridge/registry.ts` registers a curriculum AND a
mapping, and `batch-runner.ts` throws without a `BridgeMapping` entry. Tamil
Nadu is 148 lines of curriculum plus 256 lines of hand-authored mapping
(`gap_class`, `difficulty_jump`, `bridge_note` per topic). The mapping is the
larger half and the one that needs subject-matter judgement about where a
board syllabus and an exam syllabus diverge.

So CBSE, ICSE, Karnataka PUE and Maharashtra HSC are eight artifacts, not
four, and the expensive half cannot be generated from the syllabus alone.

**Depends on:** a named author. This is a sourcing problem inside an
engineering timeline, and no estimate is meaningful until someone owns it.

## The flat-file stores left on disk on purpose

**Trigger:** anyone reading migration 043 and asking "why not all of them?"

**What:** eleven of the 30 `createFlatFileStore` call sites are NOT mirrored,
and that is a decision rather than an omission. Recorded here so the next
audit does not re-derive it.

**Recomputable — mirroring them would store a cache:**

- `src/content/telemetry.ts` — derived from the events it counts
- `src/curriculum/quality-aggregator.ts` — rolls up verification results that
  are themselves persisted

**Working state of a single run — a lost one is re-runnable:**

- `src/admin-orchestrator/agent.ts` and its `task-store.ts`
- `src/exam-builder/event-log.ts`
- `src/marketing/sync-engine.ts`
- `src/syllabus-bridge/store.ts`'s batch half. Its *content* half IS mirrored
  (migration 042) because generating it cost model spend; the batch record
  that produced it did not.

**Wired but hydrated differently:** notebooks. Each student's notebook is its
own file (`.data/notebooks/{user_id}.json`), so there is no single collection
for `hydrateAllDurable` to walk. `hydrateNotebook(user_id)` restores one on
first read instead. If notebooks ever move into a single file, fold them into
the boot sweep.

**If this changes:** the list of what IS wired is asserted in
`src/__tests__/unit/storage/durable-flat-file.test.ts`, so adding a store
there without registering it fails CI rather than failing at the next restart.

## The single-instance assumption under durable_records

**Trigger:** before running more than one server process against one database.

**What:** `mirror()` deletes rows in the collection (or scope) that are not in
the set it was handed, so two instances with divergent local files would take
turns deleting each other's records.

**Why it is acceptable today:** Render runs one instance, and the file is the
source of truth with Postgres as the mirror — not the other way round.

**What it needs:** either a last-writer-wins timestamp check on delete, or
promoting the hot collections (retention, trajectory) to real tables that the
application reads from directly instead of hydrating into a file. The second
is the better end state; the first is the cheap stopgap.

## Generation cost is attributed to a provider that may not have served it

**Trigger:** before trusting the spend cap's numbers, or before the cost meter
gates anything a customer pays for.

**What:** `src/syllabus-bridge/batch-runner.ts` decides which provider to
record by asking which API key is present, not which provider answered:

```ts
const provider = hasAnthropic ? 'anthropic' : hasGemini ? 'gemini' : 'openai';
```

`LLMClient` picks the route itself and can fall back. So on a deploy with two
keys set, a call the router sent to Gemini gets recorded as Anthropic and
priced at Anthropic's rate by `estimateCost(provider, tokens)`.

**Why it matters and how much:** `cost_usd` feeds `recordSpend`, so the run's
accumulated spend — the number the cap is compared against — can be wrong in
either direction. Bounded, because the pre-call check uses
`estimateUnitCost(unit)` rather than the accumulated total, so the cap still
refuses before an over-budget call. The damage is reporting accuracy, not
runaway spend.

**Not a regression:** main has the same shape with the branches in the other
order. This branch flipped the precedence to match `BRIDGE_MODEL_ID`, which
now names Claude explicitly. Wrong either way.

**The fix:** `LLMClient` already knows the answer — it emits
`generate:complete` with `provider: current.provider` and calls
`logRoutingDecision({ servedProvider })`. Either surface that on the response
object or subscribe to the event and read it. Deliberately not done during a
ship: it changes a return shape every caller of the LLM client shares, and
that is not a change to rush on the way to production.

## A corrupt .data file still loses data, mirror or not

**Trigger:** before describing migrations 041-043 as "your data is safe" to
anyone. They make data survive a WIPE. They do not make it survive
CORRUPTION, and the difference is invisible from the outside.

**What:** `createFlatFileStore.read()` returns the empty default shape when a
file exists but will not parse — the same value it returns for a file that was
never written. Verified: writing `{ this is not json` to a store's path makes
`read()` return `{items: []}` with no throw.

For a mirrored store the consequence now reaches further than it used to. The
next write persists the empty shape locally and then mirrors it, and
`mirror()` deletes every row not in the list it was handed. So one unparseable
file empties the durable copy that existed to protect it.

**Not a regression:** before 043 there was no durable copy, so corruption was
total loss then too. It is a limit on what the durable stores promise, not a
new way to lose data.

**Done so far:** `read()` now logs loudly on both the parse failure and the
shape-check failure, so the event is visible instead of silent. Behaviour is
unchanged on purpose — returning the default is what all 30 call sites expect,
and throwing would take the server down over one bad file.

**The real fix:** distinguish "absent" from "unparseable" in the return, and
have the durable layer refuse to mirror a delete-everything when the local
read was the unparseable kind. That needs a signal `read()` does not currently
carry, touching a helper shared by 30 call sites — deliberately not attempted
on the way to a production deploy.

## Practice-item batch runs need real verifier deps wired at the poller call site

**Trigger:** before anything populates `config.target.practice_item_specs`
(i.e. before a real practice-item `GenerationRun` can be launched — nothing
creates one today).

**What:** `src/generation/batch/poller.ts`'s `getOrchestrator()` calls
`handleJobProcessed` → `deps.dispatchPracticeItemJob(job.atom_spec, job.result)`
with only two arguments — the third, `PracticeItemDispatchDeps`, is never
passed, so it defaults to `{}` on every real poll pass. `solveSecondary` and
`wolframCheck` are always undefined in production.

**Why it matters:** `dispatchPracticeItemJob` (`src/generation/practice-item-
factory/batch-dispatch.ts`) is fail-closed by design when a verifier isn't
wired: mcq/msq refuse terminally (correct, and unaffected by this TODO — a
refusal is a valid terminal outcome). nat items used to return `pending_retry`
in the same structural-absence case, which is NOT terminal — it tells the
orchestrator to skip stamping `processed_at` and try again next pass. Since no
future pass ever populates `deps.wolframCheck` on its own, a run containing
even one nat spec would poll forever and never reach `'complete'`.

**Fixed here (adversarial-review pass):** the structural case (no
`wolframCheck` at all) now refuses terminally, same shape as the mcq/msq
`solveSecondary` check — a run with unwired deps can finish (with everything
refused) instead of hanging. The genuinely transient case — Wolfram itself
gets called and returns `status: 'inconclusive'` — is unchanged and still
`pending_retry`, because that one really might succeed on a later pass.

**RESOLVED (2026-08-25, intent-restructure branch):** `poller.ts` now builds
real `PracticeItemDispatchDeps` per job (`buildSolveSecondaryFn` over the
distinct-secondary provider routing; `verifyProblemWithWolfram` gated on the
existing wolfram feature flag), and `orchestrator.ts`'s `prepare()` carries a
launch guard (`assertPracticeItemLaunchReady`) that fails a FRESH practice-item
run loudly at launch when its item kinds' verifiers aren't configured — resume
of in-flight runs is structurally unaffected. What remains open is only the
original trigger: nothing populates `config.target.practice_item_specs` yet,
so the first real launch caller should re-verify end-to-end against a live
provider config.

## `intent-profiles.yml`'s proposed error-tag strings never got a mapping decision

**Trigger:** before anyone claims the W3.4/E4 `ErrorTag` extension "covers" the
market-study's error taxonomy, or the next time an `ErrorTag` union grows.

**What:** `data/curriculum/gate-em/intent-profiles.yml`'s `error_tags.proposed`
lists (`over-calculation`, `condition-check`, `orientation`,
`distribution-selection`, `rounding`, `stopping-condition`, `definition-confusion`,
and others across the 8 profiles) were never moved to `existing`, and no
decision was recorded on what should happen to them.

**Why it's still open:** E4 asked for exactly this move wherever a proposed
string matched one of the 7 new `ErrorTag` members
(`method_selection`/`representation`/`mode_msq`/`mode_nat_entry`/
`time_pressure`/`risk_decision`/`prerequisite`). Checked in commit `470d09a`
(`docs/designs/2026-08-27-content-readiness-market-research-integration.md`,
IMPLEMENTATION RECORD §"P2c"): none of the proposed strings match any new
member by name, so nothing moved — correctly, since inventing a mapping would
have been worse than leaving it undecided. But that leaves the proposed list
sitting there unresolved: some of those strings (e.g. `condition-check`,
`definition-confusion`) look like plausible synonyms for tags that DO exist
now, and an operator, not a pattern-match, should decide synonym-vs-distinct
per string.

**Where to start:** `src/core/interfaces.ts`'s `ErrorTag` union is the lockstep
anchor (migration `053`, `ERROR_TAGS` mirror in `scripts/check-intent-catalogue.ts`,
`KNEW_IT_TAGS` in `src/readiness/mock-to-marks.ts` — see that file's
union-completeness test for what a new member must touch). Walk each proposed
string against the 13 current tags one at a time: either it's a synonym (drop
it from `proposed`, tag content with the existing member) or it names a real
14th gap (open a new plan amendment — do not add it silently, per the same D9
discipline that classified `mode_msq` explicitly rather than defaulting it).

**Deferred from:** `docs/designs/2026-08-27-content-readiness-market-research-integration.md`
core-plan wrap-up, 2026-08-27, branch `claude/autoplan-content-readiness-4vfhcn`.

## No DB-backed SQL tests for `markRunStatus` / the budget-fallback COALESCE

**Trigger:** before trusting `generation_runs.status` reconciliation or
`budget_remaining_usd` under a real Postgres instance for the first time (i.e.
before or during the W3.5 pilot, since both sit on the pilot's launch path).

**What:** two SQL-shaped pieces of P3's batch-orchestrator wiring
(`docs/designs/2026-08-27-content-readiness-market-research-integration.md`
IMPLEMENTATION RECORD §"P3b", commit `d114fec`) are covered only by mocked-pool
unit tests, never against a real database:

- `src/generation/run-orchestrator.ts`'s `markRunStatus()` — a bare
  `UPDATE ... SET status = $2 ... WHERE id = $1 AND status = 'running'`. The
  `WHERE status = 'running'` guard (so this can never resurrect a run some
  other path, e.g. an operator abort, already terminalized) has never been
  exercised against real Postgres row-locking/visibility semantics.
- `src/generation/batch/pg-persistence.ts`'s `BUDGET_REMAINING_SQL` — a
  `COALESCE(config->>'budget_remaining_usd', ...)` expression whose fallback
  to `config.quota.max_cost_usd` (replacing a hardcoded $100 default) was the
  actual bug fix in `d114fec`. A mocked pool asserts the query STRING; it
  cannot catch a JSONB-path typo or an operator-precedence mistake the way a
  real `COALESCE` evaluation would.

**Why it's still open:** the full suite (4,138 backend tests as of this
branch) runs against mocked `pg.Pool` instances everywhere in this module —
there is no integration-test harness against a live Postgres in CI today
(the closest is `docker-compose.yml`'s local parity stack, which is manual).
Writing this properly means standing up that harness, or at minimum a
targeted `docker compose`-gated test file, which is bigger than this branch's
scope.

**Where to start:** `docker-compose.yml` already gives a real Postgres+pgvector
locally; a new `*.integration.test.ts` (gated behind a `DATABASE_URL` env
check, skipped when absent, matching the pattern several `__tests__` files
already use for DB-optional suites) exercising `markRunStatus` against a
seeded `generation_runs` row and `BUDGET_REMAINING_SQL` against a row with and
without `config.budget_remaining_usd` set would close this without touching
CI's default (mocked, fast) path.

**Deferred from:** `docs/designs/2026-08-27-content-readiness-market-research-integration.md`
core-plan wrap-up, 2026-08-27, branch `claude/autoplan-content-readiness-4vfhcn`.

## W-A activation-push pages (a)-(b) are a follow-up PR, not landed here

**Trigger:** once PR #129 (this branch) merges and the demo is confirmed live
with `VIDHYA_INTENT_LANES=on`.

**What:** the plan's W-A minimal activation push has three parts; only the
mechanism this branch shipped (the flag-on demo itself, P0) is live. Still to
build, agent-side:

- (a) publish the LA sub-topic pages as indexable public pages, using the
  intent catalogue's existing representative queries / SEO fields — per the
  plan, "data that has sat dormant through two plans."
- (b) one honest "what this is" landing section naming the actual problem
  statement (mock counterfactual + method selection + verified practice), not
  generic ed-tech copy.

(c) — sharing verified solutions into GATE Overflow / r/GATEtard — stays
operator-timed and is explicitly not agent work, per the plan.

**Why:** §7 metric 4 (the activation gate: ≥50 weekly-active students) is what
unlocks every gated expansion in the plan (W3.1 mode readiness, W3.3
remediation, W3.7 calibration, W3.8 triage/re-entry, W2.3/W2.4/W2.6 deltas).
Without real traffic to the now-live demo, that gate never opens, and the plan
says so explicitly rather than pretending artifact-completion is the same as
activation.

**Where to start:** `data/curriculum/gate-em/` already carries the
representative-query / SEO fields the plan references (see
`template-families.yml` and the intent catalogue's own schema); the LA
sub-topic page shell exists in `frontend/src/pages/app/` under the Knowledge
Shell — check `KnowledgeHomePage.tsx`'s routing for the nearest existing
pattern to extend rather than a new page type.

**Deferred from:** `docs/designs/2026-08-27-content-readiness-market-research-integration.md`
core-plan wrap-up, 2026-08-27, branch `claude/autoplan-content-readiness-4vfhcn`
(plan's W-A workstream, §"Minimal activation push").

## `attempt_facts.skill_id` is always null on mock-exam writes — topic accuracy needs a join

**Trigger:** before extending `src/gbrain/topic-accuracy.ts` to a NEW
attempt-writing surface, or the next time someone assumes `attempt_facts`
alone answers a per-concept question.

**What:** `src/api/mock-exam-routes.ts`'s per-question `attempt_facts` write
(the W3.2 counterfactual's evidence source) always sets `skillId: null`,
because a mock question carries only a coarse `topic` column, never a
concept id. `src/gbrain/topic-accuracy.ts` works around this today with a
`LEFT JOIN` against `pyq_questions.topic` / `generated_problems.topic` by
`object_id`, dropping any row that matches neither (documented in that
file's header comment).

**Why it's a gap, not a bug:** the join is correct and tested, but it means
"per-topic accuracy" and "per-concept (`skill_id`) accuracy" are two
different queries with two different reliability profiles forever, unless
mock questions gain a real concept id. Quiz-session and practice-item
attempts (which DO carry `skill_id` natively) don't need the join at all —
only the mock-exam lane does, and that asymmetry is easy to forget when
writing the next consumer of `attempt_facts`.

**Where to start:** native skill ids on mock questions would need
`mock_exams`' generated question set to carry a `concept_id` alongside
`topic` (the questions are drawn from `pyq_questions` / `generated_problems`
at exam-build time, both of which already have `concept_id` in some form —
see migration `044_pyq_concept_id.sql`), then `mock-exam-routes.ts`'s
`AttemptFact` construction threads it through instead of hardcoding `null`.
Until then, any new per-concept aggregate over `attempt_facts` should follow
`topic-accuracy.ts`'s join pattern rather than trusting `skill_id` to be
populated for every row.

**Deferred from:** `docs/designs/2026-08-27-content-readiness-market-research-integration.md`
core-plan wrap-up, 2026-08-27, branch `claude/autoplan-content-readiness-4vfhcn`
(flagged in the plan's P2a work, `src/gbrain/attempt-facts.ts`).

## Demonstrations-as-visual-standard curation

**Trigger:** a real legal read on independent re-implementation (whether
building a widget from a Demonstration's underlying MATHEMATICAL IDEA,
without copying its expression/code, clears CC BY-NC-SA 3.0 — copyright
protects expression, not the idea, but that inference is `design_hypothesis`
evidence level, not verified) AND the 50-item anatomy pilot is complete.

**What:** `concept → demo idea → widget spec` mappings — using the Wolfram
Demonstrations Project (~13,000 demos) as a DESIGN STANDARD for what a good
interactive looks like, never as an import/embed source. MIT-licensed
preview snapshots are usable as authoring reference in the meantime, if/when
this is picked up.

**Why not now:** the Demonstrations corpus itself is CC BY-NC-SA 3.0 (no
commercial embedding/redistribution) and CDF embedding has been dead since
~2021 — both close the direct-import path outright (see Move A/B's sibling
rejections R1/R2 in `docs/designs/2026-08-28-wolfram-t3-content-strategy.md`).
This item is specifically the narrower "use a demo's IDEA as inspiration for
an original `interactive-spec` widget" path, which needs the legal read
before it is more than speculation, and doesn't serve the pilot either way.

**Deferred from:** `docs/designs/2026-08-28-wolfram-t3-content-strategy.md`
(Move B implementation, parking lot), 2026-08-28, branch
`claude/autoplan-content-readiness-4vfhcn`.

## WL→safe-evaluator translation adapter

**Trigger:** 3+ authoring sessions each hand-translating Wolfram Language
output into the frontend's safe-evaluator grammar
(`frontend/src/components/lesson/interactives/types.ts`'s recursive-descent
parser — no `Function()`/`eval()`).

**What:** a dedicated adapter that converts WL expression output (from an
authorized Wolfram MCP session's `WolframLanguageEvaluator` calls, per
Posture W) directly into `interactive-spec` / `gif-scene` widget JSON,
instead of an agent doing the translation by hand each time.

**Why not now:** no live authoring session has exercised this yet — Posture
W is new. (Update 2026-08-29: the Wolfram MCP connector, unauthenticated
when this item was filed on 2026-08-28, is now live and authenticated — see
`docs/ops/content-verification-runbook.md` §0's updated Posture W note. That
changes only whether Posture W's ad hoc usage is possible, not this item's
trigger.) Building the adapter before a real session has hit the
hand-translation pain three times is building ahead of demonstrated need.

**Where to start:** `frontend/src/components/lesson/interactives/types.ts`'s
schema is the target shape; `src/content/concept-orchestrator/gif-generator.ts`
is the target shape for `gif-scene` blocks. The adapter's job is purely
syntactic translation — it must never call Wolfram itself (that stays
Posture W's ad hoc, human-authorized MCP usage).

**Deferred from:** `docs/designs/2026-08-28-wolfram-t3-content-strategy.md`
(Posture W, parking lot), 2026-08-28, branch
`claude/autoplan-content-readiness-4vfhcn`.

## Show Steps content in worked examples

**Trigger:** §0 of `docs/ops/content-verification-runbook.md` (Wolfram
licensing terms) is filled in, specifically the Show Steps API's
redistribution terms for product content.

**What:** using Wolfram|Alpha's Show Steps API to generate or check
step-by-step worked solutions inside `worked_example` atoms, instead of
(or alongside) LLM-authored solution steps.

**Why not now:** Show Steps redistribution terms for product content are
unconfirmed (`docs/designs/2026-08-28-wolfram-t3-content-strategy.md`'s
ground-truth audit) — this is licensing-gated, same as Tier 3 activation
itself, and §0 is where that answer gets recorded once an operator pulls it.

**Where to start:** `src/services/wolfram-steps-cache.ts` and
`src/jobs/wolfram-verify-job.ts`'s step-harvest leg
(`.data/wolfram-steps/<problem_id>.json`, provenance-stamped) already fetch
and cache Show Steps output for VERIFICATION purposes — this item is about
whether that content can additionally be shown to students, which is a
different (redistribution) licensing question than the verification-only
use already live.

**Deferred from:** `docs/designs/2026-08-28-wolfram-t3-content-strategy.md`
(Move B implementation, parking lot), 2026-08-28, branch
`claude/autoplan-content-readiness-4vfhcn`.

## Wolfram Engine batch asset generation

**Trigger:** a demonstrated need `gifenc`
(`src/content/concept-orchestrator/gif-generator.ts`) cannot meet, AND a
confirmed Wolfram Engine production license (§0 of
`docs/ops/content-verification-runbook.md`).

**What:** using a licensed Wolfram Engine to batch-generate visual assets
(plots, animations) for concept atoms, as an alternative or supplement to
the existing pure-JS `gifenc` pipeline.

**Why not now:** the free Wolfram Engine's license explicitly forbids
production use, including non-commercial end-user deployment — a paid
production license is a real cost with no confirmed price yet
(`docs/designs/2026-08-28-wolfram-t3-content-strategy.md`'s ground-truth
audit), and `gifenc` already covers `parametric-curve`, `level-set`, and
`discrete-bars` scenes with no live dependency or license exposure. There is
no known gap it fails to meet today (see the v4.36.0 "every topic walkable"
entry in `CLAUDE.md`: gif-scene renders went from 66/28-skipped/6-failed to
70/30/0 — zero known-broken scenes).

**Deferred from:** `docs/designs/2026-08-28-wolfram-t3-content-strategy.md`
(Move B implementation, parking lot / rejected R1), 2026-08-28, branch
`claude/autoplan-content-readiness-4vfhcn`.

## Resonance scenes for intuition atoms of the four pioneer concepts

**Trigger:** resonance hooks (branch `claude/autoplan-content-resonance-q5p197`)
ship and the `resonance_hooks_v1_gate_ma` experiment row shows engagement signal —
or the next authoring batch on LA content for any reason.

**What:** `determinants`, `eigenvalues`, `linear-transformations`, `orthogonality`
carry narration-beat simulations on their hook atoms; their `intuition` atoms
still use static `manipulable`/directive interactives. Author beat-fused scenes
(per the resonance schema: per-stance texts, one trap beat, ghost path) for those
four intuition atoms, propagated byte-identically into both stance variant files.

**Why:** deferred from the resonance plan's cherry-pick ceremony — it doubles the
W3 authoring load for four concepts while W4's generation wiring covers intuition
atoms for everything generated going forward. Worth doing by hand only once the
hook-level pattern shows signal.

**Where to start:** `docs/designs/2026-08-30-resonance-fused-atoms-plan.md` (the
schema + design contract), `modules/project-vidhya-content/concepts/<id>/atoms/intuition*.md`.

**Effort:** M human / ~30 min CC per concept incl. Wolfram verification.
**Priority:** P3.
**Deferred from:** /autoplan CEO phase, 2026-08-30.

## Trap-beat wording can drift from its source common-traps atom

**Trigger:** any edit to a `common-traps.md` file for a concept whose hook carries
a resonance trap beat; or a QA report of a trap beat contradicting the Common
Traps card in the same lesson.

**What:** resonance trap beats cite the highest-cost trap from the concept's
authored `common-traps.md`, but nothing mechanical links them — a later edit to
the traps atom can leave the beat teaching an outdated or contradicting version.
Options when this bites: a `ci:` check greping trap-beat text for a keyword
anchor into the source atom, or an authoring-note convention in the spec fence.

**Why:** named as the one debt item in the resonance plan's trajectory review
(S10); cheap to fix once real, speculative to build before any drift has occurred.

**Where to start:** `scripts/check-variant-agreement.ts` (walker precedent) or a
new small check; `docs/designs/2026-08-30-resonance-fused-atoms-plan.md` S10.

**Effort:** S human / ~15 min CC.
**Priority:** P3.
**Deferred from:** /autoplan eng phase, 2026-08-30.

## Delivery-modifier framework for `formal_definition`/`mnemonic` — only `#device-reveal` shipped

**Trigger:** the next content-authoring pass touching `formal_definition`
atoms, or renewed "definition/mnemonic feels thin, no MOAT" feedback.

**What:** `docs/designs/2026-09-01-definition-mnemonic-engagement-framework.md`
proposes five composable delivery modifiers grounded in six cognitive-load/
generative-learning results (Sweller, Roediger & Karpicke, Fiorella & Mayer,
Bjork & Bjork, Chi et al., Paivio/Mayer). `#device-reveal` (the `mnemonic`
paragraph stagger) shipped in v4.45.0. Four remain unbuilt: `#term-first`
and `#not-this` and `#apply-once` are content-only (wrap the statement in
the existing `<details>` convention; one authored line per atom);
`#restate-check` needs a distractor-sourcing pipeline off each concept's
`common-traps.md` — real work, not mechanical, since parsing prose traps
into MCQ-shaped near-misses isn't a lookup. A further `#mnemonic-scene`
(extending the resonance-beat `isBeatAtom` gate, `orchestrator.ts:598`, to
`mnemonic`) is named as a later follow-up only, not scoped here.

**Why not fixed inline:** each remaining modifier is either a product/
content-authoring call (what a good `#not-this` line says per concept) or
real engineering (the distractor picker) — the doc's own §4 explicitly
declines to decide either here.

**Where to start:** `docs/designs/2026-09-01-definition-mnemonic-engagement-framework.md`
§3 (modifier table), §7 (suggested build order).

**Effort:** S human / CC ~15 min per content-only modifier row;
`#restate-check`'s distractor picker is its own follow-up PR (M-sized).
**Priority:** P3.
**Deferred from:** `/investigate` session, 2026-09-01, branch
`claude/exam-pattern-engagement-bugs-wdff09`.

## Remaining pages still gate on hasRole() without an auth-loading guard

**Trigger:** the next live-QA pass on any admin/owner/teacher-only page, or a
support report of "I'm signed in as X but the page said I'm not authorized"
that resolves on a refresh/retry.

**What:** `AuthContext`'s `user` is `null` until the async `/api/auth/me`
call resolves, and `hasRole()` reads `user` — so any page that renders a
"role required" gate off `hasRole()` without first checking `loading` shows
a false permission-denied flash to a fully-authorized user on every fresh
page load (most visibly after the demo-login walkthrough's
`window.location.assign`, which remounts the whole app). `/investigate`
(2026-09-01) and this branch's own `/ship` pre-landing review fixed the four
pages actually in the reported repro paths — `TeachingDashboardPage.tsx`,
`TeacherRosterPage.tsx`, and (found by Red Team review) `AdminDashboardPage.tsx`
— by adding `if (authLoading) return <Loading/>;` before the `hasRole()`
gate. The same pattern is still missing on:
`ContentStudioPage.tsx`, `ExamGroupsPage.tsx`, `ExamSetupPage.tsx`,
`FeaturesPage.tsx`, `FounderDashboardPage.tsx`, `OwnerSettingsPage.tsx`,
`UserAdminPage.tsx`.

**Why not fixed inline:** none of these were in the reported bug's repro
path, and applying the same two-line change to seven files without a live
QA report motivating each one risks masking a genuinely-wrong role check
behind "it's just the loading race" — worth a deliberate pass, not a
drive-by batch edit bundled into an unrelated fix branch.

**Where to start:** grep each file for `hasRole(` and mirror the guard added
to `TeacherRosterPage.tsx`/`TeachingDashboardPage.tsx`/`AdminDashboardPage.tsx`
in this branch — destructure `loading: authLoading` from `useAuth()`, return
a loading state before the `hasRole()` early return, gate the data-fetching
effect on `!authLoading`.

**Effort:** S human / CC ~5 min per page (mechanical, same diff shape ×7).
**Priority:** P2 (real UX bug, but each instance needs its own confirmation
that hasRole() is otherwise correct before assuming the fix applies as-is).
**Deferred from:** `/ship` pre-landing review, 2026-09-01, branch
`claude/teaching-audit-progress-bugs`.

## `/teacher/roster` direct navigation still dead-ends for admin/owner

**Trigger:** the next report of an admin/owner landing on "No students
assigned yet" — via a bookmark, browser back/forward, or a stale link —
after this branch's nav-tab and dashboard-chip fixes ship.

**What:** this branch fixed the two known entry points that sent admin/owner
to `frontend/src/pages/app/TeacherRosterPage.tsx` (the Admin Dashboard's
"need attention" chip, and the teacher-persona bottom-nav "Students" tab —
both now point at `/admin/cohort` for admin/owner). The route itself is
untouched: `TeacherRosterPage.tsx`'s `hasRole('teacher')` check passes for
admin/owner too (role hierarchy — `roleGte` ranks them above teacher), and
`/api/teacher/roster` is scoped to the calling user's own `teacher_of[]`
list, which no admin/owner has. Direct navigation — a bookmark, browser
back/forward, a stale shared link — still reproduces the original "No
students assigned yet" dead end for that role.

**Why not fixed inline:** found by Red Team review (2026-09-01) as a
pre-existing gap, not a regression introduced by this branch, and the right
fix is a product call — redirect admin/owner away from this route entirely,
or have the page detect the role and show a different, accurate empty
state ("You don't have a personal roster — see the cohort view") instead of
the teacher-facing copy ("Ask your admin to assign students to you"), which
is actively wrong advice for an admin to see.

**Where to start:** `frontend/src/pages/app/TeacherRosterPage.tsx:66-74`
(the empty/denied states) — branch on `user?.role` the same way
`AppLayout.tsx`'s nav-tab fix does, or redirect via `useNavigate()`.

**Effort:** S human / CC ~10 min once the desired behavior (redirect vs.
role-aware messaging) is picked.
**Priority:** P3 (narrower than the two already-fixed entry points; needs a
bookmark/back-button visit specifically to hit).
**Deferred from:** `/ship` Red Team review, 2026-09-01, branch
`claude/teaching-audit-progress-bugs`.

## Bounded-depth diagnostic probe REPLACING the live prerequisite-alert path

**Trigger:** the next `/student-audit` or prerequisite-alert investigation
that turns out to have misdiagnosed a wrong answer's cause, or a decision to
have `traceWeakestPrerequisite`/`refreshPrerequisiteAlerts` themselves use
the bounded-depth ranking instead of the unbounded BFS.

**What:** `src/gbrain/diagnostic-probe.ts`'s `diagnoseWrongAnswer()` (shipped
2026-09-02) implements the research's bounded-depth, ranked, converging-
evidence-gated probe as an ADDITIVE view — wired into `student-audit.ts`'s
report only. `traceWeakestPrerequisite` (`src/constants/concept-graph.ts:351-
384`) and `refreshPrerequisiteAlerts` (`src/gbrain/student-model.ts:378-396`)
— the live path that gates real interventions — are untouched on purpose.
This entry tracks the REMAINING step: deciding whether/how the live path
itself should adopt the bounded algorithm, not building the algorithm (done).

**Why not fixed inline:** the live path gates real interventions for real
students — a correctness regression here is student-facing and needs its
own reviewed change with regression tests against known student cases, not
a rider on an infrastructure pass. The additive version already gives a
coach/operator the better view without that risk.

**Where to start:** `src/gbrain/diagnostic-probe.ts` (the algorithm, already
built and tested) vs. `src/constants/concept-graph.ts:351-384` +
`src/gbrain/student-model.ts:378-396` (the live path to migrate, if the
product decision is made to migrate it rather than keep both).

**Effort:** M human / CC ~1 day (the algorithm exists; this is the
migration + regression-test work, not new algorithm design).
**Priority:** P3 — the additive view already ships the research's real
value (a coach/operator sees the bounded, ranked probe today); migrating
the live path is a smaller, lower-urgency follow-up.
**Deferred from:** content-strategy research integration, 2026-09-02, branch
`claude/content-strategy-framework-o9afoc`.

## Custom-PDF extraction/OCR adapter (the data model and repo already ship)

**Trigger:** an operator or teacher actually asks to upload a PDF (a
classroom note, an alternate textbook derivation) for the platform to fold
into content, or a decision on which OCR/extraction library and file
storage to use.

**What:** `src/content/custom-source/types.ts` + `repo.ts` (shipped
2026-09-02, migration `057_custom_source_ingestion.sql`) is the full
register/hash-dedup/permission-gate/span-storage/claim-review data model —
a real, usable seam. `CustomSourceExtractor` (the `extract()` interface in
`types.ts`) is deliberately UNIMPLEMENTED: no OCR provider, no file storage,
no upload UI has been decided. This entry tracks ONLY that remaining step —
a concrete adapter implementing `CustomSourceExtractor`, plus an upload
endpoint that calls `getCustomSourceRepo().registerDocument()` /
`.addSpans()`.

**Why not fixed inline:** the extraction/OCR provider and file-storage
choice is a product decision this pass can't make unilaterally (same
reasoning as the LLMJudge/CASChecker split this repo already used) — an
adapter without that decision would either invent one silently or ship
nothing real.

**Where to start:** `docs/content-spec/integrated-self-improving-learning-
system.md` §15.6 for the pipeline shape; `src/content/custom-source/types.ts`'s
`CustomSourceExtractor` is the interface to implement;
`src/content/custom-source/repo.ts`'s `getCustomSourceRepo()` is the storage
seam already wired and tested; `ReviewQueuePanel.tsx` /
`admin-review-queue-routes.ts` is the closest existing review-queue UI
pattern to model an operator-facing claim-review screen on.

**Effort:** L human / CC ~3-5 days (OCR/extraction library integration,
upload endpoint, review UI — the storage layer is done).
**Priority:** P3 — no demand signal yet; build when an operator actually
has a PDF to ingest.
**Deferred from:** content-strategy research integration, 2026-09-02, branch
`claude/content-strategy-framework-o9afoc`.

## Wire the other 9 `DeltaKind` values to real trigger detectors

**Trigger:** a decision to build a specific personalization trigger beyond
the one that already exists (repeated-failure → whole-atom regen, tagged
`general_remediation`) or beyond `custom_source` (now written by
`src/content/custom-source/repo.ts`'s `addClaimDraft`, once an operator
approves a claim into a real delta — see the custom-PDF entry above for
what's still needed before that path is reachable at all).

**What:** `src/content/delta-kinds.ts`'s `DeltaKind` union has 10
research-named values plus `general_remediation`. Only two have anything
that writes them: `general_remediation` (the existing failure-triggered
regen) and `custom_source` (P7's claim-review repo, once wired to a real
upload flow). The other 8 — `prerequisite_repair`, `representation_shift`,
`definition_boundary`, `execution_drill`, `assessment_mode`,
`time_and_risk`, `verified_computation`, `confidence_calibration` — are
real, typed, and ready to receive writes, but nothing detects the
conditions that should trigger them (a prerequisite-gap probe surfacing an
actionable hypothesis, a representation-mismatch detector, a confidence/
performance divergence check, etc.).

**Why not fixed inline:** each detector is its own scoped project with its
own evidence question (what signal, what threshold, what false-positive
cost) — bundling any one of them into an infrastructure pass that was
about making the TAXONOMY real, not inventing eight new detection
algorithms, would have meant guessing at product decisions with no
evidence behind them.

**Where to start:** `src/content/delta-kinds.ts`'s `DELTA_KIND_DESCRIPTIONS`
names what each kind is FOR; `src/gbrain/diagnostic-probe.ts`'s
`diagnoseWrongAnswer()` is the closest existing building block for
`prerequisite_repair` specifically (it already identifies the candidate,
it just doesn't write a delta yet).

**Effort:** varies per kind — S-M human / CC per detector (each is
independent).
**Priority:** P3 — the taxonomy itself unblocks this; no single kind is
more urgent than another without a product signal.
**Deferred from:** content-strategy research integration, 2026-09-02, branch
`claude/content-strategy-framework-o9afoc`.
