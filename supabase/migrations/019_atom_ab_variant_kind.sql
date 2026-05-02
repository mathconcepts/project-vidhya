-- 019_atom_ab_variant_kind.sql — Phase F TTS A/B gate (PENDING.md §4.15).
--
-- Extends atom_ab_tests so the same A/B harness can test sidecar variants
-- (narration on/off) alongside the existing content variants (v1 vs v2 prose).
--
-- Schema change:
--   - New variant_kind column. Default 'content' preserves v4.9.0 semantics
--     for every existing row.
--   - For narration experiments: control_version_n = candidate_version_n
--     (same atom version, only the sidecar differs). Bucket assignment
--     toggles whether audio_url ships in the lesson payload.
--   - Replace the partial unique index so an atom can have one content
--     experiment AND one narration experiment running concurrently without
--     collision — they test different things.
--
-- Backwards compatible: every existing row gets variant_kind='content' via
-- DEFAULT. Existing v4.9.0 callers don't need to change.

ALTER TABLE atom_ab_tests
  ADD COLUMN IF NOT EXISTS variant_kind TEXT NOT NULL DEFAULT 'content'
    CHECK (variant_kind IN ('content', 'narration'));

-- Drop the old single-experiment-per-atom index and replace with a
-- (atom_id, variant_kind) partial index. content + narration experiments
-- can run side-by-side on the same atom.
DROP INDEX IF EXISTS atom_ab_tests_running_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS atom_ab_tests_running_uniq_kind
  ON atom_ab_tests (atom_id, variant_kind)
  WHERE status = 'running';
