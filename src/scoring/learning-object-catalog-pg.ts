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
 * Wave 8 (migration 032) added NULLABLE marking columns: `question_type`
 * ('mcq'|'msq'|'nat'), `marks`, `answer_index`, `answer_indices`,
 * `answer_range` (033 added `options` — the canonical ordered option
 * list the answer indices refer to). When present and valid they are
 * threaded through
 * `payload` (questionType / marks / answerIndex / answerIndices /
 * answerRange) so readiness-routes' attachMarking() can resolve real GATE
 * marking via deterministic-scorer's describeMarking(). When NULL (all
 * pre-032 rows, and any generator not yet emitting marking) nothing is
 * threaded — the API attaches no marking rather than a fabricated guess.
 *
 * Honest gaps remaining in this table vs. `LearningObject` / `CatalogQuery`:
 *   - `question_type` does not change ObjectType: every row is still
 *     surfaced as 'practice' (the only teaching modality this table backs;
 *     mcq/msq/nat are marking shapes, not modalities).
 *   - `marks` is threaded as payload.marks; payload.maxMarks keeps its
 *     `DEFAULT_MAX_MARKS` fallback when `marks` is NULL.
 *   - No `estimated_time` / minutes column                    → defaults to
 *     `DEFAULT_EST_MINUTES`.
 *   - No `exam_relevance` column                              → defaults to
 *     `DEFAULT_EXAM_RELEVANCE`; the ProtoCATSelector reads this from
 *     `payload.examRelevance` (see proto-cat-selector.ts), so it's threaded
 *     through the payload rather than dropped.
 *   - `difficulty` is a 0..1 FLOAT, not the Elo scale (`800..2200`) the
 *     rest of the readiness stack uses (see `expectedSuccess`/`eloFromSuccess`
 *     in src/gbrain/elo.ts). `difficultyToElo` (src/scoring/difficulty-elo.ts
 *     — shared with `FileLearningObjectCatalog`, T21) linearly rescales
 *     0..1 → 800..2200 so `ProtoCATSelector`'s `diffMin`/`diffMax`
 *     (already Elo-scale) filter correctly against this table without
 *     every caller re-deriving the map.
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

import type pg from 'pg';
import { FileLearningObjectCatalog } from './learning-object-catalog-file';
import { CompositeLearningObjectCatalog } from './learning-object-catalog-composite';
import { difficultyToElo, eloToDifficultyBounds, DEFAULT_EXAM_RELEVANCE } from './difficulty-elo';
import type { LearningObject, ObjectType } from '../core/interfaces';
import type { CatalogQuery, LearningObjectCatalog } from './learning-object-catalog';
import { getSharedPool } from '../storage/pool';

/** Defaults used where `generated_problems` has no corresponding column. */
export const DEFAULT_MAX_MARKS = 4;
export const DEFAULT_EST_MINUTES = 3;
export { DEFAULT_EXAM_RELEVANCE };

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
  /** Migration 032 marking columns — absent (undefined) on pre-032 deploys, NULL on unmarked rows. */
  question_type?: string | null;
  marks?: number | null;
  answer_index?: number | null;
  answer_indices?: unknown;
  answer_range?: unknown;
  /** Migration 033: canonical ordered option list for mcq/msq. */
  options?: unknown;
}

const GATE_KINDS = new Set(['mcq', 'msq', 'nat']);

/**
 * Extract the migration-032 marking fields from a row, validating shape.
 * Returns {} unless BOTH question_type and marks are present and valid —
 * a half-marked row is treated as unmarked (never guess the other half).
 * Exported for tests.
 */
export function markingPayloadFromRow(r: GeneratedProblemRow): Record<string, unknown> {
  const kind = r.question_type;
  const marks = r.marks;
  if (!kind || !GATE_KINDS.has(kind) || typeof marks !== 'number' || !(marks > 0)) return {};
  const out: Record<string, unknown> = { questionType: kind, marks };
  if ((kind === 'mcq' || kind === 'msq') && Array.isArray(r.options) && r.options.length > 0) {
    out.options = r.options;
  }
  if (kind === 'mcq' && typeof r.answer_index === 'number' && r.answer_index >= 0) {
    out.answerIndex = r.answer_index;
  }
  if (kind === 'msq' && Array.isArray(r.answer_indices)
      && r.answer_indices.every(i => typeof i === 'number' && i >= 0)) {
    out.answerIndices = r.answer_indices;
  }
  if (kind === 'nat' && Array.isArray(r.answer_range) && r.answer_range.length === 2
      && r.answer_range.every(n => typeof n === 'number')) {
    out.answerRange = r.answer_range;
  }
  return out;
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
      maxMarks: typeof r.marks === 'number' && r.marks > 0 ? r.marks : DEFAULT_MAX_MARKS,
      examRelevance: DEFAULT_EXAM_RELEVANCE,
      verificationMethod: r.verification_method,
      timesServed: r.times_served,
      ...markingPayloadFromRow(r),
    },
  };
}

export class PgLearningObjectCatalog implements LearningObjectCatalog {
  private pool: pg.Pool | null;

  constructor() {
    // T16 (D4 / OV2 #10): was its own dedicated `new Pool({max:5})` — now
    // the one shared pool (src/storage/pool.ts). No DATABASE_URL → no
    // pool at all. Every method short-circuits to the empty-catalog
    // response without ever attempting a connection.
    this.pool = getSharedPool();
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
      // SELECT * on purpose: the migration-032 marking columns are read
      // when present, but a deploy that hasn't run 032 yet must NOT lose
      // the whole catalog to a "column does not exist" error. Unknown
      // extra columns are ignored by rowToLearningObject.
      const { rows } = await this.pool.query<GeneratedProblemRow>(
        `SELECT *
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

  async getById(objectId: string): Promise<LearningObject | null> {
    if (!this.pool) return null;
    try {
      const { rows } = await this.pool.query<GeneratedProblemRow>(
        'SELECT * FROM generated_problems WHERE id = $1',
        [objectId],
      );
      return rows.length > 0 ? rowToLearningObject(rows[0]) : null;
    } catch (err) {
      console.error('[learning-object-catalog-pg] getById failed, returning null:', (err as Error).message);
      return null;
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

let _instance: LearningObjectCatalog | null = null;

/**
 * Singleton accessor — mirrors `getStudentModel()` / `getTeacherQueueRepo()`.
 *
 * T21 (outside-voice amendment 1, docs/designs/linear-algebra-realtime-and-
 * math-academy-plan.md): this used to be strictly file-XOR-pg on
 * DATABASE_URL — with a database configured, the 3 (soon 123+) committed
 * items in data/practice-items/ became invisible, because the pg catalog
 * only ever reads `generated_problems`. D4 (set DATABASE_URL on the demo
 * deploy) would have made every authored item unservable. With
 * DATABASE_URL set, both sources are composed instead: file items stay
 * the source of truth for authored content on every deploy shape, and a
 * generated_problems row wins only on an actual id collision.
 */
export function getLearningObjectCatalog(): LearningObjectCatalog {
  if (_instance) return _instance;
  // No DATABASE_URL means the pg catalog can only ever return nothing, so
  // there is nothing to compose with — the file catalog IS the catalog.
  _instance = process.env.DATABASE_URL
    ? new CompositeLearningObjectCatalog(new FileLearningObjectCatalog(), new PgLearningObjectCatalog())
    : new FileLearningObjectCatalog();
  return _instance;
}

/** Test seam — drops the memoised catalog so env changes take effect. */
export function __resetCatalogForTests(): void {
  _instance = null;
}
