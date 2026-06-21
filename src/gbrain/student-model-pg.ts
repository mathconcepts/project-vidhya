/**
 * src/gbrain/student-model-pg.ts — concrete StudentModel backed by Postgres.
 *
 * Phase 3 of the 100x Blueprint (the second deferred-now-shipped item).
 * Wires Elo (§3.1) + FSRS (§3.4) + the attempt-dedup primitive
 * (§3.1 guardrail) to actual database rows from migrations 029 / 030.
 *
 * Implements the `StudentModel` contract from src/core/interfaces.ts:
 *   - abilityFor(student, skill)   → reads/initializes student_skill_elo
 *   - retrievability(student, obj) → reads/derives from fsrs_cards
 *   - masteryState(student, skill) → derives from ability + n
 *   - errorProfile(student)        → aggregates Attempt.errorTags
 *                                    (in-memory window; full impl Phase 4)
 *   - update(attempt)              → atomic Elo + FSRS apply, dedup-guarded
 *
 * `update()` is IDEMPOTENT on (studentId, objectId, ts) — duplicate
 * attempts are dropped at the dedup primary key, never double-counted.
 * This closes the §3.1 guardrail that Elo's stateful math demands.
 *
 * Telemetry: every `update()` that lands publishes an `attempt.recorded`
 * event on the in-process bus, so the calibration store, monitoring,
 * and any future student-facing event surface can subscribe without
 * the student model knowing about them (§5.8).
 */

import pg from 'pg';
import {
  applyAttempt,
  newItemDifficulty,
  newStudentAbility,
  toAbility,
  CONFIDENT_N,
} from './elo';
import {
  initCard,
  reviewCard,
  recallProbability,
  ratingFromAttempt,
  type FsrsCard,
  type Rating,
} from './fsrs';
import type {
  Ability,
  Attempt,
  ErrorTag,
  ErrorTypeWeights,
  MasteryState,
  ObjectId,
  SkillId,
  StudentId,
  StudentModel,
} from '../core/interfaces';
import { publishAttemptRecorded } from '../events/attempts-bus';

const { Pool } = pg;

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool {
  if (_pool) return _pool;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return _pool;
}

// ────────────────────────────────────────────────────────────────────
// Mastery thresholds — locked here so the cockpit interpretation
// can't drift. Tuned to Elo's K=32: ~5-10 attempts at the right
// difficulty is enough to move from learning → practicing.
// ────────────────────────────────────────────────────────────────────

const MASTERY_THRESHOLDS = {
  notStartedN: 1,        // <1 attempt
  learningN: 5,          // <5 attempts → still learning
  practicingRating: 1400,
  masteredRating: 1700,
  atRiskRetrievability: 0.5,   // FSRS recall <0.5 on a once-mastered skill
};

// ────────────────────────────────────────────────────────────────────
// Implementation
// ────────────────────────────────────────────────────────────────────

export class PgStudentModel implements StudentModel {
  async abilityFor(studentId: StudentId, skillId: SkillId): Promise<Ability> {
    const { rows } = await getPool().query(
      'SELECT rating, n FROM student_skill_elo WHERE student_id = $1 AND skill_id = $2',
      [studentId, skillId],
    );
    if (rows.length === 0) {
      return toAbility(newStudentAbility(studentId, skillId));
    }
    const { rating, n } = rows[0];
    return { rating: Number(rating), confidence: Math.min(1, Number(n) / (Number(n) + CONFIDENT_N / 2)), n: Number(n) };
  }

