// @ts-nocheck
/**
 * Session Engine — exam-agnostic adaptive session builder
 *
 * Takes a session_id + exam_id and returns a StudymateSession of N problems.
 * Reads from the file-based curriculum system (src/curriculum/) and the
 * student model (GBrain). No hardcoded exam logic.
 *
 * Storage is delegated to src/sessions/session-store.ts which auto-selects
 * Postgres (when DATABASE_URL is set) or a flat-file fallback (for free-tier
 * demos). This module owns ranking, frustration handling, and orchestration —
 * not data persistence.
 *
 * Ranking formula:
 *   score = SR_decay×0.30 + error_rate×0.30 + exam_weight×0.15
 *         + prereq_gate×0.15 + motivation_boost×0.10
 *
 * Cold-start (no history): SR_decay=1.0, error_rate=0.5.
 * If /onboard mastery_vector is seeded, it is used instead.
 */

import { getOrCreateStudentModel } from '../gbrain/student-model';
import { getConceptsInExam, getConceptLink, depthToMaxDifficulty } from '../curriculum/concept-exam-map';
import { loadAllExams } from '../curriculum/exam-loader';
import { getSessionStore, RESUME_WINDOW_HOURS_DEFAULT, type SessionProblemRow } from './session-store';

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
const RESUME_WINDOW_HOURS = RESUME_WINDOW_HOURS_DEFAULT;

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
    prerequisiteAlerts.filter(a => a.severity === 'critical').map(a => a.concept),
  );

  const scored: ConceptScore[] = conceptIds.map(conceptId => {
    const link = getConceptLink(conceptId, examId);
    const examWeight = link ? Math.min(1, link.weight ?? 0.5) : 0.5;
    const maxDifficulty = link ? depthToMaxDifficulty(link.depth) : 0.7;

    const masteryEntry = masteryVector?.[conceptId];
    const masteryScore = typeof masteryEntry === 'number' ? masteryEntry : (masteryEntry?.score ?? 0);
    // SR_decay: 1 = never seen / overdue. 0 = recently mastered.
    const sr_decay = 1 - masteryScore;
    // error_rate: cold start = 0.5
    const error_rate = masteryEntry?.attempts > 0
      ? 1 - ((masteryEntry.correct ?? 0) / masteryEntry.attempts)
      : 0.5;
    const prereq_gate = criticalAlerts.has(conceptId) ? 1 : 0;
    const motivation_boost = isFrustrated ? (1 - masteryScore) * 0.5 : 0;

    const score = (
      W.sr_decay * sr_decay +
      W.error_rate * error_rate +
      W.exam_weight * examWeight +
      W.prereq_gate * prereq_gate +
      W.motivation_boost * motivation_boost
    );

    return { concept_id: conceptId, score, exam_weight: examWeight, max_difficulty: maxDifficulty };
  });

  return scored.sort((a, b) => b.score - a.score);
}

export async function buildSession(
  sessionId: string,
  examId: string,
  sessionType: 'daily' | 'targeted' | 'review' = 'daily',
): Promise<StudymateSession> {
  const store = getSessionStore();
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

  const problems: SessionProblemRow[] = [];
  const usedProblemIds = new Set<string>();
  for (const candidate of ranked) {
    if (problems.length >= problemCount) break;
    const effectiveMax = isFrustrated ? candidate.max_difficulty * 0.5 : candidate.max_difficulty;
    const problem = await store.fetchProblemsForConcept(candidate.concept_id, effectiveMax, usedProblemIds);
    if (problem) {
      problems.push(problem);
      usedProblemIds.add(problem.problem_id);
    }
  }

  if (problems.length === 0) {
    throw new Error(`No problems available for exam '${examId}' — seed problems first.`);
  }

  const studymateId = await store.createSession(sessionId, examId, sessionType, problems);
  await store.markStarted(studymateId);

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
}

export async function resumeSession(
  sessionId: string,
): Promise<StudymateSession | null> {
  const store = getSessionStore();
  const sess = await store.findResumable(sessionId, RESUME_WINDOW_HOURS);
  if (!sess) return null;

  const problems = await store.getSessionProblems(sess.id);

  return {
    id: sess.id,
    session_id: sessionId,
    exam_id: sess.exam_id,
    session_type: sess.session_type as 'daily' | 'targeted' | 'review',
    state: sess.state,
    problem_count: sess.problem_count,
    current_index: sess.current_index,
    problems: problems.map((p: any) => ({
      problem_id: p.problem_id,
      concept_id: p.concept_id,
      topic: p.topic,
      difficulty: p.difficulty,
      question: p.question,
      expected_answer: p.expected_answer,
      source: p.source,
      source_url: p.source_url,
      user_answer: p.user_answer,
      was_correct: p.was_correct,
      gap_text: p.gap_text,
    })),
    frustration_mode: false,
  };
}

export async function recordAnswer(
  studymateId: string,
  problemId: string,
  userAnswer: string,
  wasCorrect: boolean,
): Promise<void> {
  const store = getSessionStore();
  await store.recordAnswer(studymateId, problemId, userAnswer, wasCorrect);
}

export async function completeSession(studymateId: string): Promise<string> {
  const store = getSessionStore();
  const attempts = await store.getCompletionAttempts(studymateId);
  const stat = buildSessionStat(attempts);
  await store.markCompleted(studymateId, stat);
  return stat;
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
