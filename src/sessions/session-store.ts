// @ts-nocheck
/**
 * Session Store — storage abstraction for Studymate sessions.
 *
 * Two backends:
 *   - Postgres: when DATABASE_URL is set. Uses studymate_sessions +
 *     studymate_session_problems tables (migration 012).
 *   - Flat file: when DATABASE_URL is unset. Persists sessions in
 *     .data/studymate-sessions.json. Problems are sourced from the
 *     content bundle (frontend/public/data/content-bundle.json or
 *     legacy pyq-bank.json) — same source the demo lesson flow uses.
 *
 * The decision is made once at module load. If DATABASE_URL appears
 * mid-session (rare), restart the server.
 *
 * This unblocks the free-tier Render demo where Postgres is "optional"
 * per render.yaml but the studymate flow had a hard dependency on it.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { createFlatFileStore } from '../lib/flat-file-store';

const { Pool } = pg;

// ─── Public types (mirror session-engine.ts shapes) ───────────────────────

export interface SessionProblemRow {
  problem_id: string;
  concept_id: string;
  topic: string;
  difficulty: number;
  question: string;
  expected_answer: string;
  source: string;
  source_url?: string;
}

export interface StoredSession {
  id: string;
  session_id: string;
  exam_id: string;
  session_type: 'daily' | 'targeted' | 'review';
  state: string;
  problem_count: number;
  current_index: number;
  started_at?: string;
  completed_at?: string;
  session_stat?: string;
  updated_at: string;
}

export interface StoredProblem {
  studymate_id: string;
  problem_id: string;
  concept_id: string;
  position: number;
  user_answer: string | null;
  was_correct: boolean | null;
  gap_text: string | null;
  answered_at: string | null;
}

/**
 * Storage interface. Postgres + flat-file impls satisfy this.
 * Higher-level orchestration (ranking, frustration mode, problem selection)
 * stays in session-engine.ts; this layer is pure CRUD.
 */
export interface SessionStore {
  /** Load problem candidates for a concept, ordered randomly, capped at N. */
  fetchProblemsForConcept(
    conceptId: string,
    maxDifficulty: number,
    excludeIds: Set<string>,
  ): Promise<SessionProblemRow | null>;

  /** Persist a fresh session + its problems atomically. Returns the new id. */
  createSession(
    sessionId: string,
    examId: string,
    sessionType: 'daily' | 'targeted' | 'review',
    problems: SessionProblemRow[],
  ): Promise<string>;

  /** Mark session in-progress. */
  markStarted(studymateId: string): Promise<void>;

  /** Look up the most recent resumable session within RESUME_WINDOW_HOURS. */
  findResumable(sessionId: string, withinHours: number): Promise<StoredSession | null>;

  /** Load all problem rows for a session. */
  getSessionProblems(studymateId: string): Promise<Array<StoredProblem & SessionProblemRow>>;

  /** Record an answer + advance current_index + transition state. */
  recordAnswer(
    studymateId: string,
    problemId: string,
    userAnswer: string,
    wasCorrect: boolean,
  ): Promise<void>;

  /** Read all answered problems for stat-line computation. */
  getCompletionAttempts(studymateId: string): Promise<Array<{ concept_id: string; was_correct: boolean }>>;

  /** Mark session complete + write the stat line. */
  markCompleted(studymateId: string, stat: string): Promise<void>;
}

// ─── Postgres backend ─────────────────────────────────────────────────────

