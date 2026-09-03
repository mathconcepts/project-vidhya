# Why-first interactive framing (`/investigate` + `/autoplan`)

Live-QA report (4 screenshots, matrix-operations lesson, mobile) plus a
general directive: "eli5 way of handling and why at every point needs to be
done (maybe with an option in backend to remove)." Investigated per the
Iron Law — root cause before fix — then scoped into a reusable framework
plus a first pilot slice, matching this repo's established pilot-then-wave
discipline (see CLAUDE.md's v4.43.0/2026-09-02 sections for the precedent).

## The four reported issues, root-caused

1. **"The interactive — why it's used is not clear."** `InteractiveSidecar.tsx`
   dispatched straight to `Manipulable`/`Simulation`/`GuidedWalkthrough` with
   zero framing — no widget on the platform has ever told a student why it's
   there. Not a content gap on one concept; a structural gap in the renderer
   itself, present on all 380 authored interactive-spec blocks.

2. **"Why linear map is there? Even exploration must be ELI5."**
   `frontend/src/components/lesson/ConceptMathViz.tsx` — a *second*,
   completely separate widget system from the authored atom pipeline
   (hardcoded `CONCEPT_VIZ` map, 53 entries, bolted onto the end of every
   lesson page via `LessonPage.tsx:767,905`, unconditionally, regardless of
   what the student just read). Its `matrix-operations` entry showed "Linear
   map y = Ax (1D slice)" with the description "A 1×1 linear map multiplies
   inputs by a constant" — a scope mismatch (the lesson teaches 2×2
   multiplication; a 1×1 "matrix" is just a scalar) with zero explanation of
   why a simplification was even being shown, in dense unglossed register.
   This component was never touched by the ELI5/tone-directive pass or the
   prompt-registry work from earlier the same day (CLAUDE.md's "Wolfram
   prompt resource registry" section) — it's authored TypeScript, not a
   generated atom, so none of that work ever reached it.

3. **"Try it for 2×2 — very cramped, no student will attempt it."**
   `modules/project-vidhya-content/concepts/matrix-operations/atoms/
   intuition.md`'s `guided_walkthrough` spec wrote matrices as raw
   bracket-array notation — `A = [[1,2],[3,4]]` — with no `$...$` LaTeX
   delimiters. `GuidedWalkthrough.tsx` renders `prompt`/`hint`/`answer`
   through `MarkdownAtomRenderer`, which only typesets math inside `$...$`;
   un-delimited bracket arrays render as literal wrapping text in a
   `min-h-[80px]` box sized for short prose, not equations — exactly the
   cramped rendering in the screenshot. Audited the whole corpus for the
   same anti-pattern (`grep` for bracket arrays inside `prompt`/`hint`/
   `answer` string values, distinct from the JSON *data* fields like
   `linear_map.matrix` where a plain array is correct): **5 concepts, 15
   files** (matrix-operations, lu-factorization, eigenvalues,
   change-of-basis, numerical-linear-algebra × 3 stance variants each) — a
   real systemic bug, not a one-off.

4. **"Circle become a tilted ellipse — why and how? ELI5 needed."**
   `matrix-operations/atoms/hook.md`'s resonance-beat scene named WHAT
   happens (circle → ellipse) at every register but only explained WHY at
   `text_assured` (determinant-preserves-area). The `text`/`text_shaken`
   register — the one a struggling student actually reads — never said why
   uneven stretching bends a circle into an oval at all.

## The framework: `why` as a first-class, opt-out field

Rather than patch four one-off strings, the fix is structural so it reaches
every existing and future interactive without a fifth special case:

- **`why?: string`** added to all three `InteractiveSpec` kinds
  (`ManipulableSpec`/`SimulationSpec`/`GuidedWalkthroughSpec`,
  `frontend/src/components/lesson/interactives/types.ts`) and to
  `ConceptMathViz`'s `VizSpec`. Validated (non-empty, ≤`MAX_WHY_CHARS=220`
  — a framing sentence, not a second paragraph) alongside every other
  authored string in the schema. Optional, so all 362 not-yet-audited
  interactive-spec blocks and 52 not-yet-audited `ConceptMathViz` entries
  validate and render exactly as before — nothing silently changes under
  unaudited content.
