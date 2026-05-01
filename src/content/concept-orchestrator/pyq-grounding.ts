// @ts-nocheck
/**
 * pyq-grounding.ts — exam-pattern grounding for the orchestrator (E3).
 *
 * Pulls top-3 past-year-questions for a given (topic, atom_type) so the
 * generated atom mirrors real exam phrasing.
 *
 * v2 (4.11, shipped 2026-05-01): hybrid grounding cascade —
 *
 *   1. If a query embedding is available AND there are PYQs with embeddings:
 *      semantic search via pgvector cosine similarity → top-K closest PYQs.
 *   2. Else fall back to v1: keyword lookup on (topic, exam_id) with
 *      ORDER BY year DESC.
 *
 * The query embedding is derived from the LO text + atom_type at call time
 * (see groundForLOWithEmbedding). Backfilling pyq_questions.embedding is
 * the operator's job (scripts/embed-pyq-corpus.ts).
 *
 * Graceful degradation: when the DB is unavailable (free-tier / dev), the
 * loader returns an empty array and the orchestrator continues without
 * grounding — the generated atom gets `pyq_grounded: false` in its provenance.
 */

import pg from 'pg';

const { Pool } = pg;
let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

export interface PyqGrounding {
  pyq_id: string;
  question_text: string;
  topic: string;
  exam_id: string;
  year: number | null;
}

/**
 * Atom types that benefit from PYQ grounding. Other types (intuition,
 * mnemonic, hook) generate cleaner without exam-style stems.
 */
const PYQ_RELEVANT_ATOM_TYPES = new Set([
  'exam_pattern', 'common_traps', 'worked_example', 'micro_exercise',
  'interleaved_drill',
]);

export async function groundForLO(
  topic_id: string,
  atom_type: string,
  exam_id?: string,
  limit: number = 3,
): Promise<PyqGrounding[]> {
  if (!PYQ_RELEVANT_ATOM_TYPES.has(atom_type)) return [];
  const pool = getPool();
  if (!pool) return [];

  try {
    const params: any[] = [topic_id, limit];
    let where = 'topic = $1';
    if (exam_id) {
      where += ' AND exam_id = $3';
      params.push(exam_id);
    }
    // Order by year DESC so most recent PYQs win — exam phrasing drifts.
    const r = await pool.query(
      `SELECT id, question_text, topic, exam_id, year
         FROM pyq_questions
         WHERE ${where}
         ORDER BY year DESC NULLS LAST, id DESC
         LIMIT $2`,
      params,
    );
    return r.rows.map((row: any) => ({
      pyq_id: row.id,
      question_text: row.question_text,
      topic: row.topic,
      exam_id: row.exam_id,
      year: row.year,
    }));
  } catch (err) {
    console.warn(`[pyq-grounding] lookup failed for ${topic_id}: ${(err as Error).message}`);
    return [];
  }
}

/**
 * Vector-search variant (4.11). Returns top-K PYQs by cosine similarity
 * to the supplied query embedding. Falls back to the keyword lookup
 * (groundForLO) when:
 *   - No query embedding supplied
 *   - No PYQ rows have embeddings yet
 *   - Vector search returns fewer than 1 result
 *
 * The embedding column is created by migration 015 and backfilled by
 * scripts/embed-pyq-corpus.ts (operator action — embeddings cost money).
 */
export async function groundForLOWithEmbedding(
  topic_id: string,
  atom_type: string,
  query_embedding: number[] | null,
  exam_id?: string,
  limit: number = 3,
): Promise<PyqGrounding[]> {
  if (!PYQ_RELEVANT_ATOM_TYPES.has(atom_type)) return [];
  const pool = getPool();
  if (!pool) return [];

  // Without an embedding we can't do vector search — fall back to keyword.
  if (!query_embedding || query_embedding.length === 0) {
    return groundForLO(topic_id, atom_type, exam_id, limit);
  }

  const vec = `[${query_embedding.join(',')}]`;
  try {
    const params: any[] = [vec, limit];
    let where = 'embedding IS NOT NULL';
    if (exam_id) {
      where += ' AND exam_id = $3';
      params.push(exam_id);
    }
    // Cosine distance via the <=> operator. Lower = more similar.
    // ORDER BY a vector op uses the HNSW index from migration 015.
    const r = await pool.query(
      `SELECT id, question_text, topic, exam_id, year,
              1 - (embedding <=> $1::vector) AS similarity
         FROM pyq_questions
         WHERE ${where}
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
      params,
    );
    if (r.rows.length === 0) {
      // No embedded PYQs match — fall back to keyword path so the atom
      // still gets some exam grounding (better than nothing).
      return groundForLO(topic_id, atom_type, exam_id, limit);
    }
    return r.rows.map((row: any) => ({
      pyq_id: row.id,
      question_text: row.question_text,
      topic: row.topic,
      exam_id: row.exam_id,
      year: row.year,
    }));
  } catch (err) {
    console.warn(`[pyq-grounding] vector search failed for ${topic_id}: ${(err as Error).message}`);
    return groundForLO(topic_id, atom_type, exam_id, limit);
  }
}

/**
 * Format grounding into prompt context block. Returns empty string when
 * no PYQs were found — the orchestrator omits the section entirely.
 */
export function formatPyqContext(grounding: PyqGrounding[]): string {
  if (grounding.length === 0) return '';
  const lines = grounding.map(
    (g, i) => `  ${i + 1}. (${g.exam_id}${g.year ? ` ${g.year}` : ''}) ${g.question_text.slice(0, 200)}`,
  );
  return [
    '',
    'Past exam questions on this topic — mirror their phrasing and difficulty:',
    ...lines,
  ].join('\n');
}
