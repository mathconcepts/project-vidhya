-- =============================================================================
-- 044_pyq_concept_id.sql
-- =============================================================================
-- pyq_questions has NEITHER a `tags` NOR a `concept_id` column (base schema
-- 001_rag_schema.sql:36-50) — the only classification is the coarse `topic`
-- TEXT column. `src/sessions/session-store.ts`'s `fetchProblemsForConcept`
-- queries `WHERE concept_id = $1`, so every real PYQ has been invisible to it
-- since it was written; the 26 linear-algebra concepts have zero PYQs a
-- concept-scoped query can ever return.
--
-- Adds `concept_id TEXT` — nullable (a question a mapper's keyword rules
-- can't confidently classify stays NULL rather than being guessed; see
-- `src/db/pyq-concept-mapper.ts`), backfilled at seed time by
-- `src/db/seed-static-pyqs.ts`, not by this migration (no app code — concept
-- classification rules — belongs in SQL).
--
-- Idempotent. Additive. No data migration here.
-- =============================================================================

ALTER TABLE pyq_questions
  ADD COLUMN IF NOT EXISTS concept_id TEXT;

-- Practice pickers scope by concept ("PYQs for eigenvalues"); partial index
-- (concept_id IS NOT NULL) keeps it small since most rows will stay
-- unclassified until the factory (A7) grows the mapper's coverage.
CREATE INDEX IF NOT EXISTS idx_pyqs_concept_id
  ON pyq_questions(concept_id) WHERE concept_id IS NOT NULL;

-- =============================================================================
-- End of 044_pyq_concept_id.sql
-- =============================================================================
