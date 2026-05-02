-- =============================================================================
-- 020_experiments.sql
-- =============================================================================
-- Vidhya Content R&D Loop — experiment spine.
--
-- Adds four tables that turn ad-hoc content generation into a measurable,
-- closed-loop system:
--
--   1. experiments            — what we're testing + cached lift
--   2. experiment_assignments — what each variant got (atoms / flags / runs)
--   3. mastery_snapshots      — append-only mastery time-series (lift baseline)
--   4. generation_runs        — every batch of generated content + its config
--
-- Plus generation_run_id columns on the artifact tables so every atom and
-- problem traces back to the run that produced it.
--
-- Idempotent. Safe to re-run. No FKs to high-churn tables (student_model,
-- generated_problems) so the spine survives parent deletes.
--
-- Reads: src/curriculum/exam-loader.ts, src/gbrain/student-model.ts
-- Used by: src/experiments/, src/generation/, src/jobs/learnings-ledger.ts
-- =============================================================================

-- 1. EXPERIMENTS --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS experiments (
  id              TEXT PRIMARY KEY,                    -- 'exp_2026w19_la_pyq'
  name            TEXT NOT NULL,
  exam_pack_id    TEXT NOT NULL,                       -- 'gate-ma'
  git_sha         TEXT NOT NULL,                       -- HEAD at creation
  hypothesis      TEXT,
  variant_kind    TEXT,                                -- atom|flag|gen_run|multi
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','won','lost','inconclusive','aborted')),
  -- Cached most-recent lift_v1 result. Recomputed by nightly ledger job.
  lift_v1         NUMERIC,
  lift_n          INTEGER,
  lift_p          NUMERIC,
  lift_updated_at TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_experiments_exam_status
  ON experiments(exam_pack_id, status);

-- 2. ASSIGNMENTS --------------------------------------------------------------
-- target_kind/target_id deliberately untyped (TEXT) to support all variant
-- kinds: atom_id, flag_key, generation_run_id, session_id (for student-level).
CREATE TABLE IF NOT EXISTS experiment_assignments (
  experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  target_kind   TEXT NOT NULL CHECK (target_kind IN ('atom','flag','gen_run','session')),
  target_id     TEXT NOT NULL,
  variant       TEXT NOT NULL,                        -- 'control'|'treatment'|named
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (experiment_id, target_kind, target_id)
);
CREATE INDEX IF NOT EXISTS idx_assignments_target
  ON experiment_assignments(target_kind, target_id);

-- 3. MASTERY SNAPSHOTS --------------------------------------------------------
-- Append-only time-series of (session × concept × mastery). Powers lift
-- computation: lift = mean(post_window_mastery) - mean(pre_window_mastery)
-- across the treatment cohort vs control. Snapshotted by:
--   (a) attempt-time hook (after saveStudentModel), source='attempt'
--   (b) nightly job for active sessions, source='nightly'
--   (c) one-off backfills, source='backfill'
CREATE TABLE IF NOT EXISTS mastery_snapshots (
  session_id    TEXT NOT NULL,
  user_id       UUID,                                  -- mirror of student_model.user_id (nullable)
  concept_id    TEXT NOT NULL,
  exam_pack_id  TEXT NOT NULL,
  mastery       NUMERIC NOT NULL CHECK (mastery >= 0 AND mastery <= 1),
  attempts      INTEGER NOT NULL DEFAULT 0,
  taken_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source        TEXT NOT NULL CHECK (source IN ('attempt','nightly','backfill')),
  PRIMARY KEY (session_id, concept_id, taken_at)
);
CREATE INDEX IF NOT EXISTS idx_snapshots_concept_time
  ON mastery_snapshots(concept_id, exam_pack_id, taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_session_time
  ON mastery_snapshots(session_id, taken_at DESC);

-- 4. GENERATION RUNS ----------------------------------------------------------
-- Every batch of content generation runs inside a GenerationRun. The
-- existing flywheel cron creates a default daily run if none queued.
-- experiment_id nullable: ad-hoc/cron runs allowed without an explicit
-- experiment, but most operator-launched runs will have one.
CREATE TABLE IF NOT EXISTS generation_runs (
  id              TEXT PRIMARY KEY,                    -- 'run_2026w19_001'
  exam_pack_id    TEXT NOT NULL,
  experiment_id   TEXT REFERENCES experiments(id),
  hypothesis      TEXT,
  config          JSONB NOT NULL,                      -- {target,pipeline,verification,quota}
  git_sha         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','running','complete','aborted','failed')),
  cost_usd        NUMERIC NOT NULL DEFAULT 0,
  artifacts_count INTEGER NOT NULL DEFAULT 0,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_runs_exam_status
  ON generation_runs(exam_pack_id, status, created_at DESC);

-- 5. STAMP RUN ID ON ARTIFACT TABLES ------------------------------------------
-- Lets every atom / problem / media artifact trace back to the run that
-- produced it. No FK (run rows can be archived; artifacts must survive).
ALTER TABLE generated_problems
  ADD COLUMN IF NOT EXISTS generation_run_id TEXT;
ALTER TABLE atom_versions
  ADD COLUMN IF NOT EXISTS generation_run_id TEXT;
ALTER TABLE media_artifacts
  ADD COLUMN IF NOT EXISTS generation_run_id TEXT;

CREATE INDEX IF NOT EXISTS idx_genprob_run     ON generated_problems(generation_run_id);
CREATE INDEX IF NOT EXISTS idx_atomver_run     ON atom_versions(generation_run_id);
CREATE INDEX IF NOT EXISTS idx_media_run       ON media_artifacts(generation_run_id);

-- =============================================================================
-- End of 020_experiments.sql
-- =============================================================================
