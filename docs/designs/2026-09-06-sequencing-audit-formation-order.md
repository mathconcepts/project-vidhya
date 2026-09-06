# Sequencing Audit: does reveal order match learning-formation order?

**Date:** 2026-09-06
**Trigger:** "scan through every possible content and wherever there is a
visual/intuition/graph, draw them in the order that student must learn to
understand... use `/ui-ux-pro-max` for a `/design-review` strategy to show
the sequence appropriately where they don't hinder the learning like a
distraction but convey the sequence in which the order was formed."

## Research grounding

`/ui-ux-pro-max`'s UX domain, searched before any audit work (not asserted
from memory):

- **Excessive Motion (severity High):** "Too many animations cause
  distraction and motion sickness... Animate 1-2 key elements per view
  maximum. Don't: animate everything that moves." Directly names the
  failure mode the trigger phrase calls "hinder the learning like a
  distraction" — this repo's own mechanisms (below) already hold to this
  by construction (one beat, one figure, one reveal at a time), which the
  audit had to confirm rather than assume.
- **Continuous Animation (severity Medium):** "Infinite animations are
  distracting... use for loading indicators only." Relevant to any scene
  that might loop without a stopping point — checked below.

## Method

"Every possible content" is 101 concepts × up to 12 atom types × 3 stance
variants — not something a single pass reads file-by-file. The tractable,
actually-exhaustive version of this audit is **by mechanism**: every
distinct rendering code path that can carry a visual/intuition/graph has
exactly one reveal-order behavior, shared by every piece of content that
uses it. Auditing the mechanism audits every concept that mechanism
reaches, at once — the same principle every code-level fix in this doc's
history has used (`focus_point`, the ghost labels) rather than a
per-concept editing pass.

Six mechanisms carry a visual/intuition/graph. Each was read against its
actual render/animation code, not assumed:

| Mechanism | Reveal order | Evidence |
|---|---|---|
| Resonance beats (`Simulation.tsx`, `linear_map`/plain-curve) | **Already sequenced.** One beat at a time, held until the student taps Continue (`shouldHoldAtBeatArrival`); `emphasize`/`focus_eigen`/`focus_point` only ever activate on the CURRENT beat; the trap is schema-locked to being the LAST beat a scene can reveal. | `MORPH_START_PROGRESS`/`MORPH_END_PROGRESS`'s own doc comment: "the morph holds still while beat 1 introduces the arrows... settles before the trap/payoff beats." |
| `gif-scene` `discrete-bars` | **Already sequenced.** Bars reveal left-to-right, matching authored order, via `barsShown = Math.round((n·(i+1))/totalFrames)` — frame *i* never shows a later bar before an earlier one. | `gif-generator.ts`'s `computeSceneLabels`. |
| `gif-scene` `parametric-curve`/`function-trace`/`level-set` | **Already sequenced.** The trace animates forward in `t`, which for every committed scene IS the order the curve is meant to be read in (a point moving forward in time/parameter, never backward). | Frame sampling walks `t_min → t_max` monotonically; no scene reverses this. |
| `gif-scene` `line-panels` | **Deliberately simultaneous, correctly so.** All N panels render in one frame by design — the pedagogical point (compare three outcomes side by side) requires simultaneity, not sequence. Sequencing this would be the wrong fix, not a missed one. | CLAUDE.md's own `line-panels` section: "the actual point... needs to be seen side by side, not read serially." |
| `guided_walkthrough` (steps + `branches`) | **Already sequenced.** One prompt → hint → answer at a time; branching trees reveal one question per screen, never the whole tree. | `GuidedWalkthrough.tsx`/`DecisionTreeWalkthrough.tsx`'s reveal-phase state machine. |
| `manipulable` (sliders + `outputs[]`) | **Structurally sequenced by authoring, not by code** — the renderer draws `outputs[]` in exactly the array order the atom author wrote (a plain `.map()`, `Manipulable.tsx:33`). Whether that ORDER matches how a student would actually compute the values (the "formation order" the trigger asks for) is an authoring-quality question, checked concept-by-concept below — this is the one mechanism where the audit had to look at content, not just code, because the code has no opinion on order at all. |

Two more surfaces were checked and correctly excluded:

- **`formal_definition`** — deliberately has ZERO staged reveal (Sweller's
  split-attention effect, documented 2026-08-31/09-02 in this doc's own
  history). A definition's job is to be instantly whole; pacing it in
  would be the exact mistake that holdout exists to avoid.
- **`ConceptMathViz.tsx`** (the separate, hardcoded legacy widget system)
  has no staging mechanism of any kind — already named as a real,
  deliberately-deferred gap in TODOS.md (`"ConceptMathViz.tsx has no
  highlight-while-discussed mechanism"`). This audit didn't reopen that
  entry with a new name; the absence of a sequencing mechanism is the same
  root gap as the absence of a highlighting mechanism — extending it is
  one decision, not two.

## The `manipulable` audit — every widget-bearing concept, checked

21 concepts carry at least one `manipulable` spec (`grep -rlE
'"kind"\s*:\s*"manipulable"'`). Their `outputs[]` arrays were extracted
and read against how a student actually derives each value:

**19 of 20 checked specs already order outputs correctly** — computed
prerequisites before what depends on them, verification checks last. A
representative sample: `lu-factorization` orders `u11 → u12 → l21 → u22`,
the EXACT Doolittle algorithm order (l21 needs u11 first; u22 needs l21
first); `gram-schmidt` orders `c → u2x → u2y → check`, computing the
projection coefficient before the vector it produces, verification last;
`cayley-hamilton` orders `trace → det → four inverse entries`, since the
inverse formula needs both scalars first.

**One real defect, found and fixed: `matrix-norms/atoms/mnemonic.md`.**
`outputs[]` read `sigma_max, sigma_min, kappa_2, "sigma_max * sigma_min
(should match |det(A)|)", "|det(A)| = |d1 * d2|"` — the verification row
referenced `|det(A)|` a full row BEFORE that value was ever shown on
screen. A student reading top to bottom hits "should match |det(A)|"
with no `|det(A)|` yet visible to check it against — the opposite of
"conveying the sequence in which the order was formed": the check is
supposed to be the LAST step, once both quantities it compares are
already in front of the student. Fixed by moving `|det(A)| = |d1 * d2|`
before the check row (one file, no stance variants to propagate — `ls`
confirms `mnemonic.md` is the only file in that atom slot). No formula,
number, or prose changed — pure reorder.

## Deliberately not attempted

A literal per-file reading of every `intuition`/`hook`/`visual_analogy`
atom's PROSE for "does the paragraph order match derivation order" — as
opposed to the CODE-rendered mechanisms audited above — is a genuinely
open-ended content-quality pass (closer in size to the `common_traps`
ELI5 sweep or the hook/intuition silo audits earlier in this doc's
history), not a bounded code-level check. If a future report names a
specific concept whose prose reads out of derivation order, that's the
right scope for a targeted fix — the same discipline every other
content-specific finding in this doc has followed.

## Verification

`ci:interactive-specs` (424 blocks, unchanged — no new fence, one
existing fence reordered) clean.
