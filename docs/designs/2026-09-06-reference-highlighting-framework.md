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

## Follow-up: where the new labels themselves could hinder learning (`/autoplan`, same day)

Ask: audit every place the freshly-added ghost labels could go wrong and
actively work against a student, not just confirm they render.

**Real, confirmed bug — the SVG viewBox never accounted for the ghost's
extent.** `linearMapViewBox(matrix)` sized the box from the real matrix's
image of the unit circle alone; `autoViewBox(points)` sized it from the
real trace's sampled points alone. Neither ever looked at `ghost_matrix`
or the sampled `ghost` path. A trap whose wrong reading scales the answer
UP (the common, pedagogically useful shape — "the mistake makes it look
bigger/smaller than it really is") draws its ghost arrow, path, and now
its coordinate label partly or entirely **outside the visible viewBox**.
SVG clips content outside its own viewBox by default, so in a real
browser the correction is invisible — worse than no correction at all,
since the trap row still says "look at the figure" and there is nothing
usable to look at.

Confirmed reachable, not theoretical: this repo's own `BEAT_SPEC` test
fixture (real trace bounded to `[0,1]×[0,1]`, `ghost: {x_expr: '2*cos(t)',
y_expr: '2*sin(t)'}`) hits this exactly — the ghost's endpoint at
`(1.081, 1.683)` falls outside the `~[-0.1, 1.1]` box `autoViewBox` would
compute from the real trace alone. The earlier pass's own test for this
label (`toContain('(1.081, 1.683)')`) passed anyway, because it only
checks the DOM text node exists — jsdom never rasterizes or clips
anything, so a test written against DOM presence alone cannot catch a
purely-visual clipping bug. Fixed by folding the ghost's own extent into
both view-box computations (`linearMapViewBox`'s new optional
`ghostMatrix` param, `autoViewBox`'s new optional `ghostPoints` param) —
additive, backward-compatible signatures; a scene with no ghost computes
exactly as before. The new regression test checks the actual projected
pixel position of the label, not just its presence, specifically so this
class of bug can't recur silently again.

**Real, addressed accessibility gap — color was the only differentiator
between "look here" and "this is wrong."** `focus_eigen`/`focus_point`
render in ink, the reveal in green, the new ghost labels in grey — but
nothing OTHER than hue tells a viewer with reduced color perception which
is which, and grey-vs-ink-vs-green can compress toward each other under
some forms of color-vision deficiency (WCAG 1.4.1, use of color, is
exactly this failure mode). The ghost ARROWS already had a second,
color-independent channel (dashed vs. solid stroke) — the new LABEL TEXT
did not. Fixed cheaply: every ghost coordinate label now renders in
italic. No geometry, no new dependency, and it reads as "hypothetical /
not the real answer" independent of whether grey is perceptible as
distinct from ink.

**Real edge case, named rather than fixed — label collision when a trap
is authored to be subtle.** The ghost label's screen position is offset
from the origin along the SAME radial direction the real reveal's `×λ`
label uses (a fixed 16-18px push outward from whichever tip it belongs
to). When a trap's `ghost_matrix` is intentionally close to the real
matrix (a believable near-miss, which is often the MORE pedagogically
useful trap to author — "just a little wrong" teaches more than "wildly
wrong"), the real and ghost labels can end up close enough to visually
overlap. No currently-committed scene was found to trigger this (the one
committed eigen-anchored ghost, `[[2,0],[0,2]]` against real eigenvalues
3 and 1, is colinear per-direction but far enough apart in radius), but
nothing in the code prevents a future one from doing so. A full label-
collision-avoidance pass (detect overlap, nudge one label perpendicular
to its radial offset) is real, scoped, future work — not attempted here,
since it is meaningfully larger than the two fixes above and no live
instance justifies it yet. Named in TODOS.md.

**Considered and correctly NOT changed:** long-number edge-clipping at
the SVG's outer edge (a label for a coordinate near `MAX_LINEAR_MAP_ENTRY`
could still theoretically clip against the padding margin even inside a
correctly-sized viewBox) — this risk is shared identically by the
pre-existing real reveal's `×λ`/coordinate labels, not unique to the new
ghost labels, so fixing it here would be scope creep onto a pre-existing,
unrelated risk rather than the ghost-label audit this pass was asked to
do. Mobile font-legibility at 12px is the same story — systemic, already
shared by every label in this file, not a new regression introduced by
the ghost labels. Both named, neither fixed, in TODOS.md.

**Tests:** `Simulation.test.tsx` gained 4 new cases — the pixel-position
regression (ghost endpoint label projects inside the SVG canvas, not
clipped off it), the italic-style check on that same label, and two pure
`linearMapViewBox` tests (widens when `ghost_matrix` scales further than
the real matrix; stays unchanged when it scales less) — plus 2 assertions
appended to the existing eigen-reveal test confirming both eigen-anchored
ghost labels render `font-style: italic`. Frontend suite 2767 → 2771.
Backend untouched. `tsc --noEmit` clean.
