/**
 * src/scoring/learning-object-catalog-pg.ts — Wave 7: Postgres-backed
 * LearningObjectCatalog over the `generated_problems` table.
 *
 * Implements the `LearningObjectCatalog` contract (src/scoring/learning-object-catalog.ts)
 * against the table created in migration 011 (`011_gbrain_cognitive_architecture.sql`)
 * and extended by 020 (`generation_run_id`) and 022 (`canonical`/`canonical_at`/
 * `canonical_reason`). Confirmed cumulative schema used here:
 *
 *   id UUID PK, concept_id TEXT, topic TEXT, difficulty FLOAT (0..1 CHECK),
 *   question_text TEXT, correct_answer TEXT, solution_steps JSONB,
 *   distractors JSONB, target_error_type TEXT, target_misconception TEXT,
 *   verified BOOLEAN, verification_method TEXT, verification_confidence FLOAT,
 *   times_served INT, times_correct INT, empirical_difficulty FLOAT,
 *   created_at TIMESTAMPTZ, generation_run_id TEXT,
 *   canonical BOOLEAN, canonical_at TIMESTAMPTZ, canonical_reason TEXT
 *
 * Honest gaps in this table vs. what `LearningObject` / `CatalogQuery` want:
 *   - No `question_type` (mcq/msq/nat) column               → every row is
 *     surfaced as ObjectType 'practice' (the only type this table can back).
 *   - No `marks` / `max_marks` column                        → payload.maxMarks
 *     defaults to `DEFAULT_MAX_MARKS` (see below); a real value should come
 *     from a future column once the GATE marking scheme is attached per-item.
 *   - No `estimated_time` / minutes column                    → defaults to
 *     `DEFAULT_EST_MINUTES`.
 *   - No `exam_relevance` column                              → defaults to
 *     `DEFAULT_EXAM_RELEVANCE`; the ProtoCATSelector reads this from
 *     `payload.examRelevance` (see proto-cat-selector.ts), so it's threaded
 *     through the payload rather than dropped.
 *   - `difficulty` is a 0..1 FLOAT, not the Elo scale (`600..2400`) the
 *     rest of the readiness stack uses (see `expectedSuccess`/`eloFromSuccess`
 *     in src/gbrain/elo.ts). This module linearly rescales 0..1 → 600..2400
 *     so `ProtoCATSelector`'s `diffMin`/`diffMax` (already Elo-scale) filter
 *     correctly against this table without every caller re-deriving the map.
 *   - `concept_id` is free-text, not a foreign key into concept-graph.ts —
 *     `query({ skillId })` matches it as an exact string equality, same
 *     assumption `ConceptGraphCurriculumRepo` and `ProtoCATSelector` already
 *     make (skill id === concept id === catalog skillId).
 *
 * DB-less behavior: every method degrades to the honest empty-catalog
 * response (no rows / 0 exposure) rather than throwing, matching the repo's
 * DB-less demo-mode contract. This covers both "DATABASE_URL unset" and
 * "DATABASE_URL set but query fails" (e.g. migrations not yet applied) —
 * a query failure is caught and logged, never surfaced as a 500.
 */

import pg from 'pg';
import type { LearningObject, ObjectType } from '../core/interfaces';
import type { CatalogQuery, LearningObjectCatalog } from './learning-object-catalog';

const { Pool } = pg;

/** Elo-scale bounds this catalog rescales the 0..1 `difficulty` column into. */
const ELO_FLOOR = 600;
const ELO_CEILING = 2400;

/** Defaults used where `generated_problems` has no corresponding column. */
export const DEFAULT_MAX_MARKS = 4;
export const DEFAULT_EST_MINUTES = 3;
export const DEFAULT_EXAM_RELEVANCE = 0.5;

function difficultyToElo(d: number): number {
  const clamped = Math.max(0, Math.min(1, d));
  return ELO_FLOOR + clamped * (ELO_CEILING - ELO_FLOOR);
}

