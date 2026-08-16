-- 039_correct_streak.sql
--
-- `student_model` (migration 011) tracks `consecutive_failures` but has no
-- mirror-image counter for the opposite streak. Adds `correct_streak` so a
-- future recovery-logic change (student-model.ts:244-249, tracked
-- separately) has a real column to write to instead of inventing one ad
-- hoc. This migration ONLY adds the column + wires it through
-- read/write plumbing — it does not change any scoring/recovery behavior.
--
-- Idempotent: safe to re-run, safe on deploys where 011 already ran.

ALTER TABLE student_model
  ADD COLUMN IF NOT EXISTS correct_streak INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN student_model.correct_streak IS 'Consecutive correct attempts in a row, mirror of consecutive_failures. Written by saveStudentModel(); not yet consumed by recovery logic.';
