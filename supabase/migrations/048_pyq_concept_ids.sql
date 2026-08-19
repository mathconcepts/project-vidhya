-- =============================================================================
-- 048_pyq_concept_ids.sql
-- =============================================================================
-- Multi-concept mapping for exam questions (T3 follow-on / A9).
--
-- Migration 044 gave pyq_questions a single `concept_id TEXT` column, but
-- most real GATE questions genuinely test SEVERAL concepts at once — e.g.
-- la-012 (data/courses/gate-em/topics/01-linear-algebra/mcqs.json) is tagged
-- system-of-equations/consistency/rank/singular-matrix and really exercises
-- systems-of-equations AND rank-nullity AND determinants AND matrix-inverse.
-- Collapsing that to one concept_id made the question discoverable under
-- only its primary concept — invisible everywhere else it's actually
-- relevant practice material.
--
-- Adds `concept_ids TEXT[]` alongside the existing `concept_id` (kept as
-- the primary concept, for back-compat with every query already written
-- against it — WHERE concept_id = $1 still works unchanged). concept_ids
-- holds the FULL set (primary first), populated by
-- src/db/pyq-concept-mapper.ts's mapPyqTagsToConceptIds() /
-- mapPyqToConceptIds() at seed time (src/db/seed-static-pyqs.ts) — same
-- "never a guess" discipline as concept_id: unmapped stays NULL/empty, not
-- a fabricated best guess.
--
-- GIN index supports both `concept_id = ANY(concept_ids)` (does this
-- question ALSO cover concept X, even when X isn't primary) and
-- `concept_ids @> ARRAY[$1]` containment lookups.
--
-- Idempotent. Additive. No data migration here — src/db/seed-static-pyqs.ts
-- backfills concept_ids on already-seeded rows the same way it already
-- backfills concept_id.
-- =============================================================================

ALTER TABLE pyq_questions
  ADD COLUMN IF NOT EXISTS concept_ids TEXT[];

CREATE INDEX IF NOT EXISTS idx_pyqs_concept_ids
  ON pyq_questions USING GIN (concept_ids);

-- =============================================================================
-- End of 048_pyq_concept_ids.sql
-- =============================================================================