  async masteryState(studentId: StudentId, skillId: SkillId): Promise<MasteryState> {
    const ability = await this.abilityFor(studentId, skillId);
    if (ability.n < MASTERY_THRESHOLDS.notStartedN) return 'not-started';
    if (ability.n < MASTERY_THRESHOLDS.learningN) return 'learning';

    // Look at how this skill's recent FSRS cards are doing — an at-risk
    // skill is one whose memory is leaking even though the ability is good.
    const { rows: cards } = await getPool().query(
      `SELECT stability, last_review_at
         FROM fsrs_cards
        WHERE student_id = $1 AND object_id IN (
          SELECT id FROM objects_for_skill($2)
        )`,
      [studentId, skillId],
    ).catch(() => ({ rows: [] as any[] }));   // tolerate missing helper view

    if (ability.rating >= MASTERY_THRESHOLDS.masteredRating) {
      // Check whether any cards' recall has decayed below threshold.
      const now = new Date();
      for (const c of cards) {
        const card: FsrsCard = {
          stability: Number(c.stability),
          difficulty: 5,
          lastReviewAt: (c.last_review_at instanceof Date ? c.last_review_at : new Date(c.last_review_at)).toISOString(),
          reps: 0, lapses: 0,
          dueAt: new Date().toISOString(),
        };
        if (recallProbability(card, now) < MASTERY_THRESHOLDS.atRiskRetrievability) {
          return 'at-risk';
        }
      }
      return 'mastered';
    }
    if (ability.rating >= MASTERY_THRESHOLDS.practicingRating) return 'practicing';
    return 'learning';
  }

  async retrievability(studentId: StudentId, objectId: ObjectId): Promise<number> {
    const { rows } = await getPool().query(
      'SELECT stability, last_review_at FROM fsrs_cards WHERE student_id = $1 AND object_id = $2',
      [studentId, objectId],
    );
    if (rows.length === 0) return 0;          // never seen → assume forgotten
    const card: FsrsCard = {
      stability: Number(rows[0].stability),
      difficulty: 5,
      lastReviewAt: (rows[0].last_review_at instanceof Date ? rows[0].last_review_at : new Date(rows[0].last_review_at)).toISOString(),
      reps: 0, lapses: 0,
      dueAt: new Date().toISOString(),
    };
    return recallProbability(card);
  }

  async errorProfile(studentId: StudentId): Promise<ErrorTypeWeights> {
    // Phase 3 shape: aggregates recent error tags from attempts persisted
    // by the cockpit-facing attempts log. When that log isn't yet wired,
    // we return an empty profile — interface contract is upheld.
    try {
      const { rows } = await getPool().query(
        `SELECT error_tag, COUNT(*) AS n
           FROM attempt_error_tags
          WHERE student_id = $1 AND recorded_at > now() - interval '30 days'
          GROUP BY error_tag`,
        [studentId],
      );
      const weights: Partial<Record<ErrorTag, number>> = {};
      let n = 0;
      for (const r of rows) {
        weights[r.error_tag as ErrorTag] = Number(r.n);
        n += Number(r.n);
      }
      // normalize to rates
      for (const k of Object.keys(weights) as ErrorTag[]) {
        weights[k] = Number(weights[k]) / Math.max(1, n);
      }
      // dominant = error type with highest weight, IF it's >= 1.5× the next
      const entries = Object.entries(weights).sort((a, b) => Number(b[1]) - Number(a[1]));
      let dominant: ErrorTag | undefined;
      if (entries.length >= 1 && (entries[1] === undefined || Number(entries[0][1]) >= 1.5 * Number(entries[1][1]))) {
        dominant = entries[0][0] as ErrorTag;
      }
      return { weights, n, dominant };
    } catch {
      return { weights: {}, n: 0 };
    }
  }