function eloToDifficultyBounds(diffMin?: number, diffMax?: number): { lo: number; hi: number } {
  // Inverse of difficultyToElo, clamped to [0, 1]. Callers pass Elo-scale
  // bounds (proto-cat-selector.ts); we translate to the 0..1 column scale
  // for the SQL WHERE clause.
  const toFrac = (e: number) => Math.max(0, Math.min(1, (e - ELO_FLOOR) / (ELO_CEILING - ELO_FLOOR)));
  return {
    lo: diffMin !== undefined ? toFrac(diffMin) : 0,
    hi: diffMax !== undefined ? toFrac(diffMax) : 1,
  };
}

interface GeneratedProblemRow {
  id: string;
  concept_id: string;
  topic: string;
  difficulty: number;
  question_text: string;
  correct_answer: string;
  solution_steps: unknown;
  distractors: unknown;
  verified: boolean;
  verification_method: string | null;
  times_served: number;
}

function rowToLearningObject(r: GeneratedProblemRow): LearningObject {
  return {
    id: r.id,
    nodeId: r.concept_id,
    type: 'practice' as ObjectType,
    difficulty: difficultyToElo(Number(r.difficulty)),
    estMinutes: DEFAULT_EST_MINUTES,
    prereqs: [],
    verification: r.verified ? 'cas_passed' : 'quarantined',
    payload: {
      skillId: r.concept_id,
      topic: r.topic,
      questionText: r.question_text,
      correctAnswer: r.correct_answer,
      solutionSteps: r.solution_steps,
      distractors: r.distractors,
      maxMarks: DEFAULT_MAX_MARKS,
      examRelevance: DEFAULT_EXAM_RELEVANCE,
      verificationMethod: r.verification_method,
      timesServed: r.times_served,
    },
  };
}

export class PgLearningObjectCatalog implements LearningObjectCatalog {
  private pool: pg.Pool | null;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    // No DATABASE_URL → no pool at all. Every method short-circuits to the
    // empty-catalog response without ever attempting a connection.
    this.pool = connectionString ? new Pool({ connectionString, max: 5 }) : null;
  }

  async query(q: CatalogQuery): Promise<LearningObject[]> {
    if (!this.pool) return [];

    // This table only ever backs 'practice' objects. If the caller asked
    // for other types exclusively, there's honestly nothing to return.
    if (q.types && q.types.length > 0 && !q.types.includes('practice')) {
      return [];
    }

    const { lo, hi } = eloToDifficultyBounds(q.diffMin, q.diffMax);
    const limit = Math.max(1, Math.min(500, q.limit ?? 50));

    try {
      const { rows } = await this.pool.query<GeneratedProblemRow>(
        `SELECT id, concept_id, topic, difficulty, question_text, correct_answer,
                solution_steps, distractors, verified, verification_method, times_served
           FROM generated_problems
          WHERE concept_id = $1
            AND difficulty >= $2
            AND difficulty <= $3
          ORDER BY difficulty ASC
          LIMIT $4`,
        [q.skillId, lo, hi, limit],
      );
      return rows.map(rowToLearningObject);
    } catch (err) {
      // DB reachable but query failed (e.g. table/migration missing in an
      // older deploy, or a transient connection error). Degrade to the
      // honest empty-catalog response rather than throwing — matches the
      // repo's DB-less demo-mode contract for every other new endpoint.
      console.error('[learning-object-catalog-pg] query failed, returning empty:', (err as Error).message);
      return [];
    }
  }

  async exposureCount(objectId: string): Promise<number> {
    if (!this.pool) return 0;
    try {
      const { rows } = await this.pool.query(
        'SELECT times_served FROM generated_problems WHERE id = $1',
        [objectId],
      );
      return rows.length > 0 ? Number(rows[0].times_served) || 0 : 0;
    } catch (err) {
      console.error('[learning-object-catalog-pg] exposureCount failed, returning 0:', (err as Error).message);
      return 0;
    }
  }
}

let _instance: PgLearningObjectCatalog | null = null;

/** Singleton accessor — mirrors `getStudentModel()` / `getTeacherQueueRepo()`. */
export function getLearningObjectCatalog(): LearningObjectCatalog {
  if (!_instance) _instance = new PgLearningObjectCatalog();
  return _instance;
}
