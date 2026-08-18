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
import { downClosureFor, upClosureFor, computeImplicitReviews } from './fire';

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

export const MASTERY_THRESHOLDS = {
  notStartedN: 1,        // <1 attempt
  // T4 (Milestone A): was 5. content-gate.ts:67-69 and syllabus-context.ts:124
  // both treat 'not-started' | 'learning' as BLOCKING a prereq edge, so with
  // a thin catalog (few items per skill) a threshold of 5 meant every prereq
  // stayed locked for most students most of the time — every eligible node
  // deadlocked back to the fallback set. Lowered to 2: still "at least one
  // real attempt beyond the first" before a skill is presumed learned enough
  // to unblock what depends on it, but reachable with the catalog's actual
  // item density.
  learningN: 2,           // <2 attempts → still learning
  practicingRating: 1400,
  masteredRating: 1700,
  atRiskRetrievability: 0.5,   // FSRS recall <0.5 on a once-mastered skill
};

// ────────────────────────────────────────────────────────────────────
// Shared pure helper — the SAME derivation masteryState() and the batch
// masteryStates() both use, so the two paths can never drift. Thresholds
// unchanged (T4/A6 owns tuning those); this is purely an extraction.
// ────────────────────────────────────────────────────────────────────

export interface AbilitySnapshot {
  rating: number;
  n: number;
}

export interface CardSnapshot {
  stability: number;
  lastReviewAt: string;
}

