<!-- /autoplan restore point: /root/.gstack/projects/project-vidhya/claude-autoplan-content-resonance-q5p197-autoplan-restore-20260830-142805.md -->

# Resonance: fuse hook, intuition, motion, stress and traps into one experience per atomic topic

**Date:** 2026-08-30
**Branch:** `claude/autoplan-content-resonance-q5p197`
**Status:** under /autoplan review
**Builds on:** `docs/designs/2026-08-30-attention-design-content-rendering.md` (PRs #135/#136),
which fixed placement, palette, hidden answers and hooks, and explicitly left two doors
open: per-topic strategy never reaches generation, and narration-synced motion exists on
4 of ~100 concepts.

---

## 1. The problem, precisely

The user's directive: static text and an animation are shown separately as "intuition"
or "hook". For each atomic topic, hook + intuition + a personalization layer must go
*together*. Each atomic unit needs a declared strategy for conveying the idea in the
most intuitive way — attention hooks using custom motion animation, added stress
(emphasis), and highlighting where mistakes occur and how to avoid them — **in one
instance, not distributed across silos**.

What the codebase does today (verified, file:line in §8):

1. **No per-atom orchestration object exists.** A `ContentAtom` is a markdown string
   plus a server-attached media sidecar, rendered by sibling components
   (`MarkdownAtomRenderer`, `MediaSidecar`, `InteractiveSidecar`) that share no
   timeline. `InteractiveSidecar` renders *outside* the prose/figure stage block —
   the animation is never adjacent to, or synchronized with, the words.
2. **The generator encodes the silo.** `buildPrompt()` instructs "keep the body
   focused on a single learning beat" per atom; each of the 11 atom types is one
   independent LLM call with no shared plan.
3. **Mistakes are taught last and elsewhere.** `common_traps` is a flat prose list,
   sequenced in the "solidifying" tier — after the hook, intuition and worked example
   where the mistake is actually made. Three mistake vocabularies (authored trap
   prose, `ErrorTag` telemetry, `misconception_id`) never meet.
4. **Per-topic strategy is data with no consumer.** The founder's 116-topic spec
   carries `recommended_hooks`, `base_sequence`, `personalized_delta_slots` and an
   `attention_design_hypothesis` per topic; nothing in generation reads it, though
   `atomic-concept-map.ts` now resolves 100/116 ids safely.
5. **The one fusion mechanism that exists is tiny.** `SimulationSpec.narration_steps`
   couples text beats to a playhead — the Apple-keynote technique of *showing* state
   change while naming it. It lives on 4 concepts' hook atoms.

## 2. The strategy — "attention is a budget; salience must be earned per beat"

The reference the directive names — *Attention Is All You Need* — is about computing
relevance-weighted focus: at every step, weight what matters *now* and attend to it.
The learning-science translation of that idea is Mayer's multimedia principles, and
three of them are exactly the missing mechanics here:

- **Temporal contiguity** — words and the picture they describe must arrive at the
  *same moment*, not sequentially. (Today: prose, then a looping GIF, then an
  uncoordinated widget.)
- **Signaling** — stress the load-bearing element at the moment it matters (visual
  emphasis on the term/segment being narrated), instead of uniform grey prose.
- **Segmenting** — learner-paced beats beat one continuous stream. Beats with a
  scrubber, not a wall.

Plus one from the errors literature (erroneous-example studies; the repo's own
research-notes evidence-boundary rules apply): showing the *wrong* path at the moment
the right one is drawn — and naming how to avoid it — beats a trailing list of traps.

**The unit of resonance is the beat.** One beat = one moment of the animation + one
sentence + optional stress + optional trap. The concept's opening experience becomes a
scripted sequence of beats where:

- the **hook beat** makes them look (concrete object, stake — the #135 rewrites
  already fixed the copy; now the motion arrives *with* it),
- the **intuition beats** show the idea moving while the caption names what is
  moving (temporal contiguity),
- a **trap beat** draws the mistaken path as a dashed ghost at the exact progress
  point where students slip, names the trap, and gives the one-line avoidance
  (signaling + erroneous example, fused instead of siloed),
- **personalization** selects the register per beat: the same scene, byte-identical
  geometry, but a `shaken` student hears concrete-numbers-first captions and an
  `assured` student hears the boundary-case caption — riding the existing stance
  machinery instead of inventing a parallel one.

This extends the **one mechanism that already works** (`narration_steps`) rather than
adding a fourth media-attachment channel. Wow comes from information-carrying motion,
which is the only motion the design system permits — no confetti, no shimmer; the
scene *is* the argument.

## 3. Scope — five workstreams

### W1 — Resonance beats: schema + renderer (the mechanism)

Additively extend the `simulation` interactive spec (`v: 1` stays; all new fields
optional, old specs untouched):

```jsonc
"narration_steps": [
  {
    "at_progress": 0.45,
    "text": "The diagonal entries scale each axis — watch $x$ **stretch by 3**.",
    "text_shaken": "Watch the x-arrow: it was length 1, now it is **length 3**.",
    "text_assured": "Scaling is per-axis here — exactly what fails once off-diagonal terms appear.",
    "emphasize": true,                    // the trace segment drawn during this beat renders in heavier ink
    "trap": {                             // presence makes this a TRAP BEAT
      "text": "Students read the 2 as scaling *both* axes.",
      "avoid": "Match each diagonal entry to its own axis before writing anything."
    }
  }
],
"ghost": { "x_expr": "2*cos(t)", "y_expr": "2*sin(t)" }   // the mistaken path, drawn dashed grey
```

Stress/emphasis is carried two ways, both simpler than a dedicated `stress` field:
markdown `**bold**` inside beat text (styled distinctly in beat context — beats now
render through the markdown pipeline, so per-stance emphasis is free and there is no
substring-validation edge case), and the `emphasize` flag, which applies the
signaling principle to the figure itself: the trace segment drawn during that beat
gets a heavier ink stroke. Beats are capped at **8 per scene** by the validator
(refused above that — a dot row must stay one row on a 320px phone).

Renderer (`Simulation.tsx` + a small amount of `types.ts`):

- Beat text renders through `MarkdownAtomRenderer` (math + bold now work in beats;
  today beats are plain text so `$x$` would print raw).
- Per-stance beat text chosen by the atom's `served_stance` (threaded down as a prop;
  base text is the `steady` fallback). The fenced block stays **byte-identical**
  across base/shaken/assured files — `ci:variant-agreement`'s `interactive-not-identical`
  rule is satisfied by construction, and stance personalization moves *inside* the
  shared spec.
