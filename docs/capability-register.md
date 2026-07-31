# Capability Register v0

**Status:** v0, append-only
**Scope:** the enumerated engine behaviors an exam pack can select, plus the honest ledger of places the engine currently assumes GATE instead of reading its exam's row

---

## The architecture sentence

> **An exam is a pack. A pack selects capabilities from the engine's enumerated capability set; it never defines new ones. A new capability is an explicit, versioned engine change.**

This is binding. It's the rule that keeps [exam-profile-schema.md](./exam-profile-schema.md) from decaying into per-exam special-casing: a pack (GATE-EM, JEE Main, whatever comes next) is a *selection* over a fixed, named list of behaviors the engine already knows how to do. If a new exam needs a behavior not on the list, that is engineering work — scoped, versioned, reviewed — not a config flag smuggled into the pack.

## The capability model

Capabilities are engine behaviors an exam can select. As of v0:

| Capability | Built? | Selected by |
|---|---|---|
| Single-date campaign | Yes | GATE-EM |
| Multi-attempt campaign (best-of-two aggregation, target-attempt) | **Not built — Loop D** | JEE Main (hypothesis) |
| Raw-marks scoring | Yes | GATE-EM |
| Percentile scoring (shift-normalized) | **Not built — Loop D** | JEE Main (hypothesis) |
| Negative-marking EV coaching | Yes | GATE-EM, JEE Main |
| Self-directed planning | Yes | GATE-EM |
| Institute-constrained planning (review/weak-spot layer, chapter-covered gating) | **Not built — Loop D** | JEE Main (hypothesis) |
| Minor-consent onboarding (DPDP-compliant) | **Not built — Loop D, named blocker** | JEE Main (hypothesis) |
| MSQ partial-credit rules | Partial (no-partial-unless-verified today) | GATE-EM |
| NAT tolerance grading | Yes | GATE-EM |

A pack that can be fully expressed as a selection over this table is compatible with the engine today. A pack that can't (e.g. JEE Main, honestly, right now) is blocked on the "Not built" rows until Loop D lands them — see [add-an-exam-recipe.md](./add-an-exam-recipe.md) step 3, "capability check."

## The register

This is the **honest fork test**: known places in the codebase that currently hardcode a GATE-shaped assumption instead of reading it from the exam's profile row. It exists so that "exam-agnostic" is a falsifiable claim, not a slogan — every entry here is a place where that claim is currently false, on record, with a plan to fix it.

**This table is append-only.** Never delete or silently edit a row — close it out by filling `status` (`open` → `lifted vN.N.N`) and leave the row in place as history. An unregistered exam-shaped behavior discovered later (i.e. found in the wild, not logged here first) is a **P1 hygiene bug** — log it as a new row the moment it's found, then fix it.

| # | Where it lives (file / module) | Which capability generalizes it | Which loop lifts it | Status |
|---|---|---|---|---|
| 1 | `src/gbrain/fsrs.ts`, `src/api/fsrs-shadow-routes.ts` — FSRS horizon / readiness / T-minus hooks assume a single exam date threaded end-to-end | Multi-attempt campaign | Loop D | open |
| 2 | `src/gbrain/exam-strategy.ts` (`marks_per_wrong: -0.67 // 1/3 negative marking`, per-exam hardcoded marking table) — −⅓ arithmetic in EV coaching | Negative-marking EV coaching (needs to read `marking_table` per exam instead of a hardcoded per-exam-key constant) | Loop D | open |
| 3 | `src/scoring/deterministic-scorer.ts` (`DEFAULT_MCQ_NEGATIVE`, GATE 1/3 · 2/3 fallback documented inline as "GATE-standard defaults") — raw-marks assumption in marks-saved (E5 counter) and readiness bands | Raw-marks scoring / percentile scoring | Loop D | open (partially mitigated — module already accepts an optional `MarkingScheme` override; GATE default is the fallback, not the only path) |
| 4 | `src/readiness/next-best-action.ts`, `src/readiness/syllabus-aware-engine.ts` — self-directed assumption in next-best-action (no notion of "institute already covered this chapter") | Institute-constrained planning | Loop D | open |
| 5 | Onboarding / consent flow (adult-self assumption; no minor-consent path exists anywhere in the auth or onboarding stack today) | Minor-consent onboarding | Loop D — **named blocker on the JEE pilot gate**, must clear before JEE's first 5-user checkpoint | open |
| 6 | `frontend/src/pages/app/MockExamPage.tsx` — GATE CBT conventions (3h format, GATE-specific palette, calculator policy) baked into the mock-exam UI | Mock-format config (per-exam CBT mirror) | Loop D | open |
| 7 | `src/api/gate-routes.ts:240`, `src/db/seed-static-pyqs.ts:117` — hardcoded `q.negative_marks ?? -0.33` GATE-shaped fallback in the PYQ marking path | Negative-marking EV coaching / Raw-marks scoring | Loop D | lifted this PR (v4.26.0) — both call sites now read `getMarkingTable()` / `gateMcqNegativeMarksFallback()` from `src/syllabus/exam-catalog.ts` instead of a bare literal; the literal survives only as that helper's documented GATE default |
| 8 | (closed — no finding) | — | — | closed: no additional GATE-shaped literals surfaced in this pass beyond row 7; slot closed rather than left open indefinitely |

## How to add a row

1. Name the exact file/module and the literal or assumption (quote it if it's a magic number).
2. Name the capability in the table above that would generalize it — if none exists, that's itself a finding: log it and flag that the capability model needs a new row too (that's the one case a new capability gets added, and it still goes through the versioned-change process, not a silent table edit).
3. Name the loop that owns lifting it (today: Loop D for everything not yet built).
4. Leave `status: open`. Only the engineer who lands the fix flips it to `lifted vX.Y.Z`, in the same PR.

## See also

- [exam-profile-schema.md](./exam-profile-schema.md) — the per-exam data row this register cross-checks against
- [add-an-exam-recipe.md](./add-an-exam-recipe.md) — step 3 ("capability check") is where this register gets consulted for every new exam