- **`WhyThisHelps.tsx`** — one shared component, rendered once by
  `InteractiveSidecar` (above whichever widget it dispatches to) and once
  by `ConceptMathViz`. Renders nothing when `why` is absent. When present:
  a `--text-caption` (15px) line in `--text-secondary`, matching the
  existing `--hint-neutral` register (informative, not alarming — the
  orange/italic hint treatment is reserved for GuidedWalkthrough's actual
  reveal-a-hint step), plus an inline "Hide these tips" control.
- **`useEliFraming.ts`** — the "option in backend to remove" the user asked
  for, built as a client preference (mirrors `useCalmMode.ts`'s exact
  persistence pattern: localStorage + same-tab broadcast event) rather than
  a literal backend flag, because content here is static pre-authored
  markdown — there's no per-request LLM call to gate server-side, so a
  render-time client toggle is the honest mechanism. Defaults to **on**
  (unlike Calm Mode, which defaults off) — the framing helps by default;
  clicking "Hide these tips" once turns it off everywhere, persisted.
  A genuine server-side *default* (e.g. an admin toggling the platform-wide
  default rather than each student discovering the link) is a real
  follow-up, not built here — tracked in TODOS.md rather than silently
  assumed out of scope.

## What shipped in this pass (the pilot slice)

- The framework itself (schema + hook + component), wired into both
  `InteractiveSidecar` and `ConceptMathViz`.
- All 4 reported issues fixed at the source:
  - `matrix-operations/atoms/intuition.md` (+ 2 stance variants) —
    LaTeX-ified the guided walkthrough, added `why`.
  - The other 4 concepts sharing the same bracket-array bug — `lu-
    factorization`, `eigenvalues`, `change-of-basis`, `numerical-linear-
    algebra` (15 files total, `eigenvalues.shaken` edited on its own since
    its scaffolding genuinely diverges from base — see below) — same fix.
  - `matrix-operations/atoms/hook.md` (+ 2 stance variants) — the
    circle→ellipse beat's `text`/`text_shaken` now explain WHY (uneven
    stretching in different directions is what turns a circle into an
    ellipse), kept under the 280-char beat cap; `why` added at the top
    level.
  - `ConceptMathViz`'s `matrix-operations` entry — rescoped honestly (it's
    a 1-number simplification of a 2×2 idea, not a mismatched non
    sequitur) with a real `why` bridging it back to the animation above.
- 3 new/extended test files (`types.test.ts` +7, `InteractiveSidecar.test.tsx`
  +4, `ConceptMathViz.test.tsx` new, 5 tests) plus `useEliFraming.test.ts`
  (6 tests) — 101 total new/changed assertions across the framing work.

## Deliberately not done in this pass — named, not silently dropped

- **362 of 380 interactive-spec blocks have no `why` yet** (253
  `guided_walkthrough` + 100 `simulation` + 27 `manipulable`, minus the 18
  in the 6 files touched here). Every one of them still renders — the
  field is optional — just without the new framing line. TODOS.md tracks
  this as the next wave, same 5-6-files-per-batch pattern that worked for
  the common_traps ELI5 pass.
- **52 of 53 `ConceptMathViz` entries are unaudited** for the same
  scope-mismatch/jargon-density risk found in `matrix-operations`. Not
  assumed fine — flagged as a real coverage gap.
- **`matrix-inverse/atoms/hook.md`** carries the same "circle has become a
  tilted ellipse" resonance scene as `matrix-operations` (confirmed via
  grep) and was NOT touched — the live-QA report's screenshots were all
  from `matrix-operations`; extending the same ELI5 fix there is a natural
  next step, not assumed identical without checking its actual narration
  text first.
- **No server-side/admin-configurable default** for the ELI5-framing
  toggle — only the per-student client preference described above.

## Verification

`ci:katex-fences`, `ci:content-integrity`, `ci:interactive-specs`,
`ci:variant-agreement`, `ci:la-walkthrough` (26/26) all clean. Frontend:
94 files / 2567 tests (including the 1726-assertion full-corpus
`MarkdownAtomRenderer.regression.test.tsx`, confirming every atom in the
corpus — not just the ones touched — still renders). Backend unaffected
(362 files / 4672 tests, untouched by this pass). `tsc --noEmit` clean on
both.