- **Trap beat treatment:** playhead eases to a brief hold at the trap's progress
  point (skipped under reduced motion), the ghost path draws dashed in `#8e8e93`,
  and a hairline-ruled trap row renders beneath the beat: trap text + "Avoid:" line.
  Ink-and-grey only — Clarity's two accents stay semantic, and a trap is not an
  AI/tutor surface nor a mastery surface.
- **Beat dots** (44px touch targets) under the stage: N dots for N beats; tapping
  seeks the playhead to that beat's `at_progress`. Segmenting, learner-paced.
- **Reduced motion:** unchanged contract (progress pinned to 1, final frame) plus
  every beat listed as static text rows with stress + trap rows intact — the full
  argument survives with zero motion.
- Validation in `parseInteractiveSpec`: new fields type-checked; `stress` must be a
  substring of the chosen text; `trap.text`/`trap.avoid` non-empty; ghost exprs go
  through the same safe formula evaluator.

Also in this workstream's blast radius (same file, found during recon, fix while
here): `PRESET_VARIANTS` in `AtomCardRenderer.tsx` uses raw framer-motion duration
literals that bypass `framerDuration()`, so the 11 entry animations ignore
`prefers-reduced-motion`, and `shake-then-settle` is the "pulse" the design system
bans. Route all presets through motion tokens; replace the shake with a compliant
settle.

### W2 — Fused delivery: the animation joins the stage

`AtomCardRenderer` today renders `InteractiveSidecar` *below and outside* the
prose/figure stage. Change: when an atom's body carries a `simulation` spec, the
simulation renders **as the figure** in the existing `.vidhya-atom-stage` (above the
prose on phones, beside-and-sticky at ≥720px) — the same slot the attention-design
pass built for GIFs. Precedence per atom: simulation > GIF (an atom with both shows
the simulation; its `gif-scene` fence is already stripped from prose and its GIF
simply isn't fetched). `manipulable` and `guided_walkthrough` keep their current
below-the-prose placement — they are things you *do after* reading, not figures.

The hook atom card, when a resonance simulation is present, drops the redundant
static entry animation (`bounce-alert`) in favour of the scene's own motion — one
moving thing per screen, per the one-focal-block rule.

### W3 — Resonance coverage: all 26 Linear Algebra concepts (the flagship proof)

Author fused resonance scenes for every LA concept's hook atom — 4 exist (upgrade
in place: add stress/trap/stance fields), 22 new. Per concept:

- Scene chosen from the concept's actual geometry (LA is the plot-friendliest topic
  in the graph — this is why LA is the flagship, matching the v4.34.0 precedent).
- 3–5 beats; exactly one trap beat, sourced from that concept's authored
  `common-traps.md`. Trap selection is **authorial judgment**, informed by the
  authored trap prose and the hand-authored pain-point registry — stated plainly:
  no cohort telemetry backs it today, and the plan does not pretend otherwise.
