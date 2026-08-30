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
    "text": "The diagonal entries scale each axis — watch $x$ stretch by 3.",
    "text_shaken": "Watch the x-arrow: it was length 1, now it is length 3.",
    "text_assured": "Scaling is per-axis here — that is exactly what fails once off-diagonal terms appear.",
    "stress": "stretch by 3",            // substring emphasised in the rendered beat
    "trap": {                             // presence makes this a TRAP BEAT
      "text": "Students read the 2 as scaling *both* axes.",
      "avoid": "Match each diagonal entry to its own axis before writing anything."
    }
  }
],
"ghost": { "x_expr": "2*cos(t)", "y_expr": "2*sin(t)" }   // the mistaken path, drawn dashed grey
```

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
  `common-traps.md` (the highest-cost trap, by cohort data where it exists, by the
  author's judgment where it doesn't — same file, same wording lineage).
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
scene (the repo's own "never invent a misleading scene" rule).

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
  favour of "script the beats: motion + caption + stress + one trap, together".
- Template YAMLs (`linear-algebra.yaml`, `calculus.yaml` first) gain the beat
  instructions under `hook:` — the same pattern the `gif-scene` instruction set.

Generation-side only; no change to what ships until an operator runs a generation
batch. The 505 hand-verified practice items and existing atoms are untouched.

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