  async update(attempt: Attempt): Promise<void> {
    const pool = getPool();
    // ── idempotency ─────────────────────────────────────────────────
    // INSERT ON CONFLICT DO NOTHING; xmax = 0 means we did the insert.
    const dedupResult = await pool.query(
      `INSERT INTO attempt_dedup (student_id, object_id, ts_ms)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING student_id`,
      [attempt.studentId, attempt.objectId, attempt.ts],
    );
    if (dedupResult.rowCount === 0) {
      // already-processed duplicate — silently ignore
      return;
    }

    // ── Elo update (joint student × item) ────────────────────────────
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const sRes = await client.query(
        'SELECT rating, n FROM student_skill_elo WHERE student_id = $1 AND skill_id = $2 FOR UPDATE',
        [attempt.studentId, attempt.skillId],
      );
      const sState = sRes.rows.length
        ? { studentId: attempt.studentId, skillId: attempt.skillId, rating: Number(sRes.rows[0].rating), n: Number(sRes.rows[0].n) }
        : newStudentAbility(attempt.studentId, attempt.skillId);

      const iRes = await client.query(
        'SELECT rating, n FROM item_difficulty_elo WHERE object_id = $1 AND skill_id = $2 FOR UPDATE',
        [attempt.objectId, attempt.skillId],
      );
      const iState = iRes.rows.length
        ? { objectId: attempt.objectId, skillId: attempt.skillId, rating: Number(iRes.rows[0].rating), n: Number(iRes.rows[0].n) }
        : newItemDifficulty(attempt.objectId, attempt.skillId);

      applyAttempt(sState, iState, attempt.correct);

      await client.query(
        `INSERT INTO student_skill_elo (student_id, skill_id, rating, n, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (student_id, skill_id)
         DO UPDATE SET rating = EXCLUDED.rating, n = EXCLUDED.n, updated_at = now()`,
        [sState.studentId, sState.skillId, sState.rating, sState.n],
      );
      await client.query(
        `INSERT INTO item_difficulty_elo (object_id, skill_id, rating, n, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (object_id, skill_id)
         DO UPDATE SET rating = EXCLUDED.rating, n = EXCLUDED.n, updated_at = now()`,
        [iState.objectId, iState.skillId, iState.rating, iState.n],
      );

      // ── FSRS card update ────────────────────────────────────────────
      const rating: Rating = ratingFromAttempt(attempt.correct, attempt.latencyMs / 1000);
      const now = new Date(attempt.ts);

      const cRes = await client.query(
        'SELECT stability, difficulty, last_review_at, reps, lapses, due_at FROM fsrs_cards WHERE student_id = $1 AND object_id = $2 FOR UPDATE',
        [attempt.studentId, attempt.objectId],
      );
      let card: FsrsCard;
      if (cRes.rows.length === 0) {
        card = initCard(rating, now);
      } else {
        const row = cRes.rows[0];
        const existing: FsrsCard = {
          stability: Number(row.stability),
          difficulty: Number(row.difficulty),
          lastReviewAt: (row.last_review_at instanceof Date ? row.last_review_at : new Date(row.last_review_at)).toISOString(),
          reps: Number(row.reps),
          lapses: Number(row.lapses),
          dueAt: (row.due_at instanceof Date ? row.due_at : new Date(row.due_at)).toISOString(),
        };
        card = reviewCard(existing, rating, now).card;
      }
      await client.query(
        `INSERT INTO fsrs_cards (student_id, object_id, stability, difficulty, last_review_at, due_at, reps, lapses)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (student_id, object_id)
         DO UPDATE SET stability = EXCLUDED.stability,
                       difficulty = EXCLUDED.difficulty,
                       last_review_at = EXCLUDED.last_review_at,
                       due_at = EXCLUDED.due_at,
                       reps = EXCLUDED.reps,
                       lapses = EXCLUDED.lapses`,
        [attempt.studentId, attempt.objectId, card.stability, card.difficulty,
         card.lastReviewAt, card.dueAt, card.reps, card.lapses],
      );

      // ── persist error tags (best-effort; table may not exist in older deploys)
      if (attempt.errorTags && attempt.errorTags.length > 0) {
        await client.query(
          `INSERT INTO attempt_error_tags (student_id, object_id, ts_ms, error_tag, recorded_at)
           SELECT $1, $2, $3, unnest($4::text[]), now()
           ON CONFLICT DO NOTHING`,
          [attempt.studentId, attempt.objectId, attempt.ts, attempt.errorTags],
        ).catch(() => { /* table optional */ });
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    // ── telemetry (post-commit so subscribers see persisted state) ──
    publishAttemptRecorded(attempt);
  }
}

let _instance: PgStudentModel | null = null;
export function getStudentModel(): StudentModel {
  if (!_instance) _instance = new PgStudentModel();
  return _instance;
}
