-- 030_attempt_dedup.sql
--
-- Idempotency table for StudentModel.update(). Elo is not commutative
-- on duplicates: applying the same (student, item, ts) attempt twice
-- will drift the rating. Blueprint §3.1 guardrail; doc contract on
-- StudentModel.update.
--
-- The PRIMARY KEY enforces uniqueness — Postgres impls INSERT with
-- ON CONFLICT DO NOTHING and treat `xmax::text::int = 0` (row was
-- newly inserted) as "first time seen."

CREATE TABLE IF NOT EXISTS attempt_dedup (
  student_id   TEXT NOT NULL,
  object_id    TEXT NOT NULL,
  ts_ms        BIGINT NOT NULL,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, object_id, ts_ms)
);

-- Light retention helper — old dedup keys can be pruned after 30 days;
-- by then any duplicate event has long since arrived. Cron prunes;
-- this index keeps the prune cheap.
CREATE INDEX IF NOT EXISTS idx_attempt_dedup_recorded ON attempt_dedup (recorded_at);
