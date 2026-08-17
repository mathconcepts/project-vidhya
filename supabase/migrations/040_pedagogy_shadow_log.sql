-- 040_pedagogy_shadow_log.sql
--
-- Shadow mode for the Tier 4 pedagogy gate. Same shape as
-- 034_fsrs_shadow_log.sql, which answered the equivalent question for the
-- scheduler swap: record what the gate WOULD have decided so the decision to
-- switch it on is data rather than a feeling.
--
-- The gate has run in shadow since it was written. Its threshold defaults to
-- 0.65, a number chosen before any content had been scored.
--
-- `errored` is the load-bearing column. The verifier reports score = 0 both
-- when the judge throws and when it returns unparseable output, so without
-- this flag a run with no reachable LLM provider produces a table full of
-- zeros indistinguishable from genuinely terrible content — and a
-- distribution over those zeros argues for a threshold of zero. Every
-- statistic excludes errored rows; see src/content/verifiers/pedagogy-shadow.ts.
--
-- Exit criterion (read via GET /api/admin/pedagogy-shadow):
--   >= 30 scored observations AND judge error rate <= 10%.
-- This table is diagnostic-only and freely truncatable.

CREATE TABLE IF NOT EXISTS pedagogy_shadow_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  target_id   TEXT NOT NULL,             -- curriculum unit id (what the gate gates)
  concept_id  TEXT,
  score       NUMERIC NOT NULL,          -- weighted rubric total; meaningless when errored
  errored     BOOLEAN NOT NULL DEFAULT FALSE,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedagogy_shadow_created
  ON pedagogy_shadow_log (created_at DESC);

-- The criterion filters on this constantly; scored rows are the only ones
-- any statistic reads.
CREATE INDEX IF NOT EXISTS idx_pedagogy_shadow_scored
  ON pedagogy_shadow_log (errored, created_at DESC);
