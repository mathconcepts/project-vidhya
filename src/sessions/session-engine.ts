// @ts-nocheck
/**
 * Session Engine — exam-agnostic adaptive session builder
 *
 * Takes a session_id + exam_id and returns a StudymateSession of N problems.
 * Reads from the file-based curriculum system (src/curriculum/) and the
 * student model (GBrain). No hardcoded exam logic.
 *
 * Ranking formula:
 *   score = SR_decay×0.30 + error_rate×0.30 + exam_weight×0.15
 *         + prereq_gate×0.15 + motivation_boost×0.10
 *
 * Cold-start (no history): SR_decay=1.0, error_rate=0.5.
 * If /onboard mastery_vector is seeded, it is used instead.
 */

import pg from 'pg';
import { getOrCreateStudentModel } from '../gbrain/student-model';
import { getConceptsInExam, getConceptLink, depthToMaxDifficulty } from '../curriculum/concept-exam-map';
import { loadAllExams } from '../curriculum/exam-loader';

const { Pool } = pg;

export interface SessionProblem {
  problem_id: string;
  concept_id: string;
  topic: string;
  difficulty: number;
  question: string;
  expected_answer: string;
  source: string;
  source_url?: string;
}

export interface StudymateSession {
  id: string;
  session_id: string;
  exam_id: string;
  session_type: 'daily' | 'targeted' | 'review';
  state: string;
  problem_count: number;
  current_index: number;
  problems: SessionProblem[];
  frustration_mode: boolean;
}

// Ranking weights — tuned via deploy once experiment data is available.
const W = {
  sr_decay: 0.30,
  error_rate: 0.30,
  exam_weight: 0.15,
  prereq_gate: 0.15,
  motivation_boost: 0.10,
} as const;

const FRUSTRATION_STATES = new Set(['frustrated', 'anxious', 'flagging']);
const FRUSTRATION_PROBLEM_COUNT = 3;
const DEFAULT_PROBLEM_COUNT = 5;
const RESUME_WINDOW_HOURS = 4;

