# Reference Highlighting Framework

**Date:** 2026-09-06
**Trigger:** `/ui-ux-pro-max` — "coordinates numbers/references shall be
suitably highlighted or marked in addition to be just merely mentioned...
accumulate all such attention points and derive a robust framework for all
topics." Direct continuation of the same day's `focus_point` corpus-wide
extension (see CLAUDE.md's "`focus_point` extended corpus-wide" section) —
that pass closed the *coverage* gap (which concepts have a highlight
mechanism wired in); this pass closes the *mechanism* gap (which parts of
the rendering surface have no highlight mechanism at all, regardless of
concept) and writes down the accumulated design contract as one document
instead of leaving it scattered across a dozen code comments.

## Research grounding

Two `/ui-ux-pro-max` domain searches, not asserted from memory:

- **UX (Navigation → Active State, severity Medium):** "Current page/section
  should be visually indicated... Highlight active nav item with
  color/underline... Don't: No visual feedback on current location." The
  same principle applied to a plotted point instead of a nav item: whatever
  the narration is talking about right now needs a visible marker, not just
  prose that happens to be temporally adjacent to the right pixel.
- **Chart (Anomaly Detection):** "Normal: blue marker. Anomaly: red
  circle/square marker + alert... Add text alert annotation." The pattern
  this repo already uses (bigger radius + a text label) is the same
  marker-plus-annotation shape the chart domain recommends for "the one
  point that matters right now" — confirms the existing `focus_eigen`/
  `focus_point` visual language is the right one to extend, not replace.

## The accumulated inventory

Every place in the codebase today where authored text names a specific
number/coordinate that corresponds to something drawn, and whether that
drawn thing carries a matching visual marker for the period the text is
active:

| Mechanism | Where | Covers | Status before this pass |
|---|---|---|---|
| `focus_eigen` | `Simulation.tsx` / `linear_map` scenes | A beat naming a specific eigen-direction before the reveal | ✅ shipped 2026-09-04, extended to all 26 LA concepts |
| reveal (`emphasize` + green `×λ`) | `Simulation.tsx` / `linear_map` scenes | The payoff eigen-arrows once the reveal beat fires | ✅ shipped 2026-08-30 |
| `area_label` | `Simulation.tsx` / `linear_map` + `unit_square` | The determinant-as-area payoff | ✅ shipped, computed not authored |
| `focus_point` | `Simulation.tsx` / plain parametric-trace scenes | A beat naming the current traced coordinate before any reveal | ✅ shipped 2026-09-06, extended to 13 concepts same day |
| **ghost-value label** | `Simulation.tsx` / `trap` + `ghost` or `ghost_matrix` | The specific WRONG coordinate `trap.avoid` describes | ❌ gap — **closed in this pass** |
| bar/panel captions | `gif-generator.ts` / `discrete-bars`, `line-panels` | Every bar's value, every panel's label | ✅ already computed from scene data, can't drift (v4.36.0-era) |
| per-point callouts | `gif-generator.ts` / `parametric-curve`, `level-set`, `function-trace` | A specific point on a plotted curve | ❌ gap — **named, not closed** (see Scope below) |
| `why` framing | all three interactive kinds + `ConceptMathViz` | "why does this widget exist" | ✅ shipped, orthogonal to highlighting (it explains the widget, not a value) |
| `ConceptMathViz` highlight-while-discussed | `ConceptMathViz.tsx` (53-entry legacy widget system) | Nothing | ❌ gap — **named, not closed** (see Scope below) |
| `manipulable` slider outputs | `ManipulableSpec` | N/A by construction — the displayed value IS what the student is looking at; no separate narration text to fall out of sync with it | N/A |
| `guided_walkthrough` steps/branches | `GuidedWalkthroughSpec` | N/A — text-only, no persistent figure to mark | N/A |

## The unified design contract

Stated once here rather than re-derived per mechanism (each of the rows
above independently arrived at the same three rules — worth locking down
so a future addition doesn't have to reinvent them):

1. **Trigger.** Any authored text that states a literal number, coordinate,
   or named point corresponding to something drawn on screen must have that
   drawn element visually marked for exactly the period that text is the
   active one.
2. **Visual language.** A heavier stroke plus a halo-backed coordinate label
   (`stroke="var(--surface-fill)" strokeWidth={3} paintOrder="stroke"`, so
   the label reads over any background it lands on). Color carries meaning:
   - `var(--text-primary)` (ink) — "look here," nothing confirmed yet
     (`focus_eigen`, `focus_point`).
   - `var(--green)` — the confirmed payoff, once and only once revealed
     (the eigen reveal, `area_label`).
   - `var(--grey-6)` — the WRONG value (the new ghost labels) — matches the
     ghost path/arrows' own dashed grey stroke, so the label is visually
     tied to "this is the mistake," never mistakable for a real answer.
   Never green or indigo for a highlight that isn't a confirmed mastery
   payoff or an AI/tutor signal respectively — both are reserved per
   CLAUDE.md's two-accent law.
3. **Temporal rule.** The marker reverts the instant the text moves on to
   something else — permanent emphasis erases the very contrast the
   mechanism exists to create (Mayer's signaling principle, already cited
   for `emphasize`). The one deliberate exception is the reveal itself and
   the trap row once reached: both are "sticky" because they describe a
   standing fact ("these arrows never turn", "here's where marks are
   lost"), not a fleeting narration beat.

## What this pass closed

**The ghost/trap value label** (`Simulation.tsx`). The trap mechanism
always drew the WRONG path (`ghost`) or WRONG arrows (`ghost_matrix`) as a
dashed grey line once the trap beat fired — but `trap.avoid` names a
specific wrong number ("students read the diagonal as the eigenvalues",
"students read the 2 as scaling both axes") that the dashed line never
labeled. It was the one place in the file that drew a value while leaving
it merely implied rather than stated on the figure — exactly the gap the
trigger phrase named.

Fixed as two additions, both computed from data already present (no new
schema field, no content re-authoring — this reaches every existing and
future `trap`/`ghost` scene the instant it's authored, "for all topics" by
construction rather than by per-concept edit):

- **Plain-curve ghost:** its endpoint (the ghost path is a static full
  reveal from `t_min` to `t_max`, not progress-linked, so the endpoint is
  its one stable, well-defined point) gets the same halo-label treatment
  as the real trace's head, in grey.
- **`linear_map` ghost arrows:** each ghost tip gets a coordinate label,
  but ONLY when the scene declares real `eigen` directions — the 4-cardinal
  fallback used for a scene with no eigen at all (matrix-operations' AB-vs-
  BA class) has no specific coordinate its trap is about, so labeling all
  four would be noise with nothing in the narration to anchor it. The
  eigen-anchored case is exactly where a trap IS about a specific wrong
  coordinate (e.g. "the diagonal entries" as a wrong eigenvalue reading),
  so that's precisely where the label earns its place.

No new schema field, no validator change, no content edit — a pure
rendering addition over data every existing ghost/trap scene already
carries.

## Scope — named, not silently dropped

Two more rows in the inventory above are genuine gaps this pass did **not**
close, for reasons worth stating plainly rather than pretending the
"all topics" ask covers every rendering surface in the corpus:

- **`gif-generator.ts`'s parametric-curve/level-set/function-trace scene
  types carry no per-point callout at all**, unlike `discrete-bars`/
  `line-panels`' already-baked captions. Closing this properly needs a new
  authored field (something like a `callouts: [{t, label}]` array) plus
  re-rendering every existing committed GIF to pick it up — a bigger,
  riskier change than a pure rendering fix over existing data, and this
  environment has no live LLM provider key to drive a content-authoring
  pass regenerating them (the same "known-unrun" constraint CLAUDE.md notes
  elsewhere). Tracked in TODOS.md.
- **`ConceptMathViz.tsx`** (the separate, hardcoded 53-entry widget system
  bolted onto lesson pages, pre-dating and architecturally disconnected
  from the atom-authoring/`interactive-spec` pipeline this framework
  belongs to) has a `why` framing sentence but no highlight-while-discussed
  mechanism of any kind. Extending it would mean either duplicating the
  halo-label pattern into a second component family or migrating its
  content onto `Simulation.tsx` outright — a larger, separate decision.
  Tracked in TODOS.md.

## Verification

`Simulation.test.tsx` gained coverage asserting: the plain-curve ghost
endpoint label appears once `trapRevealed` and shows the correct
coordinate; the `linear_map` ghost tip labels appear for an eigen-anchored
scene and show the correct wrong-reading coordinates; the 4-cardinal
fallback scene (no declared `eigen`) renders its ghost arrows with **no**
coordinate labels, confirming the noise-avoidance rule above is real
behavior, not just a comment.
