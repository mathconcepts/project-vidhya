// @ts-nocheck
/**
 * Thinking-Gap Service
 *
 * Generates a short, targeted explanation of WHY a student got a problem
 * wrong. Fires lazily on PROBLEM_ANSWERED (incorrect) — never pre-fetched.
 * This is the "Generating insight…" spinner in the 15-minute session.
 *
 * ── What was wrong with the previous version ────────────────────────────
 *
 * It took a `top_misconceptions` array, hashed it into the cache key, and
 * then never referenced it again — `generateGapText` built its prompt from
 * the concept, question, expected answer, and student answer alone. Nothing
 * about the student reached the model. So for a given (concept, error_type)
 * every student in the system received the same sentence, written once and
 * then served from cache forever. LLM-generated at the origin; static in
 * every way a student could perceive.
 *
 * Worse, the frontend never sent `top_misconceptions` at all, so the hash was
 * a constant and the cache held exactly one row per (concept, error_type).
 *
 * And `getPool()` built a Pool unconditionally. On a deploy without
 * DATABASE_URL — which is what the demo instance is — the first cache query
 * threw, the whole path aborted, and the spinner ran for six polls and then
 * vanished leaving nothing behind.
 *
 * ── What it does now ────────────────────────────────────────────────────
 *
 * 1. Framing (see learner-framing.ts) is derived server-side from the student
 *    model and is BOTH in the prompt and in the cache key, so a shaken
 *    beginner and an assured near-master get genuinely different text.
 * 2. Misconceptions actually reach the prompt.
 * 3. No DATABASE_URL → skip the cache and generate directly, so the DB-less
 *    demo shows a real insight instead of an empty space.
 * 4. Every result carries provenance (`source`) so the admin content-maturity
 *    surface can show which insights are personalised and which are falling
 *    back to the generic variant.
 *
 * Cache key is (concept_id, error_type, misconception_hash, framing). Framing
 * is cohort-shaped — at most 27 variants — not per-student, so the hit rate
 * stays high enough for the runtime LLM budget.
 */

import crypto from 'crypto';
import pg from 'pg';
import { getLlmForRole } from '../llm/runtime';
import {
  deriveFraming,
  framingSignature,
  framingInstructions,
  DEFAULT_FRAMING,
  type LearnerFraming,
} from './learner-framing';

const { Pool } = pg;

let _pool: pg.Pool | null = null;
/**
 * Returns null when there is no database, rather than handing back a Pool
 * that throws on first use. Every caller below treats null as "no cache",
 * not as "no feature".
 */
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 30_000 });
  return _pool;
}

export interface ThinkingGapInput {
  concept_id: string;
  question: string;
  expected_answer: string;
  user_answer: string;
  /** Derived server-side from the student model. Never trusted from a client. */
  framing?: LearnerFraming;
  top_misconceptions?: string[];
}

/** Where the served text came from. Feeds the admin content-maturity view. */
export type GapSource = 'cache' | 'generated' | 'unavailable';

