# Graph-theory content: a `graph` figure mode for `simulation` scenes

`/plan-design-review` + `/autoplan`, 2026-09-08. Approved and shipped
same day. See CLAUDE.md's "Graph-theory content: a `graph` figure mode
for `simulation` scenes" section for the release writeup and TODOS.md's
"Graph-theory: a `graph` figure mode for `simulation` scenes — CLOSED"
entry for what's still open.

## Context

Every graph-theory content pass in this repo (CLAUDE.md's 2026-09-03
motion-coverage audit through the 2026-09-08 wave-2 pass) has hit the same
wall and named it as an open TODOS.md item: none of the 3 existing
`interactive-spec` kinds (`manipulable`, `simulation`, `guided_walkthrough`)
can honestly render a discrete node/edge structure. `simulation` only
traces a continuous `(x_expr,y_expr)` curve or a 2×2 linear-map transform;
`guided_walkthrough`'s `branches` extension is a **decision tree** (each
node reached via exactly one parent choice, cycles explicitly refused by
its own validator) — the wrong shape for a real graph, which has arbitrary
edges and, for algorithms like Kruskal's, edges that are *deliberately
rejected because they'd form a cycle*. Forcing any of the three existing
kinds onto a graph would either misrepresent the structure or fabricate
continuity that isn't there (the exact "fictional steps" failure mode this
repo's own research has flagged repeatedly).

Wave 2's graph-theory audit (2026-09-08, merged in PR #169) confirmed the
gap is real and total: all 7 graph-theory concepts (`graph-basics`,
`graph-connectivity`, `trees`, `euler-hamilton`, `graph-coloring`,
`planar-graphs`, `shortest-paths`) have zero visual coverage of any kind —
no `simulation`, no `gif-scene`. 6 of the 7 already have hand-written
step-by-step prose (a `guided_walkthrough` on `worked-example.md`), so the
content and the algorithm sequencing already exist — what's missing is a
way to *show* the graph while that sequence plays out.

## Design decision: extend `simulation`, don't add a 4th `InteractiveKind`

Research into `frontend/src/components/lesson/interactives/types.ts` found
`SimulationSpec` already treats its figure as one of several
mutually-exclusive modes — a plain parametric curve, or a `linear_map` 2×2
transform — sharing one set of beat/trap/why machinery. A discrete graph
state is architecturally the same shape: "the thing being drawn changes at
each beat," just discretely instead of continuously. Adding `graph` as a
third mode instead of inventing a whole new top-level kind means the new
code inherits, for free, with zero new implementation:

- The whole beat system: `narration_steps[]` with `text`/`text_shaken`/
  `text_assured`, `emphasize`, `trap` (schema-capped at one per scene), the
  ascending-`at_progress` CI gate, the 8-beat/280-char caps.
- `why` (the ELI5 framing line) and its `MAX_WHY_CHARS=220` cap, `WhyThisHelps`.
- The student-paced beat-holding model (`shouldHoldAtBeatArrival`, tap-to-
  continue, `useEngagementGate`), the sticky diagram+controls wrapper, the
  beat bar, the scrub slider, the reduced-motion storyboard fallback.
- Figure-slot promotion in `AtomCardRenderer.tsx` — already keyed on
  `spec.kind === 'simulation'`, so a graph-mode simulation is automatically
  eligible with zero code change there.
- The CI lint script's existing simulation-handling path (beat-order check,
  trap-count check, `why`-length check) in `scripts/lint-interactive-specs.ts`.

