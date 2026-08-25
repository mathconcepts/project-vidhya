-- =============================================================================
-- 049_mock_exam_timing_mode.sql
-- =============================================================================
-- C2 (buyer demo-prep, docs/demo/buyer-qa-demo-prep.md): "exam-feel" pacing
-- modes for a mock exam — standard (unchanged full duration), compressed
-- (85-95% of standard, deterministic per exam id), rush (fixed 70%).
--
-- The chosen mode is persisted on the row it applies to (not recomputed
-- later) so the timer a student saw, the deadline used for the late check,
-- and a post-hoc report ("you did this under rush timing") all agree —
-- src/gbrain/operations/moat-operations.ts's timingModeMultiplier() is a
-- pure function of the exam id, but storing the RESULT (not just the mode
-- name) would let a future change to that function silently reinterpret an
-- already-graded exam's duration. Storing the mode name and re-deriving is
-- fine because the multiplier is a pure function of (examId, mode) and the
-- exam id itself never changes after creation.
--
-- Idempotent. Additive.
-- =============================================================================

ALTER TABLE mock_exams
  ADD COLUMN IF NOT EXISTS timing_mode TEXT NOT NULL DEFAULT 'standard';

DO $$ BEGIN
  ALTER TABLE mock_exams ADD CONSTRAINT mock_exams_timing_mode_check
    CHECK (timing_mode IN ('standard', 'compressed', 'rush'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- End of 049_mock_exam_timing_mode.sql
-- =============================================================================
