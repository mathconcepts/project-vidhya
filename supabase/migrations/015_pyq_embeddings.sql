-- 015_pyq_embeddings.sql — Vector PYQ search for the concept orchestrator (4.11).
--
-- Adds an embedding column on pyq_questions so the orchestrator's PYQ-grounding
-- can switch from `topic_id + atom_type` keyword lookup to semantic search.
-- The benefit: generated atoms are grounded in PYQs that are semantically
-- similar to the LO text, even when topic_id metadata is wrong or missing.
--
-- Sized at 1536 dims (OpenAI text-embedding-3-small) to fit pgvector's
-- HNSW/IVFFlat 2000-dim index limit on Supabase. The 004 migration uses
-- 3072 dims which can't be indexed; we deliberately chose a smaller-but-
-- indexable model for the PYQ corpus where lookup speed matters more than
-- the marginal quality bump from larger embeddings.
--
-- Backfill is opt-in via scripts/embed-pyq-corpus.ts (separate, not
-- part of this migration). Until then, the embedding column is NULL
-- for all rows and grounding falls back to the keyword path.
--
-- pgvector-optional: the entire migration is a no-op on plain Postgres
-- deployments without pgvector installed. Other features are unaffected.

DO $$
BEGIN
  -- Try to enable pgvector (already enabled by 001 on most installs).
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '015: pgvector not available (%), PYQ embedding column skipped', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN

    ALTER TABLE pyq_questions
      ADD COLUMN IF NOT EXISTS embedding   VECTOR(1536),
      ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ;

    -- HNSW index for fast cosine-similarity search.
    CREATE INDEX IF NOT EXISTS pyq_questions_embedding_hnsw_idx
      ON pyq_questions USING hnsw (embedding vector_cosine_ops);

  ELSE
    RAISE NOTICE '015: pgvector absent — pyq_questions embedding column and HNSW index skipped';
  END IF;
END;
$$;
