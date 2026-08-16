-- 038_thinking_gap_framing.sql
--
-- Adds the learner-framing dimension to the thinking-gap cache.
--
-- Before this, the cache key was (concept_id, error_type, misconception_hash).
-- The frontend never sent misconceptions, so the hash was a constant and the
-- table held exactly ONE row per (concept, error_type) — one sentence, written
-- once, served to every student forever. The explanation was LLM-generated at
-- the origin and completely static thereafter.
--
-- `framing` is a cohort label of the form `<band>/<stance>/<mode>`, e.g.
-- `building/shaken/geometric` (see src/sessions/learner-framing.ts). Coarse on
-- purpose: at most 27 values, so the cache stays cohort-shaped and keeps a
-- usable hit rate, instead of degenerating to per-student generation and
-- blowing the runtime LLM budget.
--
-- It identifies a SITUATION, not a person: no student id, no session id, and
-- nothing that could be joined back to an individual.
--
-- Existing rows are backfilled to 'generic', which is what they are — text
-- written with no knowledge of who was reading it. They keep serving until a
-- framed variant is generated for their cohort.
--
-- Idempotent, and a no-op on deploys where 012 never ran.

DO $$
BEGIN
  IF to_regclass('public.thinking_gap_cache') IS NULL THEN
    RAISE NOTICE '038: thinking_gap_cache absent, skipping';
    RETURN;
  END IF;

  ALTER TABLE thinking_gap_cache
    ADD COLUMN IF NOT EXISTS framing TEXT NOT NULL DEFAULT 'generic';

  -- The old constraint would reject a second framing for the same
  -- (concept, error_type, misconception_hash), which is exactly the row we now
  -- need to be able to write.
  ALTER TABLE thinking_gap_cache DROP CONSTRAINT IF EXISTS uq_thinking_gap;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_thinking_gap_framed'
  ) THEN
    ALTER TABLE thinking_gap_cache
      ADD CONSTRAINT uq_thinking_gap_framed
      UNIQUE (concept_id, error_type, misconception_hash, framing);
  END IF;
END $$;

-- Lookup index matching the new key order. The old three-column index stays;
-- it still serves the admin coverage query that groups by concept + error type.
CREATE INDEX IF NOT EXISTS idx_thinking_gap_lookup_framed
  ON thinking_gap_cache(concept_id, error_type, misconception_hash, framing);
