/**
 * src/scoring/teacher-queue-pg.ts — Postgres-backed TeacherQueueRepo.
 *
 * Persists low-confidence rubric grades to the `grading_reviews` table
 * (migration 029). Implementation hugs the same shape as the existing
 * `src/gbrain/student-model.ts` repo: lazy single-pool, async pg.Pool
 * via DATABASE_URL.
 *
 * The pure-function aggregators (`summarizeQueue`, `formatCalibrationSample`)
 * live in `teacher-queue.ts` and operate on rows this module returns.
 */

import pg from 'pg';
import { randomUUID } from 'crypto';
import type { GradingReview, TeacherQueueRepo, ReviewStatus } from './teacher-queue';
import type { GradeResult } from '../core/interfaces';

const { Pool } = pg;

let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
  });
  return _pool;
}

// ────────────────────────────────────────────────────────────────────
// Row → domain mapping. The `proposed_grade` / `final_grade` columns are
// JSONB; pg returns them as parsed objects already.
// ────────────────────────────────────────────────────────────────────

function rowToReview(r: any): GradingReview {
  return {
    id: r.id,
    studentId: r.student_id ?? null,
    itemId: r.item_id,
    studentResponse: r.student_response,
    proposedGrade: r.proposed_grade as GradeResult,
    finalGrade: (r.final_grade ?? undefined) as GradeResult | undefined,
    status: r.status as ReviewStatus,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    reviewedAt: r.reviewed_at
      ? (r.reviewed_at instanceof Date ? r.reviewed_at.toISOString() : String(r.reviewed_at))
      : undefined,
    reviewerId: r.reviewer_id ?? undefined,
    reviewerNotes: r.reviewer_notes ?? undefined,
  };
}

// ────────────────────────────────────────────────────────────────────
// Implementation
// ────────────────────────────────────────────────────────────────────

export class PgTeacherQueueRepo implements TeacherQueueRepo {
  async enqueue(
    review: Omit<GradingReview, 'id' | 'createdAt' | 'status'>
  ): Promise<GradingReview> {
    const id = `gr_${randomUUID()}`;
    const pool = getPool();
    const { rows } = await pool.query(
      `INSERT INTO grading_reviews
         (id, student_id, item_id, student_response, proposed_grade, final_grade, reviewer_notes, status)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, 'pending')
       RETURNING *`,
      [
        id,
        review.studentId ?? null,
        review.itemId,
        review.studentResponse,
        JSON.stringify(review.proposedGrade),
        review.finalGrade ? JSON.stringify(review.finalGrade) : null,
        review.reviewerNotes ?? null,
      ],
    );
    return rowToReview(rows[0]);
  }

  async list(opts: { status?: ReviewStatus; limit?: number } = {}): Promise<GradingReview[]> {
    const limit = Math.max(1, Math.min(500, opts.limit ?? 100));
    const pool = getPool();
    const sql = opts.status
      ? `SELECT * FROM grading_reviews WHERE status = $1 ORDER BY created_at DESC LIMIT $2`
      : `SELECT * FROM grading_reviews ORDER BY created_at DESC LIMIT $1`;
    const params = opts.status ? [opts.status, limit] : [limit];
    const { rows } = await pool.query(sql, params);
    return rows.map(rowToReview);
  }

  async resolve(
    id: string,
    decision: {
      status: 'confirmed' | 'corrected' | 'dismissed';
      finalGrade?: GradeResult;
      reviewerId: string;
      reviewerNotes?: string;
    },
  ): Promise<GradingReview> {
    const pool = getPool();
    const { rows } = await pool.query(
      `UPDATE grading_reviews
          SET status = $2,
              final_grade = $3::jsonb,
              reviewer_id = $4,
              reviewer_notes = COALESCE($5, reviewer_notes),
              reviewed_at = now()
        WHERE id = $1 AND status = 'pending'
        RETURNING *`,
      [
        id,
        decision.status,
        decision.finalGrade ? JSON.stringify(decision.finalGrade) : null,
        decision.reviewerId,
        decision.reviewerNotes ?? null,
      ],
    );
    if (rows.length === 0) {
      throw new Error(`grading_reviews row ${id} not found or already resolved`);
    }
    return rowToReview(rows[0]);
  }

  async calibrationSamples(limit = 50): Promise<GradingReview[]> {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT * FROM grading_reviews
        WHERE status IN ('confirmed','corrected')
        ORDER BY reviewed_at DESC NULLS LAST
        LIMIT $1`,
      [Math.max(1, Math.min(500, limit))],
    );
    return rows.map(rowToReview);
  }
}

let _instance: PgTeacherQueueRepo | null = null;
export function getTeacherQueueRepo(): TeacherQueueRepo {
  if (!_instance) _instance = new PgTeacherQueueRepo();
  return _instance;
}
