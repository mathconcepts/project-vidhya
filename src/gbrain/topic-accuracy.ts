/**
 * src/gbrain/topic-accuracy.ts — per-topic graded-attempt evidence, read
 * from `attempt_facts` (migration 051). Plan W3.2.
 *
 * The counterfactual can only price a SKIP if it knows what the student
 * would likely have scored on that topic. That number has to come from
 * measured attempts, not from a mastery estimate — a mastery vector is a
 * model output, and "you get 62% of eigenvalue questions right" is a claim
 * about what actually happened.
 *
 * ── Why the topic comes from a join ──────────────────────────────────────
 *
 * `attempt_facts` deliberately stores `skill_id` (a concept id) and NOT a
 * topic, and mock-exam grading writes `skill_id: null` because a mock
 * question carries only the coarse `topic` column. So attempt_facts alone
 * cannot answer a topic question today. The topic lives on the two tables
 * the object ids come from — `pyq_questions.topic` and
 * `generated_problems.topic` — so this reads it with one LEFT JOIN of
 * each. Both are the SAME id space attempt_facts.object_id is written
 * from, so a row that matches neither is an object from some other source
 * and is dropped rather than bucketed into a made-up topic.
 *
 * ── "Correct" is `marks_earned > 0` ──────────────────────────────────────
 *
 * Under this exam's marking a positive award means correct for every
 * question kind: MCQ wrong goes negative, MSQ and NAT wrong award exactly
 * 0, and nothing awards partial credit. That equivalence is the reason
 * this can be counted in SQL instead of re-deriving correctness.
 *
 * Skipped rows are excluded from BOTH counts: a skip is not evidence about
 * accuracy, and counting it as a miss would make the very behaviour the
 * counterfactual is trying to correct look statistically justified.
 *
 * DB-less returns `{}` — the caller omits every skip line rather than
 * inventing one. A query failure does the same, loudly: the topic rows are
 * evidence, and "we could not read your history" must never render as
 * "you have no history".
 */

import { getSharedPool } from '../storage/pool';
import type { TopicEvidence } from '../readiness/attempt-counterfactual';

/** Bounded: a student with a long history still costs one indexed scan. */
const TOPIC_ACCURACY_LOOKBACK_DAYS = 180;

const SQL = `
  SELECT COALESCE(p.topic, g.topic) AS topic,
         COUNT(*)::int AS attempted,
         COUNT(*) FILTER (WHERE af.marks_earned > 0)::int AS correct
  FROM attempt_facts af
  LEFT JOIN pyq_questions p ON p.id::text = af.object_id
  LEFT JOIN generated_problems g ON g.id::text = af.object_id
  WHERE af.student_id = $1
    AND af.skipped = FALSE
    AND af.marks_earned IS NOT NULL
    AND af.ts_ms >= $2
    AND COALESCE(p.topic, g.topic) IS NOT NULL
  GROUP BY 1`;

/**
 * Graded, non-skipped attempts per topic for one student. Never throws.
 */
export async function getTopicAccuracy(
  studentId: string,
  nowMs: number = Date.now(),
): Promise<Record<string, TopicEvidence>> {
  const pool = getSharedPool();
  if (!pool) return {};

  const sinceMs = nowMs - TOPIC_ACCURACY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  try {
    const { rows } = await pool.query<{ topic: string; attempted: number; correct: number }>(
      SQL,
      [studentId, sinceMs],
    );
    const out: Record<string, TopicEvidence> = {};
    for (const r of rows) {
      if (!r.topic) continue;
      out[r.topic] = { attempted: Number(r.attempted) || 0, correct: Number(r.correct) || 0 };
    }
    return out;
  } catch (err) {
    console.error(
      `[topic-accuracy] read failed for student=${studentId} (skip lines will be omitted, not estimated):`,
      (err as Error)?.message ?? err,
    );
    return {};
  }
}
