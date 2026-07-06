# A7 — FSRS/SM-2 Swap: Mapping Specification (DECISION REQUIRED)

> Blueprint amendment A7 (v2.1, 2026-07-04 design review) requires this
> mapping spec to be agreed **before** the live review scheduler moves
> off SM-2. This document is that spec. Status: **DRAFT — awaiting
> Giri's sign-off.** Nothing in this doc changes runtime behavior.

## 1. Where SM-2 is live today (audit, 2026-07-06, v4.23.0)

| Site | Algorithm | State store | Consumers |
|---|---|---|---|
| `src/lessons/spaced-scheduler.ts` | SM-2, q capped at 4 | `VisitState` per concept (interval days + ease factor), persisted by callers | `POST /api/lesson/advance-sm2` (lesson-routes), gate-routes |
| `src/gbrain/retention-scheduler.ts` | SM-2 (0–5 quality) | Flat-file store (`RetentionItem` per student × concept) | gbrain-routes, after-each-attempt, syllabus-bridge |
| `src/gbrain/fsrs.ts` + `student-model-pg.ts` | **FSRS-6 (already live)** | `fsrs_cards` (Pg, per student × object) | Wave 7+ attempt path: `StudentModel.update()`, retrievability, at-risk mastery |

So the repo currently runs **two clocks**: FSRS per-object cards on the
new attempt path, SM-2 per-concept intervals on lessons + legacy
retention. The swap unifies on FSRS. The danger is silently rescheduling
every existing student's review queue — hence this spec.

## 2. Quality → Rating mapping

SM-2 sites emit quality 0–5 (retention) / 0–4 (lessons). FSRS wants
Rating 1–4 (again/hard/good/easy).

| SM-2 q (retention, 0–5) | SM-2 q (lessons, 0–4) | FSRS Rating |
|---|---|---|
| 0–1 (blackout / wrong) | 0–1 | 1 again |
| 2 (wrong but familiar) | 2 | 2 hard |
| 3 (correct, hesitant) | 3 | 3 good |
| 4 (correct, confident) | 4 | 3 good |
| 5 (perfect, instant) | — (capped) | 4 easy |

Rationale: the lessons scheduler already caps at 4 because "true
quality-5 requires spaced evidence we don't infer in real time" — the
same conservatism maps confident-but-unspaced recall to **good**, not
easy. Only retention's explicit q=5 earns **easy**.
`fsrs.ratingFromAttempt()` (already in the codebase for the attempt
path) stays authoritative where a raw attempt (correct + latency) is the
input; the table above covers legacy qualities only.

## 3. Existing-state migration: (interval, ease) → (stability, difficulty)

For every existing SM-2 record at migration time:

- **stability ← current interval in days**, floored at 0.5. FSRS defines
  stability as the interval at ~90% recall; SM-2 intervals were producing
  acceptable recall for this student, so the interval is the least-wrong
  estimator we possess. No refitting from history in v1.
- **difficulty ← clamp(11 − 2.8 × ease_factor, 1, 10).** Anchors:
  SM-2 default ease 2.5 → difficulty ≈ 4 (FSRS "typical"); floor ease
  1.3 → ≈ 7.4 (hard); ease 3.0+ → ≤ 2.6 (easy). Linear, monotone,
  clamped — boring on purpose.
- **lastReviewAt ← last_visited_at / last review timestamp; reps ←
  visit_count; lapses ← 0** (SM-2 kept no lapse history worth trusting).
- **dueAt ← intervalForRetention(stability)** from lastReviewAt. This
  keeps every migrated item due within ±1 day of its SM-2 due date by
  construction (stability = interval), so **no student sees their review
  queue jump** on migration day. That property is the acceptance test.

## 4. Rollout

1. **Shadow mode (1 release):** schedulers compute both SM-2 and FSRS
   next-due, persist SM-2 (behavior unchanged), log the deltas
   (`fsrs_shadow_log`). Exit criterion: median |due delta| ≤ 1 day over
   ≥200 review events, no crash-path regressions.
2. **Swap:** migrate state per §3 in one migration; schedulers read/write
   FSRS cards; SM-2 modules stay for one release behind
   `VIDHYA_SCHEDULER=sm2` (module-flag convention from AUTH.md) as the
   rollback lever.
3. **Cleanup:** remove SM-2 modules + flag; keep the migration reversible
   (SM-2 columns retained, frozen, one release).

## 5. Out of scope

Parameter refits of FSRS-6 weights (Phase 4, needs data), unifying
concept-level vs object-level card granularity (tracked separately —
lessons schedule per concept, fsrs_cards per object; migration keeps each
site's granularity), and any UI change.

## 6. Sign-off

- [ ] Giri — mapping table (§2), migration formulas (§3), rollout (§4)

Once checked, implementation is Wave 12: shadow mode first, exactly as §4.