export function deriveMasteryState(
  ability: AbilitySnapshot,
  cardsForSkill: ReadonlyArray<CardSnapshot>,
  now: Date,
): MasteryState {
  if (ability.n < MASTERY_THRESHOLDS.notStartedN) return 'not-started';
  if (ability.n < MASTERY_THRESHOLDS.learningN) return 'learning';

  if (ability.rating >= MASTERY_THRESHOLDS.masteredRating) {
    // Check whether any cards' recall has decayed below threshold — an
    // at-risk skill is one whose memory is leaking even though the
    // ability is good.
    for (const c of cardsForSkill) {
      const card: FsrsCard = {
        stability: c.stability,
        difficulty: 5,
        lastReviewAt: c.lastReviewAt,
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

/**
 * Optional capability seam: a `StudentModel` that can answer mastery for
 * MANY skills in a bounded number of round-trips. `SyllabusAwareReadinessEngine`
 * duck-types for this (see syllabus-aware-engine.ts's prefetchMastery) and
 * falls back to per-skill `masteryState()` calls when it's absent — every
 * other `StudentModel` implementation (test fakes included) keeps working
 * unchanged.
 */
export interface BatchMasteryStudentModel {
  masteryStates(studentId: StudentId, skillIds: ReadonlyArray<SkillId>): Promise<Map<SkillId, MasteryState>>;
}

// ────────────────────────────────────────────────────────────────────
// Implementation
// ────────────────────────────────────────────────────────────────────

export class PgStudentModel implements StudentModel, BatchMasteryStudentModel {
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
    // T4 (Milestone A): the 'at-risk' card query that used to live here hit
    // `SELECT id FROM objects_for_skill($2)` — a function that exists NOWHERE
    // in any migration — behind a swallowed `.catch()`, so cards were always
    // `[]` and 'at-risk' was unreachable dead code, not a real guardrail.
    // Deleted rather than backed by a real function: OV2-D5 supersedes it with
    // `fsrs_cards.skill_id TEXT` (written on every card upsert from
    // `attempt.skillId`), which gives a real per-skill card join. Until that
    // column lands (later lane), we pass no cards — deriveMasteryState's
    // at-risk loop stays dormant and a mastered skill reports 'mastered',
    // identical for the single and batch paths.
    return deriveMasteryState({ rating: ability.rating, n: ability.n }, [], new Date());
  }

  /**
   * Batch mastery lookup — T5/§7 perf fix. `eligibleNodes()` needs
   * `masteryState()` for up to ~140 (candidate × prereq) pairs per
   * request; called one-at-a-time that's 140 Pg round-trips. This does
   * it in exactly ONE query. Like `masteryState()` above, no per-skill
   * FSRS cards are fetched yet — the at-risk join needs
   * `fsrs_cards.skill_id` (OV2-D5, later lane); when that column lands,
   * both this method and `masteryState()` gain the same card fetch.
   */
  async masteryStates(studentId: StudentId, skillIds: ReadonlyArray<SkillId>): Promise<Map<SkillId, MasteryState>> {
    const result = new Map<SkillId, MasteryState>();
    if (skillIds.length === 0) return result;

    const { rows } = await getPool().query(
      'SELECT skill_id, rating, n FROM student_skill_elo WHERE student_id = $1 AND skill_id = ANY($2::text[])',
      [studentId, skillIds],
    );
    const abilityBySkill = new Map<SkillId, AbilitySnapshot>();
    for (const r of rows) {
      abilityBySkill.set(r.skill_id, { rating: Number(r.rating), n: Number(r.n) });
    }

    const now = new Date();
    for (const skillId of skillIds) {
      const ability = abilityBySkill.get(skillId) ?? { rating: newStudentAbility(studentId, skillId).rating, n: 0 };
      result.set(skillId, deriveMasteryState(ability, [], now));
    }
    return result;
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

    // ── Elo update (joint student × item) ────────────────────────────
    const client = await pool.connect();
    let deduped = false;
    try {
      await client.query('BEGIN');

      // ── idempotency (T6/ENG-D4.2: moved INSIDE the transaction) ────
      // Previously this INSERT ran on the pool, outside BEGIN/COMMIT: a
      // rolled-back attempt (e.g. the Elo/FSRS work below throwing) left
      // its dedup row committed anyway, permanently blocking every retry
      // of that (studentId, objectId, ts) — the row never came back even
      // though nothing else was ever persisted. Inside the tx, a ROLLBACK
      // undoes the dedup insert along with everything else, so a retry
      // with the same ts is not blocked.
      const dedupResult = await client.query(
        `INSERT INTO attempt_dedup (student_id, object_id, ts_ms)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING student_id`,
        [attempt.studentId, attempt.objectId, attempt.ts],
      );
      if (dedupResult.rowCount === 0) {
        // already-processed duplicate — commit the no-op tx and bail.
        await client.query('COMMIT');
        deduped = true;
        return;
      }

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
        `INSERT INTO fsrs_cards (student_id, object_id, stability, difficulty, last_review_at, due_at, reps, lapses, skill_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (student_id, object_id)
         DO UPDATE SET stability = EXCLUDED.stability,
                       difficulty = EXCLUDED.difficulty,
                       last_review_at = EXCLUDED.last_review_at,
                       due_at = EXCLUDED.due_at,
                       reps = EXCLUDED.reps,
                       lapses = EXCLUDED.lapses,
                       skill_id = EXCLUDED.skill_id`,
        [attempt.studentId, attempt.objectId, card.stability, card.difficulty,
         card.lastReviewAt, card.dueAt, card.reps, card.lapses, attempt.skillId],
      );

      // ── FIRe-lite propagation (T11/B2, gated VIDHYA_FIRE=on) ─────────
      // Always AFTER the primary card upsert above, and always inside the
      // same transaction (ENG-D1) — a partial propagation must roll back
      // with everything else, never leave the attempt "half applied".
      if (process.env.VIDHYA_FIRE === 'on') {
        await this.propagateFire(client, attempt, now);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    if (deduped) return;

    // ── persist error tags (T6/ENG-D4.2: moved AFTER COMMIT, best-effort) ──
    // Previously this ran INSIDE the transaction with a swallowed `.catch()`:
    // a failure here (e.g. table missing on an older deploy) aborted the
    // open Postgres transaction, so the subsequent COMMIT silently became a
    // ROLLBACK — Elo + FSRS writes were lost even though update() had
    // already reported success. Error tags are non-critical telemetry; they
    // now write best-effort after the attempt is durably committed, and a
    // failure here is LOGGED (not silently swallowed) rather than able to
    // touch the primary write path at all.
    if (attempt.errorTags && attempt.errorTags.length > 0) {
      try {
        await pool.query(
          `INSERT INTO attempt_error_tags (student_id, object_id, ts_ms, error_tag, recorded_at)
           SELECT $1, $2, $3, unnest($4::text[]), now()
           ON CONFLICT DO NOTHING`,
          [attempt.studentId, attempt.objectId, attempt.ts, attempt.errorTags],
        );
      } catch (err) {
        console.error(
          `[student-model-pg] best-effort error-tag persist failed for student=${attempt.studentId} object=${attempt.objectId}:`,
          err,
        );
      }
    }

    // ── telemetry (post-commit so subscribers see persisted state) ──
    publishAttemptRecorded(attempt);
  }

  /**
   * T11/B2: FIRe-lite propagation. Runs INSIDE the caller's open
   * transaction, strictly after the primary attempted card's upsert
   * (OV2-D6 lock-order discipline: student-elo → item-elo → primary card
   * → FIRe). Fetches existing cards for the closure concepts with a
   * deterministic `ORDER BY object_id` lock order so concurrent attempts
   * can't deadlock, applies `computeImplicitReviews` (pure, src/gbrain/fire.ts)
   * per row, and writes every change back in ONE batched UPDATE.
   *
   * The attempted card itself is excluded (its skill_id is never in its
   * own closure — `buildEncompassingClosure` excludes the start concept —
   * and the `object_id != $3` filter below is a second, defensive guard
   * against ever touching it here).
   */
  private async propagateFire(client: pg.PoolClient, attempt: Attempt, now: Date): Promise<void> {
    const closure = attempt.correct ? downClosureFor(attempt.skillId) : upClosureFor(attempt.skillId);
    if (closure.size === 0) return; // no encompassing edges — non-LA concepts are a no-op

    const closureSkillIds = [...closure.keys()];
    const rowsRes = await client.query(
      `SELECT object_id, skill_id, stability, difficulty, last_review_at, reps, lapses, due_at
         FROM fsrs_cards
        WHERE student_id = $1 AND skill_id = ANY($2::text[]) AND object_id != $3
        ORDER BY object_id
        FOR UPDATE`,
      [attempt.studentId, closureSkillIds, attempt.objectId],
    );
    if (rowsRes.rows.length === 0) return; // no existing cards to nudge — no-op

    const objectIds: string[] = [];
    const stabilities: number[] = [];
    const dueAts: string[] = [];

    for (const row of rowsRes.rows) {
      const card: FsrsCard = {
        stability: Number(row.stability),
        difficulty: Number(row.difficulty),
        lastReviewAt: (row.last_review_at instanceof Date ? row.last_review_at : new Date(row.last_review_at)).toISOString(),
        reps: Number(row.reps),
        lapses: Number(row.lapses),
        dueAt: (row.due_at instanceof Date ? row.due_at : new Date(row.due_at)).toISOString(),
      };
      // One-entry map: the credit for `row.skill_id` is looked up from the
      // real closure regardless of how many physical cards share it — the
      // SAME per-concept credit is applied to EACH of that concept's cards
      // (not split across them; see fire.ts's granularity doc comment).
      const singleCardMap = new Map<string, FsrsCard>([[row.skill_id, card]]);
      const [result] = computeImplicitReviews(
        { skillId: attempt.skillId, correct: attempt.correct },
        singleCardMap,
        now,
      );
      if (!result) continue;
      objectIds.push(row.object_id);
      stabilities.push(result.newCard.stability);
      dueAts.push(result.newCard.dueAt);
    }

    if (objectIds.length === 0) return;

    await client.query(
      `UPDATE fsrs_cards AS f
          SET stability = u.stability,
              due_at = u.due_at::timestamptz
         FROM unnest($2::text[], $3::float8[], $4::text[]) AS u(object_id, stability, due_at)
        WHERE f.student_id = $1 AND f.object_id = u.object_id`,
      [attempt.studentId, objectIds, stabilities, dueAts],
    );
  }
}

let _instance: PgStudentModel | null = null;
export function getStudentModel(): StudentModel {
  if (!_instance) _instance = new PgStudentModel();
  return _instance;
}
