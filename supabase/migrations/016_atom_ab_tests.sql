-- 016_atom_ab_tests.sql — Auto A/B testing of regen variants (PENDING.md §4.12).
--
-- Tracks per-atom 50/50 traffic-split experiments between two atom_versions.
-- Created by regen-scanner when it produces a candidate (v2). Evaluated
-- nightly by ab-evaluator: compares cohort error rate between control and
-- candidate buckets after the experiment window, auto-promotes the winner.
--
-- Bucket assignment is deterministic via hash(student_id) % 2 — no need to
-- store per-student assignments. The nightly evaluator re-hashes when
-- computing aggregates.
--
-- Lifecycle:
--   running    → experiment active, both versions servable per hash bucket
--   promoted_candidate → candidate beat control by >= MIN_DELTA, candidate
--                        is now the active version
--   promoted_control   → control beat candidate, candidate reverted, control
--                        re-activated
--   tie        → no statistically clear winner, candidate stays active
--                (since it was just generated based on misconception data)
--   insufficient_data → not enough engagements to decide, candidate stays
--   cancelled  → admin manually stopped the experiment

CREATE TABLE IF NOT EXISTS atom_ab_tests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atom_id               TEXT NOT NULL,
  control_version_n     INTEGER NOT NULL,
  candidate_version_n   INTEGER NOT NULL,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at               TIMESTAMPTZ NOT NULL,
  evaluated_at          TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'running'
                          CHECK (status IN (
                            'running', 'promoted_candidate', 'promoted_control',
                            'tie', 'insufficient_data', 'cancelled'
                          )),
  /** Snapshot of the evaluator's verdict — n students per bucket, error pcts, delta. */
  verdict               JSONB
);

-- Only one running experiment per atom — the partial unique index lets us
-- have many archived experiments per atom but at most one running.
CREATE UNIQUE INDEX IF NOT EXISTS atom_ab_tests_running_uniq
  ON atom_ab_tests (atom_id) WHERE status = 'running';

CREATE INDEX IF NOT EXISTS atom_ab_tests_ends_at_idx
  ON atom_ab_tests (ends_at) WHERE status = 'running';
