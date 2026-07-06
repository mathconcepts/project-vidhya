-- 032_generated_problems_marking.sql
--
-- Wave 8: give `generated_problems` an honest GATE marking shape so the
-- executing DeterministicScorer (src/scoring/deterministic-scorer.ts,
-- landed Wave 7 but unconsumed) can resolve real per-item marking, and
-- readiness-routes' attachMarking() can stop being a documented no-op.
--
-- All columns are NULLABLE by design: existing rows (and any generator
-- that hasn't been taught to emit marking yet) simply have no marking —
-- the catalog surfaces nothing and the API attaches nothing. Honest
-- degradation over fabricated defaults (blueprint D4/D8: never guess
-- marks).
--
--   question_type   'mcq' | 'msq' | 'nat' (GATE item kinds)
--   marks           positive int; GATE is 1 or 2 but the CHECK only
--                   enforces > 0 so other exam profiles can reuse this
--   answer_index    MCQ: 0-based index of the correct option
--   answer_indices  MSQ: JSONB array of 0-based correct indices
--   answer_range    NAT: JSONB [lo, hi] inclusive accepted range

ALTER TABLE generated_problems
  ADD COLUMN IF NOT EXISTS question_type TEXT
    CHECK (question_type IS NULL OR question_type IN ('mcq', 'msq', 'nat')),
  ADD COLUMN IF NOT EXISTS marks INT
    CHECK (marks IS NULL OR marks > 0),
  ADD COLUMN IF NOT EXISTS answer_index INT
    CHECK (answer_index IS NULL OR answer_index >= 0),
  ADD COLUMN IF NOT EXISTS answer_indices JSONB,
  ADD COLUMN IF NOT EXISTS answer_range JSONB;

COMMENT ON COLUMN generated_problems.question_type  IS 'GATE item kind: mcq | msq | nat. NULL = marking unknown; scorer never guesses.';
COMMENT ON COLUMN generated_problems.marks          IS 'Max marks for the item (GATE: 1 or 2). NULL = marking unknown.';
COMMENT ON COLUMN generated_problems.answer_index   IS 'MCQ only: 0-based correct option index.';
COMMENT ON COLUMN generated_problems.answer_indices IS 'MSQ only: JSONB array of 0-based correct option indices.';
COMMENT ON COLUMN generated_problems.answer_range   IS 'NAT only: JSONB [lo, hi] inclusive accepted numeric range.';