function getPool(): Pool {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

interface ConceptScore {
  concept_id: string;
  score: number;
  exam_weight: number;
  max_difficulty: number;
}

function rankConcepts(
  conceptIds: string[],
  examId: string,
  masteryVector: Record<string, any>,
  prerequisiteAlerts: Array<{ concept: string; severity: string }>,
  motivationState: string,
  isFrustrated: boolean,
): ConceptScore[] {
  const criticalAlerts = new Set(
    prerequisiteAlerts
      .filter(a => a.severity === 'critical')
      .map(a => a.concept)
  );

  return conceptIds
    .filter(id => !criticalAlerts.has(id))
    .map(id => {
      const link = getConceptLink(id, examId);
      if (!link) return null;

      const mastery = masteryVector[id];
      const attempts = mastery?.attempts ?? 0;
      const correct = mastery?.correct ?? 0;
      const lastUpdate = mastery?.last_update
        ? new Date(mastery.last_update)
        : null;

      // SR_decay: days overdue / SR interval; cold-start = 1.0
      const daysSince = lastUpdate
        ? (Date.now() - lastUpdate.getTime()) / 86_400_000
        : Infinity;
      const srDecay = Math.min(1.0, attempts === 0 ? 1.0 : daysSince / 7);

      // error_rate: wrong / total; cold-start = 0.5
      const errorRate = attempts === 0 ? 0.5 : 1 - correct / attempts;

      const examWeight = link.weight;

      // prereq_gate: 0 if concept blocked by critical alert (already filtered), else 1 → gives 0.15 bonus
      const prereqGate = 1;

      // motivation_boost: confidence-builders score higher when frustrated
      const motivationBoost = isFrustrated ? 0.1 : 0;

      const score =
        srDecay * W.sr_decay +
        errorRate * W.error_rate +
        examWeight * W.exam_weight +
        prereqGate * W.prereq_gate +
        motivationBoost * W.motivation_boost;

      return {
        concept_id: id,
        score,
        exam_weight: examWeight,
        max_difficulty: depthToMaxDifficulty(link.depth),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

async function fetchProblemsForConcept(
  pool: Pool,
  conceptId: string,
  maxDifficulty: number,
  isFrustrated: boolean,
  excludeIds: Set<string>,
): Promise<SessionProblem | null> {
  const effectiveMax = isFrustrated ? maxDifficulty * 0.5 : maxDifficulty;

  const { rows } = await pool.query<{
    id: string; topic: string; difficulty: number;
    question: string; expected_answer: string; source: string; source_url?: string;
  }>(
    `SELECT id, topic, difficulty, question, expected_answer, source, source_url
     FROM pyq_questions
     WHERE concept_id = $1
       AND difficulty <= $2
       AND id != ALL($3::uuid[])
     ORDER BY RANDOM()
     LIMIT 1`,
    [conceptId, effectiveMax, [...excludeIds]]
  );

  if (!rows[0]) return null;
  const r = rows[0];
  return {
    problem_id: r.id,
    concept_id: conceptId,
    topic: r.topic,
    difficulty: r.difficulty,
    question: r.question,
    expected_answer: r.expected_answer,
    source: r.source,
    source_url: r.source_url,
  };
}

export async function buildSession(
  sessionId: string,
  examId: string,
  sessionType: 'daily' | 'targeted' | 'review' = 'daily',
): Promise<StudymateSession> {
  const pool = getPool();
  try {
    const model = await getOrCreateStudentModel(sessionId);
    const isFrustrated = FRUSTRATION_STATES.has(model.motivation_state);
    const problemCount = isFrustrated ? FRUSTRATION_PROBLEM_COUNT : DEFAULT_PROBLEM_COUNT;

    const conceptIds = getConceptsInExam(examId);
    if (conceptIds.length === 0) {
      throw new Error(`No concepts found for exam '${examId}'. Check data/curriculum/`);
    }

    const ranked = rankConcepts(
      conceptIds,
      examId,
      model.mastery_vector,
      model.prerequisite_alerts,
      model.motivation_state,
      isFrustrated,
    );

    // Pick top N distinct concepts; one problem each
    const problems: SessionProblem[] = [];
    const usedProblemIds = new Set<string>();

    for (const candidate of ranked) {
      if (problems.length >= problemCount) break;
      const problem = await fetchProblemsForConcept(
        pool,
        candidate.concept_id,
        candidate.max_difficulty,
        isFrustrated,
        usedProblemIds,
      );
      if (problem) {
        problems.push(problem);
        usedProblemIds.add(problem.problem_id);
      }
    }

    if (problems.length === 0) {
      throw new Error(`No problems available for exam '${examId}' — seed problems first.`);
    }

    // Create session row
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO studymate_sessions
         (session_id, exam_id, session_type, state, problem_count)
       VALUES ($1, $2, $3, 'READY', $4)
       RETURNING id`,
      [sessionId, examId, sessionType, problems.length]
    );
    const studymateId = rows[0].id;

    // Insert problem rows
    await Promise.all(
      problems.map((p, idx) =>
        pool.query(
          `INSERT INTO studymate_session_problems
             (studymate_id, problem_id, concept_id, position)
           VALUES ($1, $2, $3, $4)`,
          [studymateId, p.problem_id, p.concept_id, idx]
        )
      )
    );

    // Mark as started
    await pool.query(
      `UPDATE studymate_sessions SET state='IN_PROGRESS', started_at=NOW() WHERE id=$1`,
      [studymateId]
    );

    return {
      id: studymateId,
      session_id: sessionId,
      exam_id: examId,
      session_type: sessionType,
      state: 'IN_PROGRESS',
      problem_count: problems.length,
      current_index: 0,
      problems,
      frustration_mode: isFrustrated,
    };
  } finally {
    await pool.end();
  }
}

export async function resumeSession(
  sessionId: string,
): Promise<StudymateSession | null> {
  const pool = getPool();
  try {
    const { rows: sessions } = await pool.query<{
      id: string; exam_id: string; session_type: string;
      state: string; problem_count: number; current_index: number;
    }>(
      `SELECT id, exam_id, session_type, state, problem_count, current_index
       FROM studymate_sessions
       WHERE session_id = $1
         AND state NOT IN ('SESSION_COMPLETE','STAT_SHOWN','IDLE')
         AND updated_at > NOW() - INTERVAL '${RESUME_WINDOW_HOURS} hours'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [sessionId]
    );

    if (!sessions[0]) return null;
    const s = sessions[0];

    const { rows: problems } = await pool.query<{
      problem_id: string; concept_id: string; position: number;
      user_answer: string | null; was_correct: boolean | null; gap_text: string | null;
    }>(
      `SELECT ssp.problem_id, ssp.concept_id, ssp.position,
              ssp.user_answer, ssp.was_correct, ssp.gap_text,
              pq.topic, pq.difficulty, pq.question, pq.expected_answer,
              pq.source, pq.source_url
       FROM studymate_session_problems ssp
       JOIN pyq_questions pq ON pq.id = ssp.problem_id
       WHERE ssp.studymate_id = $1
       ORDER BY ssp.position`,
      [s.id]
    );

    return {
      id: s.id,
      session_id: sessionId,
      exam_id: s.exam_id,
      session_type: s.session_type as 'daily' | 'targeted' | 'review',
      state: s.state,
      problem_count: s.problem_count,
      current_index: s.current_index,
      problems: problems.map(p => ({
        problem_id: p.problem_id,
        concept_id: p.concept_id,
        topic: (p as any).topic,
        difficulty: (p as any).difficulty,
        question: (p as any).question,
        expected_answer: (p as any).expected_answer,
        source: (p as any).source,
        source_url: (p as any).source_url,
        user_answer: p.user_answer,
        was_correct: p.was_correct,
        gap_text: p.gap_text,
      })),
      frustration_mode: false,
    };
  } finally {
    await pool.end();
  }
}

export async function recordAnswer(
  studymateId: string,
  problemId: string,
  userAnswer: string,
  wasCorrect: boolean,
): Promise<void> {
  const pool = getPool();
  try {
    await pool.query(
      `UPDATE studymate_session_problems
       SET user_answer=$1, was_correct=$2, answered_at=NOW()
       WHERE studymate_id=$3 AND problem_id=$4`,
      [userAnswer, wasCorrect, studymateId, problemId]
    );

    // Advance current_index and transition state
    await pool.query(
      `UPDATE studymate_sessions
       SET current_index = current_index + 1,
           state = 'PROBLEM_ANSWERED',
           updated_at = NOW()
       WHERE id = $1`,
      [studymateId]
    );
  } finally {
    await pool.end();
  }
}

export async function completeSession(studymateId: string): Promise<string> {
  const pool = getPool();
  try {
    const { rows } = await pool.query<{
      concept_id: string; was_correct: boolean;
    }>(
      `SELECT concept_id, was_correct
       FROM studymate_session_problems
       WHERE studymate_id = $1 AND was_correct IS NOT NULL`,
      [studymateId]
    );

    const stat = buildSessionStat(rows);

    await pool.query(
      `UPDATE studymate_sessions
       SET state='SESSION_COMPLETE', completed_at=NOW(),
           session_stat=$1, updated_at=NOW()
       WHERE id=$2`,
      [stat, studymateId]
    );

    return stat;
  } finally {
    await pool.end();
  }
}

function buildSessionStat(
  attempts: Array<{ concept_id: string; was_correct: boolean }>,
): string {
  if (attempts.length === 0) return 'Session complete.';

  const correctCount = attempts.filter(a => a.was_correct).length;
  const topConcept = attempts
    .filter(a => a.was_correct)
    .map(a => a.concept_id)[0] ?? attempts[0].concept_id;

  if (correctCount === 0) {
    return `${correctCount}/${attempts.length} today — every attempt builds pattern recognition.`;
  }
  const label = topConcept.replace(/-/g, ' ');
  return `${correctCount}/${attempts.length} today. Strong on ${label}.`;
}
