# Content Pipeline CAS-First Strategy (2026-08-06)

## Current state

The concept orchestrator (`src/content/concept-orchestrator/orchestrator.ts`) generates
atoms via LLM and passes them through an LLM-judge quality gate (score ≥ 7). No
symbolic math verification runs before atoms are written to `atom_versions`.

CAS verification exists only on the **student answer path** — `TieredCASChecker` in
`src/scoring/adapters/cas-checker.ts` fires when a student submits, not when content
is authored. This means a `worked_example` atom with a wrong answer reaches production
and is served to students until one of them triggers the verification cascade.

The `wolfram_grounded` flag in `GenerationMeta` is set to `pyqGrounding.length > 0`
(PYQ text was found), not to "Wolfram verified the stated answer." The docblock in
`orchestrator.ts` says "Wolfram-ground when math is involved" but that step is absent
from the implementation.

## Strategy: CAS gate before persist

Wire Wolfram verification **after the LLM-judge gate, before `appendVersion()`** for
math-bearing atom types. If Wolfram produces an answer that disagrees with the stated
answer, reject the atom before it enters the version store.

Gate behavior controlled by `VIDHYA_CAS_PREFLIGHT`:
- `off` (default): no-op — backwards-compatible, zero added latency
- `shadow`: verify and log, never reject (observe at zero risk)
- `on`: verify and reject disagreeing atoms

## Findings

### F1 — Math atoms reach `atom_versions` with unverified stated answers [HIGH]

`worked_example` and `interleaved_drill` atoms include an explicit `Answer: <value>`
per the orchestrator prompt. These are the stated answers that students see. They have
passed only an LLM-quality judge, not a symbolic check. Wrong answers persist until
a student triggers the runtime cascade.

**Fix:** `src/content/concept-orchestrator/cas-pre-verifier.ts` (new):
- `extractAtomAnswer(content, atomType)` — extract `Answer: <value>` or `\boxed{…}`
- `casPreVerify(atom)` — call `wolframSolve()` on the problem prefix, then
  `answersAgree()` to compare. Return `{skipped, verified, reason}`.

### F2 — `wolfram_grounded: true` is misleading [MEDIUM]

`wolfram_grounded` is set when PYQ grounding text was found, not when Wolfram ran.
This mislabels atoms in the admin review queue.

**Fix:** After `casPreVerify()` runs:
- `meta.wolfram_grounded = true` only when Wolfram actually ran and agreed
- Add `meta.cas_pre_verified?: boolean | null` — the new precise field
  (`null` = not applicable/skipped, `true` = Wolfram confirmed, `false` = Wolfram disagreed)

### F3 — No test coverage for answer extraction or CAS gate [MEDIUM]

No tests exist for extracting atom answers or verifying the CAS gate path.

**Fix:** `src/content/concept-orchestrator/__tests__/cas-pre-verifier.test.ts` (new) —
12 tests across extraction, skip logic, gate modes.

## Implementation order

1. `src/content/concept-orchestrator/types.ts` — add `cas_pre_verified` field
2. `src/content/concept-orchestrator/cas-pre-verifier.ts` — new module
3. `src/content/concept-orchestrator/orchestrator.ts` — wire after LLM judge gate
4. `src/content/concept-orchestrator/__tests__/cas-pre-verifier.test.ts` — tests
5. Gates: `npx tsc --noEmit` + `npm test` clean

## Required gates

| Gate | Command | Must be |
|---|---|---|
| G1 — TypeScript | `npx tsc --noEmit` | zero errors |
| G2 — Backend tests | `npm test` | all passing |

## What is deferred

- **RAG cache writeback for pre-verified atoms** — when CAS confirms a generated
  answer, that `(problem, answer)` pair could seed the RAG cache for faster future
  lookups. Deferred: requires embedding generation and a `rag_cache` writeback, which
  adds latency and cost that aren't justified until shadow-mode data shows how often
  CAS actually fires successfully.
- **Full TieredVerificationOrchestrator integration** — the pre-verifier uses
  `wolframSolve()` directly (Wolfram only) because Tier 1 RAG has no pre-seeded
  entries for generated content, and Tier 2 LLM dual-solve would be the same models
  that just generated the content. Pure Wolfram is the honest check here.
- **Atom repair on CAS failure** — when Wolfram says the answer is wrong, the atom
  is currently rejected. A future step could re-prompt with "Your stated answer is
  wrong; Wolfram got X instead" and attempt auto-correction (max 1 retry). Deferred
  until shadow data shows rejection rate; not worth the extra LLM cost at <5%.
