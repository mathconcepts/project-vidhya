// @ts-nocheck
/**
 * Thinking-Gap Service
 *
 * Generates a short, targeted explanation of WHY a student got a problem wrong.
 * Fires lazily on PROBLEM_ANSWERED (incorrect) — never pre-fetched.
 *
 * Cache strategy: scalar BTREE key (concept_id, error_type, misconception_hash).
 * ~60% expected hit rate → ~$2/month vs $16/month uncached.
 *
 * gap_text format (1–2 sentences):
 *   "Most students confuse X with Y here. The key insight is Z."
 */

import crypto from 'crypto';
import pg from 'pg';
import { getLlmForRole } from '../llm/runtime';

const { Pool } = pg;

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool {
  if (_pool) return _pool;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 30_000 });
  return _pool;
}

export interface ThinkingGapInput {
  concept_id: string;
  question: string;
  expected_answer: string;
  user_answer: string;
  top_misconceptions?: string[]; // optional context from student model
}

function classifyErrorType(userAnswer: string, expectedAnswer: string): string {
  const u = userAnswer.trim().toLowerCase();
  const e = expectedAnswer.trim().toLowerCase();
  if (!u) return 'no_attempt';
  // sign error: answers are negatives of each other (numeric)
  const un = parseFloat(u.replace(/[^0-9.\-]/g, ''));
  const en = parseFloat(e.replace(/[^0-9.\-]/g, ''));
  if (!isNaN(un) && !isNaN(en) && Math.abs(un + en) < 0.01 && Math.abs(un) > 0.001) return 'sign_error';
  // off by factor of common constants
  if (!isNaN(un) && !isNaN(en)) {
    const ratio = un / en;
    if (Math.abs(ratio - 2) < 0.05 || Math.abs(ratio - 0.5) < 0.05) return 'factor_error';
    if (Math.abs(ratio - Math.PI) < 0.05 || Math.abs(ratio - 1 / Math.PI) < 0.05) return 'pi_confusion';
  }
  return 'wrong_formula';
}

function buildMisconductHash(misconceptions: string[]): string {
  const top3 = misconceptions.slice(0, 3).sort().join('|');
  return crypto.createHash('sha1').update(top3).digest('hex').slice(0, 16);
}

async function lookupCache(
  pool: pg.Pool,
  conceptId: string,
  errorType: string,
  misconductHash: string,
): Promise<string | null> {
  const { rows } = await pool.query<{ id: string; gap_text: string }>(
    `SELECT id, gap_text FROM thinking_gap_cache
     WHERE concept_id = $1 AND error_type = $2 AND misconception_hash = $3
     LIMIT 1`,
    [conceptId, errorType, misconductHash],
  );
  if (!rows[0]) return null;
  // bump hit count async — don't await
  pool.query('UPDATE thinking_gap_cache SET hit_count = hit_count + 1 WHERE id = $1', [rows[0].id])
    .catch(() => {});
  return rows[0].gap_text;
}

async function writeCache(
  pool: pg.Pool,
  conceptId: string,
  errorType: string,
  misconductHash: string,
  gapText: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO thinking_gap_cache (concept_id, error_type, misconception_hash, gap_text)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT ON CONSTRAINT uq_thinking_gap DO NOTHING`,
    [conceptId, errorType, misconductHash, gapText],
  );
}

async function generateGapText(input: ThinkingGapInput): Promise<string | null> {
  const llm = await getLlmForRole('chat');
  if (!llm) return null;

  const prompt = `A student answered a math problem incorrectly.

Concept: ${input.concept_id.replace(/-/g, ' ')}
Question: ${input.question}
Expected answer: ${input.expected_answer}
Student's answer: ${input.user_answer}

Write exactly 1–2 sentences explaining the most common misconception behind this error and the key insight to fix it. Be direct and specific. Do not repeat the question or give a full solution.`;

  try {
    const text = await llm.generate(prompt);
    return text?.trim() ?? null;
  } catch {
    return null;
  }
}

/**
 * Get or generate a thinking-gap explanation for a wrong answer.
 * Returns null if LLM is unavailable and there's no cached entry.
 */
export async function getThinkingGap(input: ThinkingGapInput): Promise<string | null> {
  const pool = getPool();
  const errorType = classifyErrorType(input.user_answer, input.expected_answer);
  const misconductHash = buildMisconductHash(input.top_misconceptions ?? []);

  const cached = await lookupCache(pool, input.concept_id, errorType, misconductHash);
  if (cached) return cached;

  const generated = await generateGapText(input);
  if (!generated) return null;

  await writeCache(pool, input.concept_id, errorType, misconductHash, generated);
  return generated;
}

/**
 * Attach gap_text to a session problem row after incorrect answer.
 * Fires async — caller does not need to await.
 */
export async function attachThinkingGap(
  studymateId: string,
  problemId: string,
  input: ThinkingGapInput,
): Promise<void> {
  const pool = getPool();
  const gapText = await getThinkingGap(input);
  if (!gapText) return;

  await pool.query(
    `UPDATE studymate_session_problems
     SET gap_text = $1
     WHERE studymate_id = $2 AND problem_id = $3`,
    [gapText, studymateId, problemId],
  );
  await pool.query(
    `UPDATE studymate_sessions
     SET state = 'THINKING_GAP_SHOWN', updated_at = NOW()
     WHERE id = $1 AND state = 'PROBLEM_ANSWERED'`,
    [studymateId],
  );
}
