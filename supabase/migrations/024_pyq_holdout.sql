-- =============================================================================
-- 024_pyq_holdout.sql
-- =============================================================================
-- Phase 1 of Curriculum R&D — extends `pyq_questions` with two columns:
--
--   is_holdout BOOLEAN — when TRUE, this PYQ is RESERVED for measurement.
--     Practice pickers (smart-practice, mock-exam composition) MUST exclude
--     holdout PYQs. Lift computer (src/experiments/lift.ts post-Phase-1) uses
--     ONLY holdout PYQs as the canonical accuracy bank for `pyq_accuracy_delta_v1`.
--
--   taught_by_unit_id TEXT — the canonical curriculum_unit that prepares the
--     student for this PYQ. Bidirectional with curriculum_units.prepared_for_pyq_ids.
--
-- Locked invariant (eng-review D3): a PYQ NEVER moves between practice and
-- holdout after the seed script runs. Moving one would invalidate every prior
-- lift number that touched it. Same discipline as `lift_v1`.
--
-- Idempotent. Additive. No data migration; existing rows default to is_holdout=FALSE.
-- =============================================================================

ALTER TABLE pyq_questions
  ADD COLUMN IF NOT EXISTS is_holdout         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS taught_by_unit_id  TEXT,
  ADD COLUMN IF NOT EXISTS holdout_seeded_at  TIMESTAMPTZ;

-- Practice pickers should always have a fast path for "all non-holdout for this exam".
CREATE INDEX IF NOT EXISTS idx_pyqs_exam_practice
  ON pyq_questions(exam_id) WHERE is_holdout = FALSE;

-- Lift computer needs the inverse: "all holdout for this exam".
CREATE INDEX IF NOT EXISTS idx_pyqs_exam_holdout
  ON pyq_questions(exam_id) WHERE is_holdout = TRUE;

-- Lookup PYQs taught by a specific unit (used by the curriculum unit reader).
CREATE INDEX IF NOT EXISTS idx_pyqs_taught_by_unit
  ON pyq_questions(taught_by_unit_id) WHERE taught_by_unit_id IS NOT NULL;

-- =============================================================================
-- End of 024_pyq_holdout.sql
-- =============================================================================
