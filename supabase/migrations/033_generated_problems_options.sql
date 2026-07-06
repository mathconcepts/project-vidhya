-- 033_generated_problems_options.sql
--
-- Wave 9 companion to 032: the canonical ORDERED option list for
-- mcq/msq problems. 032's answer_index / answer_indices are 0-based
-- indices INTO this list — without a canonical order stored alongside,
-- those indices are meaningless (the pre-existing `distractors` column
-- has no defined order relative to `correct_answer`, and shuffling at
-- serve time would silently corrupt the key).
--
-- Nullable like the 032 columns: a NULL options list on an mcq/msq row
-- means the item is not deterministically gradable and
-- POST /api/practice/attempt refuses it (422) rather than guessing.
-- NAT items never need options.

ALTER TABLE generated_problems
  ADD COLUMN IF NOT EXISTS options JSONB;

COMMENT ON COLUMN generated_problems.options IS 'Canonical ordered option list for mcq/msq; answer_index/answer_indices are 0-based indices into this array. NULL = not deterministically gradable.';