export interface ThinkingGapResult {
  text: string | null;
  source: GapSource;
  /** Cohort label the text was written for, e.g. `building/shaken/geometric`. */
  framing: string;
  /** False when the framing was the cold default — i.e. generic content. */
  personalized: boolean;
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

function buildMisconceptionHash(misconceptions: string[]): string {
  const top3 = misconceptions.slice(0, 3).sort().join('|');
  return crypto.createHash('sha1').update(top3).digest('hex').slice(0, 16);
}

async function lookupCache(
  pool: pg.Pool,
  conceptId: string,
  errorType: string,
  misconceptionHash: string,
  framing: string,
): Promise<string | null> {
  const { rows } = await pool.query<{ id: string; gap_text: string }>(
    `SELECT id, gap_text FROM thinking_gap_cache
     WHERE concept_id = $1 AND error_type = $2 AND misconception_hash = $3 AND framing = $4
     LIMIT 1`,
    [conceptId, errorType, misconceptionHash, framing],
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
  misconceptionHash: string,
  framing: string,
  gapText: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO thinking_gap_cache (concept_id, error_type, misconception_hash, framing, gap_text)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ON CONSTRAINT uq_thinking_gap_framed DO NOTHING`,
    [conceptId, errorType, misconceptionHash, framing, gapText],
  );
}

/** Exported for the prompt test — the framing must survive into the text. */
export function buildGapPrompt(input: ThinkingGapInput): string {
  const framing = input.framing ?? DEFAULT_FRAMING;
  const misconceptions = (input.top_misconceptions ?? []).slice(0, 3);

  // The misconception list is the one signal the old version collected and
  // then threw away. It goes in the prompt now, not just the cache key.
  const misconceptionBlock = misconceptions.length
    ? `\nErrors this student has been making lately: ${misconceptions.join('; ')}.` +
      `\nIf this mistake is another instance of one of those, say so plainly — naming the repeat is the useful part.`
    : '';

  return `A student answered a maths problem incorrectly.

Concept: ${input.concept_id.replace(/-/g, ' ')}
Question: ${input.question}
Expected answer: ${input.expected_answer}
Student's answer: ${input.user_answer}

Who you are writing for: ${framingInstructions(framing)}${misconceptionBlock}

Write exactly 1–2 sentences explaining the specific misconception behind THIS error and the key insight that fixes it. Address the student as "you". Be concrete about their actual answer rather than describing errors in general. Do not repeat the question, do not give the full solution, and do not open with praise or reassurance.`;
}

async function generateGapText(input: ThinkingGapInput): Promise<string | null> {
  const llm = await getLlmForRole('chat');
  if (!llm) return null;
  try {
    const text = await llm.generate(buildGapPrompt(input));
    return text?.trim() || null;
  } catch (err) {
    console.warn(`[thinking-gap] generation failed: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Get or generate a thinking-gap explanation for a wrong answer.
 *
 * Never throws: a missing database, a missing LLM, or a transient query
 * failure all degrade to `{ text: null, source: 'unavailable' }` so the
 * caller can decide what to show rather than losing the whole request.
 */
export async function getThinkingGap(input: ThinkingGapInput): Promise<ThinkingGapResult> {
  const framing = input.framing ?? DEFAULT_FRAMING;
  const signature = framingSignature(framing);
  // "Personalised" means we actually knew something. The cold default is what
  // an anonymous first-time session produces, and it should be reported as
  // generic rather than dressed up as tailored.
  const personalized =
    signature !== framingSignature(DEFAULT_FRAMING) || (input.top_misconceptions?.length ?? 0) > 0;

  const errorType = classifyErrorType(input.user_answer, input.expected_answer);
  const misconceptionHash = buildMisconceptionHash(input.top_misconceptions ?? []);
  const pool = getPool();

  if (pool) {
    try {
      const cached = await lookupCache(pool, input.concept_id, errorType, misconceptionHash, signature);
      if (cached) return { text: cached, source: 'cache', framing: signature, personalized };
    } catch (err) {
      // A missing column on a partially-migrated deploy must not cost the
      // student their explanation — fall through and generate.
      console.warn(`[thinking-gap] cache lookup skipped: ${(err as Error).message}`);
    }
  }

  const generated = await generateGapText(input);
  if (!generated) return { text: null, source: 'unavailable', framing: signature, personalized };

  if (pool) {
    try {
      await writeCache(pool, input.concept_id, errorType, misconceptionHash, signature, generated);
    } catch (err) {
      console.warn(`[thinking-gap] cache write skipped: ${(err as Error).message}`);
    }
  }
  return { text: generated, source: 'generated', framing: signature, personalized };
}

/**
 * Attach gap_text to a session problem row after an incorrect answer.
 * Fires async — caller does not need to await.
 *
 * `session_id` is the anonymous session key. The student model is loaded here,
 * server-side, rather than letting the client hand us a framing: the client
 * must not see or set scorer fields (surveillance invariant), and a
 * client-supplied framing would be trivially spoofable into a different
 * cache partition.
 */
export async function attachThinkingGap(
  studymateId: string,
  problemId: string,
  input: ThinkingGapInput & { session_id?: string | null },
): Promise<void> {
  let framing = input.framing;
  if (!framing && input.session_id) {
    try {
      const { getOrCreateStudentModel } = await import('../gbrain/student-model');
      const model = await getOrCreateStudentModel(input.session_id);
      framing = deriveFraming(model as any, input.concept_id);
    } catch (err) {
      console.warn(`[thinking-gap] framing unavailable, using generic: ${(err as Error).message}`);
    }
  }

  const result = await getThinkingGap({ ...input, framing });
  if (!result.text) return;

  // Without a database there is no session row to update. The text is still
  // generated above so an in-memory/demo caller can use the return value;
  // persisting is simply not possible, which is not an error.
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `UPDATE studymate_session_problems
       SET gap_text = $1
       WHERE studymate_id = $2 AND problem_id = $3`,
      [result.text, studymateId, problemId],
    );
    await pool.query(
      `UPDATE studymate_sessions
       SET state = 'THINKING_GAP_SHOWN', updated_at = NOW()
       WHERE id = $1 AND state = 'PROBLEM_ANSWERED'`,
      [studymateId],
    );
  } catch (err) {
    console.warn(`[thinking-gap] persist skipped: ${(err as Error).message}`);
  }
}