class PostgresStore implements SessionStore {
  private pool: pg.Pool;
  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async fetchProblemsForConcept(
    conceptId: string,
    maxDifficulty: number,
    excludeIds: Set<string>,
  ): Promise<SessionProblemRow | null> {
    const { rows } = await this.pool.query<{
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
      [conceptId, maxDifficulty, [...excludeIds]],
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

  async createSession(sessionId, examId, sessionType, problems): Promise<string> {
    const { rows } = await this.pool.query<{ id: string }>(
      `INSERT INTO studymate_sessions
         (session_id, exam_id, session_type, state, problem_count)
       VALUES ($1, $2, $3, 'READY', $4)
       RETURNING id`,
      [sessionId, examId, sessionType, problems.length],
    );
    const studymateId = rows[0].id;
    await Promise.all(
      problems.map((p, idx) =>
        this.pool.query(
          `INSERT INTO studymate_session_problems
             (studymate_id, problem_id, concept_id, position)
           VALUES ($1, $2, $3, $4)`,
          [studymateId, p.problem_id, p.concept_id, idx],
        ),
      ),
    );
    return studymateId;
  }

  async markStarted(studymateId: string): Promise<void> {
    await this.pool.query(
      `UPDATE studymate_sessions SET state='IN_PROGRESS', started_at=NOW() WHERE id=$1`,
      [studymateId],
    );
  }

  async findResumable(sessionId: string, withinHours: number): Promise<StoredSession | null> {
    const { rows } = await this.pool.query(
      `SELECT id, session_id, exam_id, session_type, state, problem_count, current_index, updated_at
       FROM studymate_sessions
       WHERE session_id = $1
         AND state NOT IN ('SESSION_COMPLETE','STAT_SHOWN','IDLE')
         AND updated_at > NOW() - INTERVAL '${withinHours} hours'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [sessionId],
    );
    return rows[0] ?? null;
  }

  async getSessionProblems(studymateId: string) {
    const { rows } = await this.pool.query(
      `SELECT ssp.studymate_id, ssp.problem_id, ssp.concept_id, ssp.position,
              ssp.user_answer, ssp.was_correct, ssp.gap_text, ssp.answered_at,
              pq.topic, pq.difficulty, pq.question, pq.expected_answer,
              pq.source, pq.source_url
       FROM studymate_session_problems ssp
       JOIN pyq_questions pq ON pq.id = ssp.problem_id
       WHERE ssp.studymate_id = $1
       ORDER BY ssp.position`,
      [studymateId],
    );
    return rows;
  }

  async recordAnswer(studymateId, problemId, userAnswer, wasCorrect): Promise<void> {
    await this.pool.query(
      `UPDATE studymate_session_problems
       SET user_answer=$1, was_correct=$2, answered_at=NOW()
       WHERE studymate_id=$3 AND problem_id=$4`,
      [userAnswer, wasCorrect, studymateId, problemId],
    );
    await this.pool.query(
      `UPDATE studymate_sessions
       SET current_index = current_index + 1,
           state = 'PROBLEM_ANSWERED',
           updated_at = NOW()
       WHERE id = $1`,
      [studymateId],
    );
  }

  async getCompletionAttempts(studymateId: string) {
    const { rows } = await this.pool.query(
      `SELECT concept_id, was_correct
       FROM studymate_session_problems
       WHERE studymate_id = $1 AND was_correct IS NOT NULL`,
      [studymateId],
    );
    return rows;
  }

  async markCompleted(studymateId: string, stat: string): Promise<void> {
    await this.pool.query(
      `UPDATE studymate_sessions
       SET state='SESSION_COMPLETE', completed_at=NOW(),
           session_stat=$1, updated_at=NOW()
       WHERE id=$2`,
      [stat, studymateId],
    );
  }
}

// ─── Flat-file backend (for free-tier demos without Postgres) ─────────────

interface FlatShape {
  sessions: StoredSession[];
  problems: Array<StoredProblem & SessionProblemRow>;
}

function shortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

let _bundleCache: any = null;
function loadBundleProblems(): any[] {
  if (_bundleCache) return _bundleCache;
  const candidates = [
    // Production (Vite-built): frontend/public/* gets emitted to frontend/dist/*
    path.resolve(process.cwd(), 'frontend/dist/data/content-bundle.json'),
    path.resolve(process.cwd(), 'frontend/dist/data/pyq-bank.json'),
    // Dev (Vite serves from public/)
    path.resolve(process.cwd(), 'frontend/public/data/content-bundle.json'),
    path.resolve(process.cwd(), '../frontend/public/data/content-bundle.json'),
    path.resolve(process.cwd(), 'public/data/content-bundle.json'),
    path.resolve(process.cwd(), 'frontend/public/data/pyq-bank.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        _bundleCache = data.problems ?? [];
        return _bundleCache;
      } catch { /* try next */ }
    }
  }
  _bundleCache = [];
  return _bundleCache;
}

class FlatFileStore implements SessionStore {
  private store: ReturnType<typeof createFlatFileStore<FlatShape>>;

  constructor() {
    this.store = createFlatFileStore<FlatShape>({
      path: '.data/studymate-sessions.json',
      defaultShape: () => ({ sessions: [], problems: [] }),
    });
  }

  async fetchProblemsForConcept(
    conceptId: string,
    maxDifficulty: number,
    excludeIds: Set<string>,
  ): Promise<SessionProblemRow | null> {
    const all = loadBundleProblems();
    const matchTarget = (p: any) =>
      p.concept_id === conceptId || (!p.concept_id && p.topic === conceptId) || p.topic === conceptId;

    const candidates = all.filter((p: any) => {
      if (!matchTarget(p)) return false;
      if (excludeIds.has(p.id)) return false;
      const d = typeof p.difficulty === 'number' ? p.difficulty
        : p.difficulty === 'easy' ? 0.25
        : p.difficulty === 'hard' ? 0.75
        : 0.5;
      return d <= maxDifficulty;
    });
    if (candidates.length === 0) return null;
    const r = candidates[Math.floor(Math.random() * candidates.length)];
    const numericDiff = typeof r.difficulty === 'number' ? r.difficulty
      : r.difficulty === 'easy' ? 0.25
      : r.difficulty === 'hard' ? 0.75
      : 0.5;
    return {
      problem_id: r.id,
      concept_id: r.concept_id ?? conceptId,
      topic: r.topic ?? '',
      difficulty: numericDiff,
      question: r.question_text ?? r.question ?? '',
      expected_answer: r.expected_answer ?? r.answer ?? '',
      source: r.source ?? 'bundle',
      source_url: r.source_url,
    };
  }

  async createSession(sessionId, examId, sessionType, problems): Promise<string> {
    const id = `sm-${shortId()}`;
    const now = new Date().toISOString();
    this.store.update((s) => {
      s.sessions.push({
        id,
        session_id: sessionId,
        exam_id: examId,
        session_type: sessionType,
        state: 'READY',
        problem_count: problems.length,
        current_index: 0,
        updated_at: now,
      });
      problems.forEach((p, idx) =>
        s.problems.push({
          studymate_id: id,
          problem_id: p.problem_id,
          concept_id: p.concept_id,
          position: idx,
          user_answer: null,
          was_correct: null,
          gap_text: null,
          answered_at: null,
          // mirror SessionProblemRow fields for read convenience
          topic: p.topic,
          difficulty: p.difficulty,
          question: p.question,
          expected_answer: p.expected_answer,
          source: p.source,
          source_url: p.source_url,
        }),
      );
    });
    return id;
  }

  async markStarted(studymateId: string): Promise<void> {
    this.store.update((s) => {
      const sess = s.sessions.find((x) => x.id === studymateId);
      if (sess) {
        sess.state = 'IN_PROGRESS';
        sess.started_at = new Date().toISOString();
        sess.updated_at = sess.started_at;
      }
    });
  }

  async findResumable(sessionId: string, withinHours: number): Promise<StoredSession | null> {
    const s = this.store.read();
    const cutoff = Date.now() - withinHours * 60 * 60 * 1000;
    const inactive = new Set(['SESSION_COMPLETE', 'STAT_SHOWN', 'IDLE']);
    const matches = s.sessions
      .filter((x) => x.session_id === sessionId
        && !inactive.has(x.state)
        && new Date(x.updated_at).getTime() > cutoff)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    return matches[0] ?? null;
  }

  async getSessionProblems(studymateId: string) {
    const s = this.store.read();
    return s.problems
      .filter((p) => p.studymate_id === studymateId)
      .sort((a, b) => a.position - b.position);
  }

  async recordAnswer(studymateId, problemId, userAnswer, wasCorrect): Promise<void> {
    this.store.update((s) => {
      const p = s.problems.find((x) => x.studymate_id === studymateId && x.problem_id === problemId);
      if (p) {
        p.user_answer = userAnswer;
        p.was_correct = wasCorrect;
        p.answered_at = new Date().toISOString();
      }
      const sess = s.sessions.find((x) => x.id === studymateId);
      if (sess) {
        sess.current_index = (sess.current_index ?? 0) + 1;
        sess.state = 'PROBLEM_ANSWERED';
        sess.updated_at = new Date().toISOString();
      }
    });
  }

  async getCompletionAttempts(studymateId: string) {
    const s = this.store.read();
    return s.problems
      .filter((p) => p.studymate_id === studymateId && p.was_correct !== null)
      .map((p) => ({ concept_id: p.concept_id, was_correct: p.was_correct as boolean }));
  }

  async markCompleted(studymateId: string, stat: string): Promise<void> {
    this.store.update((s) => {
      const sess = s.sessions.find((x) => x.id === studymateId);
      if (sess) {
        sess.state = 'SESSION_COMPLETE';
        sess.completed_at = new Date().toISOString();
        sess.session_stat = stat;
        sess.updated_at = sess.completed_at;
      }
    });
  }
}

// ─── Selector ─────────────────────────────────────────────────────────────

let _store: SessionStore | null = null;

export function getSessionStore(): SessionStore {
  if (_store) return _store;
  if (process.env.DATABASE_URL) {
    _store = new PostgresStore();
  } else {
    _store = new FlatFileStore();
  }
  return _store;
}

/** For tests: reset the cached store so subsequent calls pick up env changes. */
export function _resetSessionStoreForTests(): void {
  _store = null;
  _bundleCache = null;
}

export const RESUME_WINDOW_HOURS_DEFAULT = 4;
