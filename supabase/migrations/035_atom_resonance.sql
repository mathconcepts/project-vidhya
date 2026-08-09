-- Migration 035: Atom Resonance Score (Track E2)
--
-- resonance_v1 = 0.30·completion_rate + 0.20·dwell_fit + 0.20·(1−regen_abandon_rate)
--              + 0.15·rating_score + 0.15·mastery_share
--
-- Shadow mode: computed nightly but never surfaces to students until
--   >= 2 weeks AND >= 500 scored turns.
--
-- atom_resonance: append-only aggregate per (atom_id, version_n, window_days)
-- atom_ratings:   individual "Helped / Didn't help" events (micro-signal)

-- k-anon floor: never surface a score when n < 30
-- All IF NOT EXISTS / CREATE TABLE IF NOT EXISTS for idempotency.

CREATE TABLE IF NOT EXISTS atom_ratings (
  id              TEXT      PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  atom_id         TEXT      NOT NULL,
  student_id      UUID      NOT NULL,
  session_id      TEXT,
  rating          SMALLINT  NOT NULL CHECK (rating IN (1, -1)),
  -- 1 = "Helped", -1 = "Didn't help"
  rated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atom_ratings_atom_id ON atom_ratings (atom_id);
CREATE INDEX IF NOT EXISTS idx_atom_ratings_rated_at ON atom_ratings (rated_at);

-- Per-atom aggregate (append-only, keyed by window)
CREATE TABLE IF NOT EXISTS atom_resonance (
  id              TEXT      PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  atom_id         TEXT      NOT NULL,
  version_n       INTEGER   NOT NULL DEFAULT 0,
  -- cohort_key: e.g. 'gate-ma' or 'all'
  cohort_key      TEXT      NOT NULL DEFAULT 'all',
  window_days     INTEGER   NOT NULL DEFAULT 7,
  resonance_v1    NUMERIC(6,4),   -- NULL until n >= 30
  n               INTEGER   NOT NULL DEFAULT 0,
  -- Component breakdown (for debugging; never served to students)
  completion_rate NUMERIC(6,4),
  dwell_fit       NUMERIC(6,4),
  regen_abandon_rate NUMERIC(6,4),
  rating_score    NUMERIC(6,4),
  mastery_share   NUMERIC(6,4),
  shadow_mode     BOOLEAN   NOT NULL DEFAULT TRUE,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atom_resonance_atom_id ON atom_resonance (atom_id, version_n);
CREATE INDEX IF NOT EXISTS idx_atom_resonance_computed ON atom_resonance (computed_at DESC);
