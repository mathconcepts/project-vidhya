-- =============================================================================
-- 045_fsrs_skill_and_fire.sql
-- =============================================================================
-- T11 (Milestone B — FIRe-lite, B2). `fsrs_cards` (migration 029) is keyed
-- (student_id, object_id) with no concept join — FIRe's credit/penalty
-- propagation needs to find "every existing card for concept X" for a
-- student, and the due-card scan (T12) needs the same join. Per OV2-D5,
-- this supersedes the `objects_for_skill($2)` function approach entirely
-- (A6 already deleted that dead at-risk branch in student-model-pg.ts) —
-- no new SQL function, just a column written on every card upsert from
-- `attempt.skillId`.
--
-- `skill_id` is nullable: existing cards written before this migration have
-- no concept association until their next review re-upserts them with a
-- skill_id (PgStudentModel.update() always writes it going forward). FIRe's
-- closure walk simply finds fewer/no cards for those rows until they're
-- touched again — degrades honestly, never guesses.
--
-- Idempotent. Additive.
--
-- Note: `(student_id, due_at)` already exists as `idx_fsrs_cards_due` from
-- 029_blueprint_100x.sql — not recreated here.
-- =============================================================================

ALTER TABLE fsrs_cards
  ADD COLUMN IF NOT EXISTS skill_id TEXT;

CREATE INDEX IF NOT EXISTS idx_fsrs_cards_student_skill
  ON fsrs_cards(student_id, skill_id);

-- =============================================================================
-- End of 045_fsrs_skill_and_fire.sql
-- =============================================================================