- Per-stance beat text following the locked stance register (shaken: concrete
  numbers first, smallest true step; assured: the distinction that costs marks).
- **Every numeric/geometric claim verified against Wolfram before commit** (the
  v4.39.0 discipline; beats describe what is actually on screen at that progress
  value).
- The identical fenced block propagated byte-for-byte into `hook-shaken.md` /
  `hook-assured.md` (blocks may be *added* to variants only in lockstep with the
  base — `interactive-invented` fires otherwise).

Concepts whose idea genuinely does not reduce to a 2D parametric/trace scene get an
honest pass-over with a named reason in the workstream's report — never a misleading
scene (the repo's own "never invent a misleading scene" rule). **Success bar: at
least 20 of 26 LA concepts ship a scene**; every pass-over is named with its reason.

Plus **two non-LA proof-of-generalization scenes** (`limits` — the sin x/x trace,
and one ODE/calculus concept chosen for plot-friendliness) so the mechanism is
demonstrated outside the flagship topic before generation carries it further.

After the authoring fan-out, a **consolidated pedagogy review pass** (one reviewer
reads all trap selections and stance registers together, against the locked stance
rules) runs before commit — automated gates check math and byte-identity, not
whether the chosen trap is the one that costs marks. The PR itself is the operator's
review artifact.

### W4 — Per-topic strategy reaches generation (the flywheel)

New `src/content/resonance-strategy.ts`:

- Joins `atomic-topic-spec.ts` (116 topics) to `concept_id` via the hand-verified
  `atomic-concept-map.ts` (100 resolve; 16 unmapped stay unmapped with reasons).
- Exposes `resonanceStrategyFor(concept_id)`: recommended hooks, base sequence,
  personalized delta slots, attention-design hypothesis.

Wire into `buildPrompt()` (concept orchestrator) as a fifth prompt block — beside
student context, pain points, and pedagogy patterns:

- Hook/intuition generation now receives the topic's `recommended_hooks` and the
  standing instruction: **emit a `simulation` interactive-spec with narration beats,
  including exactly one trap beat woven from the concept's top pain point** (the
  pain-point registry block is already in the prompt — the trap beat instruction
  makes the two blocks meet instead of coexisting).
- Retire "keep the body focused on a single learning beat" for hook/intuition in
  favour of "script the beats: motion + caption + emphasis + one trap, together" —
  with the cap clarified as **prose words excluding fenced blocks** (the existing
  `countProseWords` definition), so the spec JSON never eats the word budget.
- **Post-generation spec validation:** the orchestrator validates any emitted
  `interactive-spec` fence with the same parser the renderer uses (the
  `lint-interactive-specs` script already imports it). Invalid fence → one
  regeneration attempt → then strip the fence and keep the prose, logged. Today an
  invalid generated fence would silently render nothing (`InteractiveSidecar`
  swallows parse errors on the student surface) — this closes that hole at the
  source.
- Template YAMLs (`linear-algebra.yaml`, `calculus.yaml` first) gain the beat
  instructions under `hook:` — the same pattern the `gif-scene` instruction set.

Generation-side only; no change to what ships until an operator runs a generation
batch. The 505 hand-verified practice items and existing atoms are untouched.
**Known-unrun, stated honestly:** no provider key is set in this environment, so
live generation of a resonance atom cannot be exercised here — coverage is
unit-level (prompt assembly + fence validation with fixture outputs), and the first
live batch is the operator's smoke test, same as the v4.33.0 precedent.

### W4.5 — Measure it (the machinery exists; use it)

The repo built the experiments/lift apparatus precisely to answer "did a content
change help" — shipping a content change without wiring it in repeats the
anti-pattern that apparatus exists to end. So:

- `scripts/activate-resonance-experiment.ts` (idempotent, `--deactivate`,
  `--dry-run` — the `activate-personalised-selector` pattern) creates one
  `experiments` row `resonance_hooks_v1_gate_ma` with atom-target assignments for
  the resonance-carrying hook atoms.
- Honest expectation, stated up front: with today's traffic the row stays
  `inconclusive` (promotion needs n ≥ 30); the point is that the measurement
  exists from day one, so evidence accrues the moment real sessions do.
- No auto-promotion/demotion behavior change — the nightly ledger already handles
  experiments rows generically.

### W5 — Gates, tests, docs

- `lint-interactive-specs` already calls the renderer's own parser — new fields are
  covered once `parseInteractiveSpec` validates them; add fixture cases.
- Unit tests: beat selection with stances, stress substring rule, trap-beat hold,
  ghost rendering, seek-by-dot, reduced-motion static listing.
- `MarkdownAtomRenderer.regression.test.tsx` continues to mount every atom file —
  the 26×3 modified hook files ride the existing 880-base-atom pin (recount).
