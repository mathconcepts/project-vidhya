-- 026_batch_generation.sql
--
-- Adds the batch-generation lifecycle to generation_runs and creates the
-- per-job ledger that makes mid-flight termination recoverable.
--
-- All-additive, idempotent. No surveillance-cliff columns (no
-- personalized_*, tracked_*, behavior_*, student_context_*).

-- ---------------------------------------------------------------------------
-- 1. Extend generation_runs with batch lifecycle columns
-- ---------------------------------------------------------------------------

ALTER TABLE generation_runs
  ADD COLUMN IF NOT EXISTS batch_provider     TEXT,    -- 'gemini' | 'openai' | 'anthropic'
  ADD COLUMN IF NOT EXISTS batch_id           TEXT,    -- provider-side id
  ADD COLUMN IF NOT EXISTS batch_state        TEXT,    -- queued|prepared|submitted|downloading|processing|complete|failed|aborted
  ADD COLUMN IF NOT EXISTS submitted_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS jsonl_path         TEXT,    -- on-disk path; rebuilt deterministically from batch_jobs if missing
  ADD COLUMN IF NOT EXISTS last_polled_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS budget_locked_usd  NUMERIC; -- estimate frozen at submit; replaced by actual on completion

-- Allow runs to live in batch states even when the legacy `status` column
-- still says 'running'. The batch_state column is authoritative for the
-- batch path; legacy sync runs ignore it.
CREATE INDEX IF NOT EXISTS idx_runs_batch_state
  ON generation_runs(batch_state)
  WHERE batch_state IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Per-job durable ledger
-- ---------------------------------------------------------------------------
-- Every atom we ask the provider to generate gets one row here, keyed by
-- a deterministic custom_id we send WITH each sub-job. The provider echoes
-- custom_id back on every result row, which is how we re-attach results
-- after a crash mid-processing.
--
-- atom_spec is the input we sent (concept, atom_type, prompt template,
-- difficulty, etc.) — NOT student-specific. No user_id, no session_id.
-- result is the structured response post-parse. processed_at is the
-- idempotency keystone: if NOT NULL, downstream insertion (canonical
-- flag, atom_versions row, etc.) has already happened — skip.

CREATE TABLE IF NOT EXISTS batch_jobs (
  run_id        TEXT NOT NULL,
  custom_id     TEXT NOT NULL,
  atom_spec     JSONB NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','succeeded','failed')),
  result        JSONB,
  error         TEXT,
  submitted_at  TIMESTAMPTZ,
  processed_at  TIMESTAMPTZ,
  PRIMARY KEY (run_id, custom_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_jobs_run_status
  ON batch_jobs(run_id, status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_unprocessed
  ON batch_jobs(run_id)
  WHERE processed_at IS NULL;