A discrete "current beat's highlight state" is exactly what `Simulation.tsx`
already computes every frame (`activeBeatIndex` — "last beat whose
`at_progress` ≤ progress") for the continuous-curve case; for graph mode
the same computation just selects which discrete node/edge highlight set
to draw instead of interpolating a point along a curve. No new playback
model, no new step-index field — beats already are the step sequence.

**Rejected alternative:** a new top-level `InteractiveKind: 'graph_walk'`.
Every prior TODOS.md entry assumed this was necessary. It isn't — it would
duplicate the entire beat/trap/why/promotion/CI machinery in a parallel
system for no benefit, the classic "second copy that drifts" bug class
this repo has hit before (v4.25.0's model-id drift). The
`simulation`-mode-extension design was only visible after reading how
`linear_map` is already wired as a sibling figure mode.

## Schema (`frontend/src/components/lesson/interactives/types.ts`)

```ts
interface GraphSceneSpec {
  nodes: Array<{ id: string; label: string; x: number; y: number }>;
  edges: Array<{ from: string; to: string; weight?: number }>;
  directed?: boolean; // default false — arrowheads via ArrowGlyph only when true
}
```

`SimulationSpec` gains `graph?: GraphSceneSpec`, mutually exclusive with
`linear_map` and the parametric fields — a 3-way switch extending the
mutual exclusivity `validateSimulation` already partially enforced for
`linear_map` vs. parametric.

`Beat` gains one new optional field, meaningful only when the top-level
spec has `graph`:

```ts
graph_highlight?: {
  nodes?: Array<{ id: string; role: 'current' | 'confirmed' | 'trap' }>;
  edges?: Array<{ from: string; to: string; role: 'current' | 'confirmed' | 'rejected' | 'trap' }>;
  labels?: Array<{ node_id: string; text: string }>; // evolving labels, e.g. Dijkstra's d[B]=3
}
```

Same one-annotation-field-per-figure-mode precedent `focus_point`
(plain-curve) and `focus_eigen` (linear_map) already established. No
separate top-level `ghost` field for graph mode: a `role: 'trap'`
edge/node on the trap beat already IS the wrong answer being shown
(Kruskal's rejected cycle-forming edge, a coloring conflict) — no
continuous alternate path to interpolate, just a discretely-wrong edge or
node to color grey + italic-label, same as every other ghost/trap value in
this app.

Each beat's `graph_highlight` is a full snapshot, not merged with prior
beats (`activeGraphHighlight` reads only the active beat's own field) — an
author who wants a node to stay visibly confirmed across later beats must
restate it. Deliberate: keeps the renderer a pure function of "what does
THIS beat want drawn," with no hidden accumulation state to reason about.

**Validation** (`validateSimulation`/`checkGraphScene`/`checkGraphHighlight`):
`graph` present ⇒ `linear_map` and every parametric field absent; `graph`
+ `ghost` refused (mutually exclusive, same reasoning as above);
`nodes[]` length in `[MIN_GRAPH_NODES=2, MAX_GRAPH_NODES=10]`, unique ids,
non-empty labels, numeric `x`/`y`; `edges[]` non-empty, each `from`/`to`
resolving to a declared node id (dangling reference refused by name,
matching `validateBranches`' "name the offending id" convention); every
beat's `graph_highlight` node/edge/label references resolve the same way.
No numeric self-consistency check is possible the way `checkLinearMap`'s
eigen-residual check works — node/edge structure is declared, not derived
math. The id-resolution checks are the full correctness surface; a real,
honest limit of this design, not silently glossed over.

## Renderer (`Simulation.tsx`)

3-way render-mode branch (`linear_map` / `graph` / parametric), sharing
the outer chrome unchanged. `GraphScene` (~150 lines) reuses every
existing primitive verbatim: `SVG_W`/`SVG_H`/`PADDING`, the halo-stroke
label technique, `ArrowGlyph` for directed edges, and a new `graphViewBox`
helper (same fit-to-author-coordinates technique as `linearMapViewBox`,
sourced from node positions instead of a matrix's unit-circle image).

Color/role mapping, audited against the locked "two accents, both
semantic" law — no deviation:
- default/`current`: `var(--ink)` — "look here, unconfirmed," same as
  `focus_point`/`focus_eigen`.
- `confirmed`: `var(--green)` — reused only for a settled/accepted/
  verified state, never "in progress."
- `rejected`/`trap`: `var(--grey-6)`, dashed, **italic** label — the exact
  ghost/trap convention's color-independent differentiator.

Teal/purple/mint/brown (the atom-card eyebrow-label exception) and indigo
(AI/tutor only) are not used anywhere in the diagram.

**Accessibility, new for this mode:** a screen-reader user gets nothing
from an SVG node/edge diagram the way a sighted student gets a shape. Each
beat's own `text` is already announced via the existing `aria-live="polite"`
region — this closes what would otherwise be a silent gap specific to
graph mode.

## CI (`scripts/lint-interactive-specs.ts`)

No new "exercise" pass — graph mode has no formulas to sample, so the
shared parse-time validator is the full check. The census gains a
`simulation (graph)` bucket, split from `simulation (linear_map)`/
`simulation (parametric)`. The existing beat-order and one-trap-max checks
already run generically across every `simulation` spec.

## Content pilot: 2 concepts, not all 7

Per this repo's established discipline (ship the mechanism, pilot on the
clearest fit, name the rest as a scoped follow-up), this plan pilots on:

1. **`shortest-paths`** (Dijkstra's trace) — the single best-fit example.
   Its already-published graph (directed, weighted, A-E, source A) and
   already-verified settle/relax sequence map almost 1:1 onto
   `current`/`confirmed`/`labels` roles. The trap beat reuses the
   concept's own published "GATE Trap" verbatim (the direct A→B edge looks
   obvious but never belongs to the shortest path).
2. **`graph-coloring`** (greedy coloring on $C_5$) — exercises `trap`/
   `rejected` distinctly: color 1→R, 2→B, 3→R, 4→B, then 5 forced to
   conflict with 1 (both Red — the trap beat), recolor 5→Green.

Both land on `hook.md` (+ `-shaken`/`-assured`), matching the placement
convention every other resonance-beat scene uses, additive to each
concept's existing `worked-example.md` guided_walkthrough. Every number/
edge/label is copied verbatim from the concept's own already-committed
graph — no new graph invented.

The other 5 concepts (`graph-basics`, `graph-connectivity`, `trees`,
`euler-hamilton`, `planar-graphs`) are named, not silently dropped — see
TODOS.md's closed-entry writeup for the per-concept scoping (which fit
well, which needs an editorial call first, which only half-fits).

## Design review (self-critique)

No gstack-designer mockup pipeline — this is a rendering-primitive plan,
not a page design; the review below audits the diagram's own visual
language instead.

- **Consistency: 9/10.** Every color, motion token, label technique, and
  control is reused verbatim. The 1-point gap: node/edge diagrams are
  denser than a single curve, and label-overlap at the 5-6-node graphs the
  pilot concepts use wasn't verified until the live-browser check (below).
- **Accessibility: 7/10.** Color-independent signaling (italic) and
  `aria-live` beat announcements are planned in from the start. Not
  addressed: keyboard-only navigation of individual nodes/edges — a real
  gap, inherited (every existing `simulation` scene has the same
  limitation for its own curve/arrows), not introduced.
- **Responsive/mobile: 6/10 at plan time, closed by verification below.**
  The 320×200 viewBox scales down cleanly, but a 5-6-node graph with edge-
  weight labels packed into that space has real label-collision risk on a
  375px phone a single traced curve never faced. Not solved in general
  (force-directed-layout-class problem, explicitly out of scope) — relies
  on the pilot's small, sparse graphs avoiding collision by hand-picked
  coordinates, verified live rather than assumed.
- **Information hierarchy: 8/10.** SVG → controls → caption → trap row →
  Continue button ordering is unchanged from the 2026-09-02 sequence. The
  step counter and beat-highlight-kind chip apply to graph mode for free.

**Explicitly out of scope:** automatic/force-directed graph layout
(authors hand-place `x`/`y`, reasonable at ≤10 nodes); the
`graph-connectivity` content decision (which concrete graph to author);
`planar-graphs`' $K_5$ non-planarity half; a DFS/BFS traversal use case
(would reuse the same shape, no schema change anticipated).

## Verification

1. `npx vitest run` (frontend, targeted + full suite) — all green.
2. `npm run ci` (18 gates) clean; `simulation (graph)` census bucket shows
   3 blocks per pilot concept (6 total).
3. **Live-browser check** — booted the local demo stack (backend +
   frontend, DB-less), logged in via `/demo-login`, walked both pilot
   concepts' hook scenes beat-by-beat at a 375px viewport via this
   sandbox's pre-installed Chromium (Playwright). No label overlap at any
   beat on either concept; role colors (ink/green/grey-dashed-italic) all
   rendered as designed; the trap beat's dashed grey edge + italic label
   read clearly on both. Closes the "Responsive: 6/10" risk with a real
   check, not an assumption.
4. `tsc --noEmit` clean both sides.
