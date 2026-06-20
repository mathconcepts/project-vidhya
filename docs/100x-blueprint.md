# 100x Blueprint — Foundation PR

This PR lands the architectural foundation for the 100x Blueprint
(stored at `886f0351-ProjectVidhya100xBlueprint.md`). It does **not**
ship every phase end-to-end — the blueprint estimates 13–20 weeks of
calendar time for that, and one PR isn't the right unit. Instead this
PR locks the interface contracts and the highest-leverage primitives,
so subsequent PRs can fill in implementations as swaps rather than
rewrites.

## Approvals locked in this PR

Per blueprint §9 the user signed off on:

- **Premise gate (§1.1).** Adopt the Extraction vs Acquisition split as
  the spine. The retain-vs-practice arbitration in
  `src/readiness/next-best-action.ts` encodes Extraction-priority
  (an overdue card outranks a fresh practice when memory is leaking).
- **Challenge C1.** Right-modality manim — text + worked examples by
  default; manim/interactive reserved for concepts where motion earns
  its cost. Captured in the `TeachingPolicy` contract (the policy
  picks the modality; the curriculum repo doesn't force one).

## What this PR adds

### Phase 0 — seams (interfaces only)

`src/core/interfaces.ts` defines the seven layer contracts from §5:

| Layer | Interface | Status |
|---|---|---|
| L3 Student Model | `StudentModel` | [plugin] — Elo+FSRS now, AKT later |
| L4 Assessment | `Scorer`, `ItemSelector` | [plugin] — MCQ vs descriptive vs proto-CAT |
| L2 Curriculum | `CurriculumRepo` | [plugin] — per-course graph |
| L5 Teaching Policy | `TeachingPolicy` | [plugin] — for A/B'ing strategies |
| L6 Readiness Engine | `ReadinessEngine` | [plugin] — `nextBestAction()` |
| L1.5 Eval & Guardrails | `VerificationGate` | [seam] |
| L1 Platform | `LLMGateway` | [seam] — existing `LLMClient` honors it |

### Phase 1 — Elo + FSRS + nextBestAction

Real working implementations, pure-function, ~600 lines + 35 tests:

- `src/gbrain/elo.ts` — joint student-ability / item-difficulty online
  ratings (§3.1, D1). K_STUDENT=32, K_ITEM=8 by design — items move
  slower than students; difficulty isn't trustworthy until n≥100.
- `src/gbrain/fsrs.ts` — FSRS-6 memory model (§3.4, D3). Replaces
  SM-2 over time. Locked default weights — per-user re-fit lands in
  Phase 4 behind a flag.
- `src/readiness/next-best-action.ts` — `DefaultReadinessEngine`
  encoding the four-arm core loop (Retain → Practice → Teach →
  Diagnose), Extraction-first tie-breaking.

### Phase 2 — descriptive grading scaffold

The Extraction-half engine (§3.5, D5). Skeleton with the CAS-check
guardrail wired in:

- `src/scoring/rubric-grader.ts` — `RubricGrader` implements `Scorer`.
  Six non-negotiables enforced: rubric JSON, RAG grounding, **CAS
  final-answer check is the source of truth on the number**, reason-
  then-score, calibration store, low-confidence → teacher queue.
- `src/scoring/teacher-queue.ts` — review queue contract + pure
  aggregators for the cockpit (ICC proxy, mean adjustment marks,
  oldest pending hours).
- `LLMJudge` + `CASChecker` adapters that wrap `LLMClient` and the
  existing `AnswerVerifier` cascade are intentionally separate from
  this module — landing them here would pull the full provider stack
  into pure-logic code. Wiring PR comes next.

### Phase 3 / 4

Already largely covered in tree (see CLAUDE.md):
- Content factory: `src/jobs/content-flywheel.ts`,
  `src/generation/batch/*`, `src/content/verifiers/*`
- Cockpit: `frontend/src/pages/app/ContentRDPage.tsx`,
  `EffectivenessLedger`, `SuggestedRunsPanel`
- Operator decision log, journey dashboard, cohort attention
- Lift ledger nightly job, learnings digest

Deferred (per §1.5 and Phase 4):
- DKT/SAKT/AKT (replaces Elo behind same `StudentModel`)
- Formal IRT calibration / true CAT (replaces Elo selection
  behind same `ItemSelector`)
- Live LLMJudge + CASChecker adapters wired to `LLMClient` and the
  AnswerVerifier cascade — follow-up PR
- Mock-to-marks report (Phase 2 polish; needs `expectedScore()` impl
  beyond the current placeholder)

## Migration

`supabase/migrations/029_blueprint_100x.sql` — Elo rating tables
(`student_skill_elo`, `item_difficulty_elo`), FSRS cards
(`fsrs_cards`), and the descriptive grading review queue
(`grading_reviews`). Idempotent (`IF NOT EXISTS`); applied
automatically by `src/db/auto-migrate.ts` on server boot.

## Tests

52 new tests, all pure-function:
- `src/gbrain/__tests__/elo.test.ts` (14)
- `src/gbrain/__tests__/fsrs.test.ts` (16)
- `src/readiness/__tests__/next-best-action.test.ts` (5)
- `src/scoring/__tests__/rubric-grader.test.ts` (11)
- `src/scoring/__tests__/teacher-queue.test.ts` (6)

Full suite: **1369 / 1369 passing.**

## North-star metric (§8)

The lift ledger already runs nightly (`src/jobs/learnings-ledger.ts`).
What's missing for the headline metric — *realized marks ÷ potential
marks* on mocks — is the `expectedScore()` impl in the readiness
engine. Placeholder lands here; real implementation in the Phase 2
wiring PR.