- `ci:variant-agreement`, `ci:interactive-specs`, `ci:content-integrity`,
  `ci:la-walkthrough` all run locally before push; no gate rules change, no
  baselines grow.
- Admin content-maturity report gains **resonance coverage figures** (which concepts
  carry beats / trap beats / per-stance beat text) — the `computeStanceFigures`
  pattern, measured through `loadConceptAtoms` + the real parser, never by filename.
- CHANGELOG + CLAUDE.md section; this doc gains an implementation record.

## 4. NOT in scope

- **TTS/audio sync** — narration here is visual text beats; syncing MP3 audio to the
  playhead is a later, separate mechanism (and TTS is provider-gated off anyway).
- **GIF pipeline changes** — `gif-generator.ts` scene types unchanged; GIFs remain
  the figure for `visual_analogy`. Resonance lives in the SVG simulation where
  interactivity is possible.
- **Non-LA authored scenes** — generation carries resonance to other topics via W4;
  hand-authoring 100 concepts of scenes is a follow-up batch, not this PR.
- **The three-way mistake-vocabulary unification** (`common_traps` prose ↔
  `ErrorTag` ↔ `misconception_id`) — the trap beat *cites* the authored trap; a full
  ontology join is separate scope.
- **Atom-model restructuring** — no new atom types, no changes to `AtomType`,
  selection tiers, or the carousel. Fusion happens inside atoms and their specs.
  The considered-and-rejected alternative: *merging* `hook` and `intuition` into
  one atom type. Rejected because it breaks the selection tiers
  (`TIER_ORDER` serves them at different mastery bands), the stance-variant file
  contract, and 100+ authored files, for a benefit the beat mechanism already
  delivers inside the existing types.
- **The legacy `components[]` path and `:::interactive{ref=}` directive form** —
  untouched.
- **Mock/quiz/practice surfaces** — lesson page only.

## 5. What already exists (reused, not rebuilt)

- `narration_steps` + `activeNarrationStep()` — the beat mechanism (extended, not
  replaced).
- `.vidhya-atom-stage` two-column figure/prose layout with sticky figure (W2 slots
  into it).
- `served_stance` threading + stance pinning + all-or-nothing swap (per-stance beat
  text keys off it; zero new personalization state).
- Pain-point registry prompt block + `StudentContext.recent_misconceptions` (the
  trap-beat generation source).
- `atomic-topic-spec.ts` loader + `atomic-concept-map.ts` crosswalk (W4 joins them;
  both tested).
- Safe formula evaluator (ghost paths reuse it; no eval).
- Motion tokens + `usePrefersReducedMotion` (W1 routes the presets through them).
- Wolfram MCP connector (beat/scene verification, the v4.39.0 discipline).

## 6. Dream-state delta

Today a student opens "eigenvalues" and reads a good sentence, then meets a looping
GIF, then a slider, then — five cards later — a list of four traps. After this plan,
the first thing they see *moves*: a vector sweeps the circle, the caption tells them
exactly what to watch as it happens, the one place everyone slips is drawn as a grey
ghost path at the moment it would fool them with the way out in one line, and a
shaken student and a confident student hear different sentences over the same true
geometry. The lesson stops being a stack of correct cards and starts being a
performance of the idea. And every future generated concept is born this way,
because the founder's per-topic attention hypotheses finally sit inside the prompt.

## 7. Risks

| Risk | Mitigation |
|---|---|
| 26 authored scenes with wrong math | Wolfram-verify every claim pre-commit; `ci:interactive-specs` parses all; honest pass-over for non-plottable concepts |
| Variant-agreement violations (byte-identical blocks) | One generated spec string written to all three files per concept; gate run locally |
| Trap beat reads as decoration / scare | Ink-and-grey treatment, one trap beat max, `avoid` line mandatory; shaken register never mentions the reader's feelings |
| Reduced-motion users lose the argument | Static beat listing carries text + stress + trap rows in full |
| Prompt changes degrade generation quality | W4 is generation-side only; judge gate (score ≥ 7) + CAS preflight unchanged; nothing ships without operator activation |
| Renderer regressions on 880 atoms | Full regression mount suite + frontend tests before push |
| **Opportunity cost** — this is the sixth pass deepening the best-served 26 concepts while real-usage evidence is absent | Two non-LA proof scenes test generalization; W4 carries the mechanism to all topics via generation rather than more hand-depth; the altitude question is surfaced to the operator at the review gate, not buried |
| Effort runs ahead of measurement — no way to know if resonance helped | W4.5 wires the `experiments` row from day one; stays honestly `inconclusive` until real volume arrives |

## 8. Key file map (from recon)

