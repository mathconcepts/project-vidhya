-- 015_pyq_embeddings.sql — Vector PYQ search for the concept orchestrator (4.11).
--
-- Adds an embedding column on pyq_questions so the orchestrator's PYQ-grounding
-- can switch from `topic_id + atom_type` keyword lookup to semantic search.
-- The benefit: generated atoms are grounded in PYQs that are semantically
-- similar to the LO text, even when topic_id metadata is wrong or missing.
--
-- Sized at 1536 dims (OpenAI text-embedding-3-small) to fit pgvector's
-- HNSW/IVFFlat 2000-dim index limit on Supabase. The 004 migration uses
-- 3072 dims (gemini-embedding-001) which can't be indexed; we deliberately
-- chose a smaller-but-indexable model for the PYQ corpus where lookup
-- speed matters more than the marginal quality bump from 3072 dims.
--
-- Backfill is opt-in via scripts/embed-pyq-corpus.ts (separate, not
-- part of this migration). Until then, the embedding column is NULL
-- for all rows and grounding falls back to the keyword path.

-- pgvector is already enabled by 001_rag_schema.sql; no-op here for
-- safety on fresh deploys that skip 001.
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE pyq_questions
  ADD COLUMN IF NOT EXISTS embedding VECTOR(1536),
  ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ;

-- HNSW index for fast cosine-similarity search. Created CONCURRENTLY-
-- compatible-style; the IF NOT EXISTS makes the migration safe to re-run.
CREATE INDEX IF NOT EXISTS pyq_questions_embedding_hnsw_idx
  ON pyq_questions USING hnsw (embedding vector_cosine_ops);
