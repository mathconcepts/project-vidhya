-- =============================================================================
-- 022_canonical_flag.sql
-- =============================================================================
-- Sprint C — Learnings Ledger.
--
-- Adds `canonical BOOLEAN DEFAULT FALSE` to artifact tables so the nightly
-- learnings-ledger job can promote experiment winners and demote losers
-- without ambiguity. The serving path will prefer canonical=true atoms /
-- problems / media when multiple variants exist.
--
-- Why a separate boolean (not just status):
--   - generated_problems already has `verified BOOLEAN`; canonical is a
--     different axis (lift-driven, not correctness-driven).
--   - media_artifacts has status='done|failed|...' for render lifecycle;
--     canonical is independent (a 'done' atom can be canonical=false if
--     it lost its experiment).
--
-- Idempotent. Additive. No data migration.
-- =============================================================================

ALTER TABLE generated_problems
  ADD COLUMN IF NOT EXISTS canonical BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS canonical_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canonical_reason TEXT;

ALTER TABLE media_artifacts
  ADD COLUMN IF NOT EXISTS canonical BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS canonical_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canonical_reason TEXT;

ALTER TABLE atom_versions
  ADD COLUMN IF NOT EXISTS canonical BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS canonical_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canonical_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_genprob_canonical ON generated_problems(canonical) WHERE canonical = TRUE;
CREATE INDEX IF NOT EXISTS idx_media_canonical   ON media_artifacts(canonical)    WHERE canonical = TRUE;
CREATE INDEX IF NOT EXISTS idx_atomver_canonical ON atom_versions(canonical)      WHERE canonical = TRUE;

-- Ledger run audit trail. One row per learnings-ledger nightly tick;
-- captures what the job did so PRs and manual triage can reference it.
CREATE TABLE IF NOT EXISTS ledger_runs (
  id              TEXT PRIMARY KEY,
  ran_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  experiments_evaluated INTEGER NOT NULL DEFAULT 0,
  promotions      INTEGER NOT NULL DEFAULT 0,
  demotions       INTEGER NOT NULL DEFAULT 0,
  suggestions     INTEGER NOT NULL DEFAULT 0,
  pr_url          TEXT,                                  -- NULL until PR is opened
  digest_md       TEXT,                                  -- snapshot of the markdown digest
  status          TEXT NOT NULL DEFAULT 'complete'
                  CHECK (status IN ('running','complete','failed','dry_run'))
);
CREATE INDEX IF NOT EXISTS idx_ledger_runs_time ON ledger_runs(ran_at DESC);

-- Suggester inbox: queued follow-up runs, awaiting operator click to launch.
-- Populated by suggester.ts inside the learnings-ledger job. Cleared when
-- the operator launches the suggested run (or marks it dismissed).
CREATE TABLE IF NOT EXISTS run_suggestions (
  id              TEXT PRIMARY KEY,
  exam_pack_id    TEXT NOT NULL,
  source_experiment_id TEXT REFERENCES experiments(id) ON DELETE SET NULL,
  hypothesis      TEXT NOT NULL,
  config          JSONB NOT NULL,                        -- ready-to-launch GenerationRunConfig
  reason          TEXT NOT NULL,                         -- why we suggest this
  expected_lift   NUMERIC,                               -- what the source showed
  expected_n      INTEGER,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','launched','dismissed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acted_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_run_suggestions_status
  ON run_suggestions(exam_pack_id, status, created_at DESC);

-- =============================================================================
-- End of 022_canonical_flag.sql
-- =============================================================================