| Concern | File |
|---|---|
| Beat mechanism | `frontend/src/components/lesson/interactives/Simulation.tsx:34` (`activeNarrationStep`), `types.ts:62-92` (`SimulationSpec`) |
| Spec validation | `frontend/src/components/lesson/interactives/types.ts:183` (`parseInteractiveSpec`), `:247-264` (narration validation) |
| Stage layout | `frontend/src/components/lesson/AtomCardRenderer.tsx:868-906`, `frontend/src/styles/globals.css:348-381` |
| Presentation map + motion violation | `AtomCardRenderer.tsx:136-174` |
| Stance delivery | `src/content/stance-variants.ts:143-168`, `src/sessions/stance-pin.ts:87-106` |
| Prompt assembly | `src/content/concept-orchestrator/orchestrator.ts:414-444` (`buildPrompt`) |
| Per-topic spec | `src/content/atomic-topic-spec.ts:206`, `src/content/atomic-concept-map.ts` |
| Trap source | `modules/project-vidhya-content/concepts/*/atoms/common-traps.md`, `src/registry/pain-points` |
| Gates | `scripts/lint-interactive-specs.ts`, `scripts/check-variant-agreement.ts`, `src/content/variant-agreement.ts` |

## 9. Execution notes

Implementation runs on Sonnet/Haiku subagents per the user's instruction: W1/W2
(mechanism) on Sonnet; W3 scene authoring fanned out across parallel Sonnet agents
with Wolfram verification; W5 test-writing on Sonnet; simple propagation/file-sync
steps on Haiku. Each workstream lands as reviewed commits on this branch; one PR.

---

# APPENDIX A — /autoplan Phase 1: CEO review record (2026-08-30)

Mode: SELECTIVE EXPANSION (autoplan override). Codex unavailable in this container
(binary not found) — all dual voices ran `[subagent-only]`.

## Step 0A — Premise challenge

1. **"Fusion inside existing atoms is the right vehicle" — ACCEPTED.** The
   alternative (a new overture component / merged atom types) breaks `TIER_ORDER`
   selection, the stance-variant file contract, and 100+ authored files for a
   benefit the beat mechanism delivers in place (recorded in §4).
2. **"Motion creates resonance" — ACCEPTED WITH A GUARD.** The prior attention doc
   proved hierarchy, not motion, was the missing ingredient on this page; what
   earns motion here is that it carries information (temporal contiguity, d=1.22,
   9/9 experiments). The guard: one trap beat max, ≤8 beats, coherence principle —
   a hook stuffed with everything is a violation of the very evidence cited.
