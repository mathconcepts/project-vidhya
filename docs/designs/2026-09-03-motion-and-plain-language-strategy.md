# Motion coverage + plain-language strategy

Follow-up to `2026-09-03-why-first-interactive-framing.md`. Three asks:
(1) research-backed, topic-wise recommendations on where more motion helps,
(2) exploration-widget language simplified as far as it honestly can be,
(3) a rule for what to do when text runs long — chunk it, or animate it.

## 1. Research grounding (external)

Four sources, searched fresh rather than recalled from training, because
this decision spends real authoring effort and deserves a checked basis:

- **Segmenting principle** (Mayer, Dow & Mayer 2003): learners do better
  from a multimedia lesson delivered in **learner-paced segments** than as
  one continuous unit — directly answers ask #3. [Segmenting Principle — Multimedia Learning](https://www.cambridge.org/core/books/abs/multimedia-learning/segmenting-principle/37240877DDA0362355ADB39936027982)
- **Signaling principle** (same body of work): cues that highlight
  structure and key information direct attention and improve learning —
  this repo's `emphasize`/`trap` fields on a resonance beat already ARE
  signaling; the gap is that most topics have no beats to signal on. [Mayer's Principles of Multimedia Learning](https://educationaltechnology.net/mayers-principles-of-multimedia-learning/)
- **Betrancourt & Bétrancourt/Tversky reviews** (2000–2016 meta-analyses):
  animation is **not inherently superior** to static graphics — the
  literature is "not encouraging" in aggregate. Where it DID help,
  effect sizes were substantial specifically when the animation was
  **system- or learner-paced**, coupled with **narration** (not
  accompanying on-screen text duplicating it — the redundancy principle),
  and when the visual is **interactive** (a viewer dragging/controlling it)
  rather than passively watched. A real caution: animation can add
  "fictional steps" that mislead if the motion implies a process the math
  doesn't actually have. [When and why does animation enhance learning? A review](http://tecfaetu.unige.ch/etu-maltt/oda/berneysa/Berney_Betrancourt_09.pdf), [Does animation enhance learning? A meta-analysis](https://tecfa.unige.ch/perso/sandra/pdf/Earli2016_berney_betrancourt_FINAL.pdf)
- **Linear algebra specifically**: dynamic visualization is called out as
  *particularly* effective here — "the immediate visual feedback of where
  output eigenvectors move… is much more effective than simple animations
  or static pictures," and **kinesthetic control** (dragging an input
  vector) matters more than passive animation. This matches why this repo
  already concentrated its richest motion in linear-algebra. [Understanding and Visualizing Linear Transformations](https://www.researchgate.net/publication/322935283_Understanding_and_Visualizing_Linear_Transformations)
- **Readability for math specifically**: math text carries **more concepts
  per sentence than any other text type**; plain-language guidance is
  short sentences, common words, active voice, present tense — directly
  answers ask #2. [Improving Readability In Math Without Compromising Rigor](https://greatminds.org/math/blog/eureka/improving-readability-in-math-without-compromising-rigor)

**Net read for this repo:** the resonance-beat mechanism (`narration_steps`
+ `emphasize` + `trap` + the new `why` line) already encodes segmenting +
signaling correctly — the deficit is coverage, not design. Extending
existing beats is higher-value than any new mechanism.

## 2. Internal audit — corrects an assumption before it shipped

The obvious first move was "grep for `simulation`-kind blocks per topic and
call the zero-count topics the gap." That undercounted badly — it ignored
`gif-scene` (the older §4.15 pre-rendered-GIF system, still live on nearly
every concept). Re-running the audit against BOTH systems changed the
finding from "6 topics have zero motion" (wrong) to something more useful:

| Topic | Concepts | Rich (`simulation`) | Passive-only (`gif-scene`) | Genuinely nothing |
|---|--:|--:|--:|--:|
| linear-algebra | 26 | 21 | 3 | 2 |
| calculus | 19 | 7 | 11 | 1 |
| complex-variables | 6 | 2 | 4 | 0 |
| differential-equations | 8 | 4 | 3 | 1 |
| **vector-calculus** | 8 | **0** | 8 | 0 |
| **probability-statistics** | 9 | **0** | 9 | 0 |
| **transform-theory** | 6 | **0** | 6 | 0 |
| **numerical-methods** | 6 | **0** | 5 | 1 |
| discrete-mathematics | 6 | 0 | 5 | 1 |
| graph-theory | 7 | 0 | 4 | 3 |

**The real finding:** almost every concept already has SOME motion — a
looping, pre-rendered GIF with a static caption. What five topics
(vector-calculus, probability-statistics, transform-theory,
numerical-methods, and effectively discrete-mathematics/graph-theory) are
missing is the pedagogically active layer: learner-paced scrubbing,
narration synced to the motion, and signaling (`emphasize`/`trap`) — the
exact three things the research above says actually drive the benefit. A
passive GIF loop is closer to the "not encouraging" end of the literature;
the `simulation` kind is built to sit at the "substantial effect size" end.

**Genuinely zero-visual concepts (10 total)**, for completeness: Partial
Fractions, Order/Degree/Linearity of an ODE, Group Theory Basics, Eulerian
& Hamiltonian, Connectivity, Trees, Change of Basis, LU Factorization,
Numerical Linear Algebra. Two of these (Change of Basis, LU Factorization)
are **documented, deliberate exclusions** from the earlier resonance-beats
pass (CLAUDE.md, v4.44.0: "no honest geometry to animate" for a procedural
algorithm) — not oversights, and this doc doesn't relitigate them.

## 3. Topic-wise priority, and why some topics rank lower on purpose

Ranked by (a) how well the subject's own structure matches a continuous,
honest animation per the Apprehension/Congruence design principles
(Tversky & Morrison) and (b) current coverage gap:

1. **vector-calculus** — flux, divergence, curl, flow along a path are
   *literally* motion through space. Best subject-motion match in the
   whole curriculum, and currently 0/8 `simulation`. Pilot below.
2. **numerical-methods** — root-finding, integration, ODE solving are
   iterative convergence processes; exactly the "system-paced" case with
   documented substantial effect sizes. 0/6.
3. **probability-statistics** — distribution shape changing with a
   parameter (mean/variance) is a textbook `manipulable`-slider case, and
   sampling-distributions (CLT: "watch the histogram approach a bell curve
   as n grows") is a well-known animated demonstration in its own right.
   Currently 0/9 on BOTH `simulation` and `manipulable`.
4. **complex-variables** — geometric by nature (conformal maps, contour
   integrals), and the worst-covered by depth: 4 of its 6 concepts have
   neither a `simulation` scene NOR a `guided_walkthrough` — the one topic
   failing asks #1 and #3 simultaneously.
5. **calculus** — already at 7/19 `simulation`; extending it (limits as a
   secant line collapsing to a tangent, Riemann sums refining into an
   exact area) is real value but lower urgency than the zero-coverage
   topics above.
6. **discrete-mathematics** — LOWER priority for continuous motion on
   purpose. Boolean algebra, propositional logic, combinatorics are
   discrete/symbolic; forcing a continuous animation onto them risks
   exactly the "fictional steps" failure mode the research warns about.
   Segmented, step-revealed `guided_walkthrough` content (which most of
   these still lack too) is the better-matched fix here.
7. **graph-theory** — its 3 fully-uncovered concepts (Eulerian &
   Hamiltonian, Connectivity, Trees) want a DIFFERENT motion primitive: a
   node-by-node highlight sequence (walk an Euler circuit, grow a spanning
   tree edge by edge), not a continuous `x(t),y(t)` trace. **The current
   schema has no such kind** — `manipulable`/`simulation`/
   `guided_walkthrough` don't fit a discrete graph traversal honestly.
   Flagged as a real schema gap, not attempted here (see §5).

## 4. Language simplification rule for exploration content

`ConceptMathViz`'s 53 descriptions average 14 words — mostly not
*word*-dense, but **symbol**-dense (e.g. "det(A − λI) = 0 gives
eigenvalues… λ²-trace·λ+det=0" assumes fluent notation-reading with zero
gloss, which is its own readability failure per §1's "more concepts per
sentence" finding). Own mistake caught in the same pass: the
`matrix-operations` description written in the prior PR was **59 words in
one block** — word-dense AND redundant with its own `why` line. Fixed here
(`ConceptMathViz.tsx`): description now "Drag a to make the line steeper or
flatter — that is what multiplying by a single number does." (19 words,
active voice, tells you what to do). `why` trimmed to remove the repeated
"this is a simplification" framing that had leaked into both fields.

**Rule going forward, for any new `description`/`why` pair:**
- `description` says what to DO and what you'll SEE. Active voice, present
  tense, no more than ~20 words.
- `why` says why the widget is worth touching at all — the ONLY place
  "simplification"/"honest bridge back to the real concept" framing
  belongs. Don't restate the same point in both fields.
- A bare symbol chain (`λ²-trace·λ+det=0`) is not simplified just because
  it's short — gloss the notation in words the first time it appears, same
  discipline already applied to atom prose via the tone-register modifier.

## 5. Segment-or-motion rule for long text

When authored text (a description, a why line, an intuition paragraph)
would exceed a natural single-breath sentence or two:

- **If the content describes a process, transformation, or sequence over
  time** → prefer motion: a `simulation` scene's `narration_steps` IS the
  segmenting mechanism (learner-paced via `emphasize`, dismissible-but-
  present via the scrub slider) — don't also try to cram the same content
  into a wall of static prose beside it.
- **If the content is a set of discrete facts, conditions, or a decision**
  (not a process) → segment via existing widgets: `guided_walkthrough`'s
  paced step reveal, or ordinary short paragraphs (the
  `.vidhya-atom-body--progressive` stagger already breaks these into
  separately-animated paragraphs).
- **Never both crammed AND undivided** — a single dense paragraph
  standing next to an unrelated animation duplicates effort without
  applying either principle. `ConceptMathViz`'s old 59-word block was
  exactly this failure mode, sitting right below a real animation it
  should have deferred to.

## What shipped in this pass

- This doc (research + audit + prioritization — the deliverable for ask #1
  as stated; a ranked list, not a full build-out).
- `ConceptMathViz`'s `matrix-operations` entry rewritten per §4's rule
  (self-correction of the previous pass's own miss).
- One new `simulation` scene, `line-integrals/atoms/hook.md` (+ shaken/
  assured, byte-identical per `ci:variant-agreement`'s rule) — the #1
  priority topic (vector-calculus), using the field $\mathbf F(x,y)=(-y,x)$
  and the unit-circle path already verified in `hook-shaken.md`'s existing
  prose (no new numbers invented). Demonstrates the "closed loop, still
  nonzero work" paradox — a genuine process, honestly animatable with the
  existing `parametric` scene mode, with a `why` line and a `trap` beat.

## Deliberately not done here — named, not silently dropped

- The other 7 vector-calculus concepts, all of probability-statistics,
  transform-theory, numerical-methods, complex-variables' 4 undercovered
  concepts — real work, scoped in TODOS.md as waves by topic, same
  5-6-concept-per-batch pattern used throughout this repo's history.
- A new interactive-spec kind for graph-theory's discrete-traversal case
  (§3, priority 7) — a real schema decision (new `InteractiveKind`,
  renderer component, validator), bigger than a content pass; named as
  its own follow-up rather than forced into the wrong widget.
- A full simplification pass over the other 52 `ConceptMathViz`
  descriptions — most are short but several are symbol-dense per §4;
  tracked as its own wave.
- `probability-statistics`'s `manipulable`-slider opportunity (distribution
  shape vs. parameter) — a real, cheap win per the research, not built
  here since it's genuinely new content, not a language/motion fix to
  something existing.

## Verification

`ci:interactive-specs` (383 blocks, +3), `ci:katex-fences`,
`ci:content-integrity`, `ci:variant-agreement` (610 pairs) all clean.