3. **"All in one instance" (the user's directive) — ACCEPTED.** Erroneous-example
   research supports meeting the mistake where it happens rather than five cards
   later; the design keeps `common_traps` as the deep treatment and the trap beat
   as its moment-of-need citation.
4. **"LA-first depth is the right allocation" — CHALLENGED by the CEO voice
   (single-voice) → queued for the Final Gate.** See Appendix A §Dual voices,
   finding 1. Amendments already applied: two non-LA proof scenes, experiments
   wiring, opportunity-cost risk rows. The user's stated direction stands unless
   changed at the gate.

## Step 0B — Existing code leverage

Covered in plan §5 ("What already exists") — every sub-problem maps to an existing
mechanism; the only new module is `resonance-strategy.ts` (a join of two existing
tested loaders).

## Step 0C — Dream state

```
CURRENT STATE                    THIS PLAN                       12-MONTH IDEAL
Stacked silo cards: prose,       Beat-fused hook scenes on       Every concept opens as a
GIF, widget, trap list, each     20+/26 LA + 2 non-LA concepts;  narrated scene; trap beats
alone. narration_steps on 4      trap ghost paths; per-stance    selected per student from
concepts. Founder's per-topic    beat text; per-topic strategy   their own error history;
strategy reaches nothing.        in every generation prompt;     lift ledger promotes winning
                                 measurement row live.           beat scripts automatically.
```

## Step 0C-bis — Implementation alternatives

```
APPROACH A: Extend narration beats (chosen)
  Summary: additive fields on the one existing text↔playhead mechanism; fused stage delivery.
  Effort: M (human ~2wk / CC ~half-day + authoring fan-out)   Risk: Low
  Pros: reuses stance/variant/gate machinery; zero migrations; additive schema
  Cons: bounded by what a 2D SVG sim can show; hook-only fusion this pass
  Reuses: narration_steps, vidhya-atom-stage, served_stance, pain-point prompt block
  Completeness: 9/10

APPROACH B: New ResonanceStage overture + resonance-spec block type
  Summary: a scripted full-screen opening sequence spanning hook+intuition+trap as one timeline.
  Effort: XL   Risk: High
  Pros: maximal cinematic fusion; single timeline across atom types
  Cons: 4th media-attachment channel; breaks variant-agreement rules; new gates; carousel bypass
  Completeness: 10/10 on vision, at 3-4x cost and real architectural debt

APPROACH C: Generation wiring + wider narration rollout only (no schema change)
  Summary: wire per-topic spec into prompts; roll existing narration_steps to more concepts.
  Effort: S   Risk: Low
  Pros: cheap; no renderer work
  Cons: no trap fusion, no stress, no per-stance beats — the directive's core unmet
  Completeness: 4/10

RECOMMENDATION: A — completeness at sane cost, explicit over clever, maximal reuse.
AUTO-DECIDED (P1 + P5). B's vision folds into A incrementally; C is A's subset.
```

## Step 0D — Selective-expansion analysis

Complexity check: ~9 code files + 2 templates + content files. Above the 8-file
smell threshold; accepted because the content files are data and the code files
split cleanly across five independent workstreams, each shippable alone.

Minimum set for the stated goal: W1+W2. W3 makes it real, W4 makes it compound,
W4.5 makes it measurable. Cherry-pick ceremony: 9 proposals, decisions recorded in
`~/.gstack/projects/project-vidhya/ceo-plans/2026-08-30-resonance-fused-atoms.md`
(accepted: trace-segment emphasis, admin resonance coverage; deferred: trap→practice
deep link [taste, at gate], intuition scenes for the 4 existing concepts; skipped:
sound/haptics, gated prose reveal, per-beat replay [dup of seek]).

## Step 0E — Temporal interrogation (decisions resolved NOW)

- HOUR 1: schema types locked (this doc §W1) — `emphasize` boolean instead of a
  `stress` substring field (no substring-vs-stance validation edge); beat cap 8;
  `text` required, `text_shaken`/`text_assured` optional with base fallback.
- HOUR 2-3: seek = set progress + reset rAF timestamp base; trap hold = a pure
  function of progress (holds ease into the trap's at_progress for ~--dur-slow,
  skipped under reduced motion); ghost sampled by the existing safe evaluator,
  try/caught to omission.
- HOUR 4-5: stage integration — simulation replaces MediaSidecar as the figure
  only when `kind === 'simulation'` parses; `manipulable`/`guided_walkthrough`
  keep current placement; entry preset suppressed only when a resonance sim renders.
- HOUR 6+: one generated spec string propagated to all three stance files by a
  small sync helper (DRY; `interactive-not-identical` never fires); regression
  mount recount; lint fixtures for every new validator rule.

## Step 0F — Mode

SELECTIVE EXPANSION (autoplan override), Approach A confirmed under it.

## Sections 1–11 (findings; every section evaluated)

**S1 Architecture.** New edges: Simulation reads `served_stance` (already on
`ContentAtom` — justified); `buildPrompt ← resonance-strategy ← {atomic-topic-spec,
atomic-concept-map}` (memoized, read-only). FINDING (fixed in plan): generated
invalid spec fences fail silently on the student surface → post-generation fence
validation added to W4. Rollback: pure additive, git revert, no migrations, no
flags. Scaling: client-side rendering of static content; no server-load change.

```
content .md ──▶ atom-loader ──▶ selectAtoms ──▶ stance/overrides/AB/media ──▶ rank
                                                    │
frontend: AtomCardRenderer ──▶ stage ──▶ [Simulation(beats,ghost,trap) | MediaSidecar]
                                   └──▶ prose (MarkdownAtomRenderer)
generation: buildPrompt ◀── resonance-strategy ◀── atomic-topic-spec + concept-map
                └──▶ LLM ──▶ judge gate ──▶ NEW fence validation ──▶ appendVersion
```

**S2 Error & rescue map.** See Appendix A registry below. One GAP found and closed
(silent invalid generated fence). No catch-all handlers introduced.

**S3 Security.** No new endpoints, no user input, no secrets. Beat markdown renders
through the same `allowDangerousHtml:false` pipeline as atom bodies (same trust
class, same content source — the atom body itself). Ghost exprs use the existing
no-eval evaluator. Prompt-injection surface unchanged (spec CSVs are repo content,
same class as template guidance). Examined; nothing further flagged.

**S4 Data flow & interaction edges.** Double-tap seek: idempotent. Navigate-away:
rAF cleanup asserted by test. Zero beats → legacy caption. >8 beats → refused by
validator. Sim+GIF both authored → precedence rule (sim wins). Reduced motion →
static storyboard with trap rows. Stale `served_stance` (pin expiry mid-lesson) →
base text fallback, register never mixes within one render.

**S5 Code quality.** DRY: one spec string synced across 3 files by helper; no new
components (extend Simulation); no new abstractions beyond `resonance-strategy.ts`.
Naming concrete (`trap`, `ghost`, `emphasize`). Cyclomatic: beat/hold logic split
into pure functions (`activeNarrationStep` precedent).

**S6 Test review.** New codepaths → tests: stance beat selection (unit), validator
rules incl. cap + trap shape + ghost exprs (unit + lint fixtures), trap hold
reduced-motion skip (unit on the pure function), seek-by-dot (RTL), ghost render
(RTL), sim>gif precedence (RTL), entry-preset suppression (RTL), strategy join incl.
unmapped→null (unit), prompt block presence (unit), post-gen fence validation with
bad fixture (unit), full-corpus regression mount (existing, recount), 26×3 variant
agreement (gate). Chaos/hostile: spec with at_progress 0.999999 duplicates, ghost
NaN samples, 8-beat wrap at 320px. Flakiness: no timers in unit tests — hold and
beat selection are pure functions of progress.

**S7 Performance.** Beat markdown memoized per text; scene sampling unchanged (80
points); no DB, no N+1, no new connections. Examined; nothing flagged.

**S8 Observability.** Generation logs fence-validation outcomes; admin maturity
report gains resonance coverage (the operator's dashboard); CI gates are the
runbook. Client stays telemetry-silent per surveillance invariants (engagement
events already capture atom dwell).

**S9 Deployment.** No migrations, no flags, single-image deploy (frontend+content
ship together — no version skew). Rollback = git revert. Post-deploy check: open
eigenvalues lesson, scene plays with beats. Behavior change on the 4 existing
sim concepts is intended and reviewed.

**S10 Trajectory.** Reversibility 4/5 (additive schema; content edits revertable).
Debt named: trap beats cite common-traps wording — future trap edits can drift
(noted in doc; the variant-agreement gate does not check this). Platform potential:
per-student beat selection (misconception-matched) is the natural Phase 2; the
schema leaves room (per-stance today, per-tag later). 1-year legibility: schema
documented in types.ts + this doc.

**S11 Design & UX.** IA: scene first, caption with it, prose after — matches the
attention doc's "figure leads". States: loading (sims render immediately; GIF
placeholder path untouched), empty (no beats → caption), error (prose-only), 
partial (ghost omitted). Emotional arc: look → follow → "careful, here" → the way
out → onward. No emoji, ink-and-grey trap treatment, 44px dots, aria per beat,
reduced-motion full text. AI-slop risk: the trap row must not become a generic
warning banner — it is a hairline-ruled text row, styled once in globals.css.
Phase 2 (design review) runs next per autoplan.

## Dual voices — CEO

CODEX SAYS: [codex-unavailable — binary not found in this container]

CLAUDE SUBAGENT (CEO — strategic independence): 7 findings. (1) CRITICAL altitude:
sixth initiative deepening the same 26 LA concepts; no real-usage evidence; urges
breadth or instrumentation first. (2) CRITICAL: no experiments/lift wiring →
**fixed: W4.5 added**. (3) HIGH: "cohort data" framing was fiction → **fixed:
restated as authorial judgment**. (4) MEDIUM: generation path unverified live →
**fixed: known-unrun stated + unit fixtures + fence validation**. (5) MEDIUM: no
human pedagogy review over fanned-out authoring → **fixed: consolidated pedagogy
pass named in W3**. (6) MEDIUM: risk table had no strategic rows → **fixed**.
(7) LOW/MED: no pass-over success bar → **fixed: ≥20/26**. Voice's factual slip
noted for the record: "other ~75 concepts still have no hooks" is wrong — all
concepts carry hook atoms (v4.39/#135); what they lack is scenes.

```
CEO DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                            Claude   Codex   Consensus
  ───────────────────────────────────  ───────  ──────  ─────────
  1. Premises valid?                   partial  N/A     FLAGGED → gate (altitude)
  2. Right problem to solve?           challenged N/A   FLAGGED → gate
  3. Scope calibration correct?        w/ amends N/A    AMENDED (non-LA proofs)
  4. Alternatives sufficiently explored? w/ amends N/A  AMENDED (merge-types recorded)
  5. Competitive/market risks covered? w/ amends N/A    AMENDED (opportunity cost)
  6. 6-month trajectory sound?         w/ amends N/A    AMENDED (W4.5 measurement)
═══════════════════════════════════════════════════════════════
[subagent-only] — missing voice = N/A (not CONFIRMED). Single-voice critical
findings acted on regardless, per the flagged-regardless rule.
```

## Error & Rescue Registry

```
METHOD/CODEPATH                  | WHAT CAN GO WRONG                  | CLASS/SHAPE          | RESCUED? | ACTION                                   | USER SEES
---------------------------------|------------------------------------|----------------------|----------|------------------------------------------|----------
parseInteractiveSpec (new rules) | bad beat shape / cap / trap / ghost| {ok:false, reason}   | Y        | sidecar renders nothing; CI blocks commit| prose-only atom
orchestrator fence validation    | LLM emits invalid spec JSON        | validation refusal   | Y (NEW)  | 1 regen, then strip fence + log          | prose hook (honest)
compile ghost exprs (runtime)    | NaN/throw on sample                | try/catch            | Y        | ghost omitted, base scene plays          | scene w/o ghost
activeNarrationStep (stance)     | missing text_shaken/text_assured   | fallback             | Y        | base text                                | steady register
resonanceStrategyFor             | unmapped concept_id                | null return          | Y        | prompt block omitted                     | n/a (operator)
seek during play                 | race w/ rAF                        | state reset          | Y        | playhead jumps cleanly                   | expected
rAF after unmount                | leak/setState-on-unmounted         | effect cleanup       | Y (test) | cancelAnimationFrame                     | nothing
Wolfram MCP down during authoring| unverifiable claim                 | policy               | Y        | do not commit unverified numerics        | n/a
```

## Failure Modes Registry

```
CODEPATH                  | FAILURE MODE                   | RESCUED? | TEST? | USER SEES?          | LOGGED?
--------------------------|--------------------------------|----------|-------|---------------------|--------
generated hook fence      | invalid JSON from LLM          | Y (new)  | Y     | prose-only hook     | Y
committed spec            | schema violation               | Y (CI)   | Y     | never ships         | CI
ghost expr                | runtime NaN                    | Y        | Y     | scene minus ghost   | console(dev)
stance beat text          | missing variant text           | Y        | Y     | base register       | n/a
beat dots                 | >8 beats                       | Y (refuse)| Y    | never ships         | CI
reduced motion            | motion user loses argument     | Y        | Y     | full storyboard text | n/a
```
No row is RESCUED=N — zero CRITICAL GAPS after the W4 amendment.

## NOT in scope / What already exists / Dream delta

Plan §4, §5, §6 (amended in place this phase).

## Decision Audit Trail — Phase 1

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | P0 | DX scope: no | Mechanical | P3 | No external developer surface; spec change is internal, covered by eng review | DX phase run |
| 2 | P0 | Skip /office-hours; plan doc authored directly from directive + recon | Mechanical | P6 | The directive is specific; the plan doc IS the structured statement | office-hours detour |
| 3 | P1 | cross_project_learnings=true | Mechanical | P6 | Skill default (recommended); container-local | project-scoped |
| 4 | P1 | Approach A (extend beats) | Mechanical | P1+P5 | 9/10 completeness at low risk, max reuse | B (overture, XL), C (subset) |
| 5 | P1 | Drop `stress` substring field → markdown bold + `emphasize` flag | Mechanical | P5 | Removes validation edge cases; per-stance emphasis free | dedicated stress field |
| 6 | P1 | Accept expansion: trace-segment emphasis | Mechanical | P2 | In W1 blast radius, <1d, signaling principle on the figure | skip |
| 7 | P1 | Accept expansion: admin resonance coverage | Mechanical | P2 | ≤3 files, observability-as-scope | skip |
| 8 | P1 | Defer: trap→practice deep link | TASTE → gate | P2 | Borderline radius (3-5 files), crosses out-of-scope surface | build now |
| 9 | P1 | Defer: intuition scenes for existing 4 concepts | Mechanical | P3 | Doubles W3; W4 covers intuition forward | build now |
| 10 | P1 | Skip: sound/haptics, gated prose, per-beat replay | Mechanical | P4/P5 | Design-system ban; hostile pattern; duplicate of seek | — |
| 11 | P1 | Add W4.5 experiments wiring | Mechanical | P1 | CEO-voice critical #2; infra exists; <1d | ship unmeasured |
| 12 | P1 | Restate trap sourcing as authorial judgment | Mechanical | P5 | CEO-voice high #3; the data claim was false | keep hedge |
| 13 | P1 | Add non-LA proof scenes (2) | Mechanical | P1 | Tests generalization cheaply | LA-only |
| 14 | P1 | Add fence validation post-generation | Mechanical | P1 | Closes silent-loss gap (S1 finding) | silent strip |
| 15 | P1 | Beat cap ≤8 | Mechanical | P5 | 320px dot row; coherence principle | unbounded |
| 16 | P1 | ≥20/26 success bar + consolidated pedagogy pass | Mechanical | P1 | CEO-voice #5/#7 | unbounded pass-over |
| 17 | P1 | Fold 0D-POST spec-review loop into the already-run adversarial CEO voice | Mechanical | P3 | The voice reviewed the full plan (superset of the CEO plan doc); a second subagent adds no coverage | separate reviewer |
| 18 | P1 | Altitude challenge (LA depth vs instrumentation/breadth) | PREMISE → gate | — | Single-voice challenge to user's stated direction; user decides at gate | auto-resolve |
