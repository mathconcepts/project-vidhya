// @ts-nocheck
/**
 * Study Commander API Routes
 *
 * Endpoints:
 *   POST /api/onboard                    — Save study profile (onboarding)
 *   GET  /api/onboard/:sessionId         — Get study profile
 *   GET  /api/diagnostic/:sessionId      — Get diagnostic questions (10, 1/topic)
 *   POST /api/diagnostic/:sessionId      — Save diagnostic scores
 *   GET  /api/today/:sessionId           — Get/create today's daily plan
 *   POST /api/today/:sessionId/:taskIdx/rate — Rate task completion
 *   GET  /api/priority/:sessionId        — Get priority ranking
 */

import { ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import pg from 'pg';
import { computePriority, generateDailyTasks, MARKS_WEIGHTS, TOPIC_NAMES } from '../engine/priority-engine';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

const { Pool } = pg;

// ============================================================================
// Types
// ============================================================================

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

// ============================================================================
// Database
// ============================================================================

let _pool: any = null;

function getPool() {
  if (_pool) return _pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('[commander] DATABASE_URL not configured');
  _pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000 });
  return _pool;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, status: number, message: string): void {
  sendJSON(res, { error: message }, status);
}

// ============================================================================
// IST date helper
// ============================================================================

function getISTDate(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().slice(0, 10);
}

function getISTNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
}

// ============================================================================
// Validation
// ============================================================================

// Note: VALID_TOPIC_IDS was removed — topic validation is now exam-agnostic
// (see validateOnboardInput). Topic IDs come from the exam adapter's
// getSyllabusTopicIds(), not from a hardcoded GATE list.

function validateOnboardInput(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Request body required';
  const { exam_date, target_score, weekly_hours, topic_confidence } = body;

  if (!exam_date || typeof exam_date !== 'string') return 'exam_date is required (YYYY-MM-DD)';
  const examDate = new Date(exam_date);
  if (isNaN(examDate.getTime())) return 'exam_date must be a valid date';
  const todayIST = getISTDate();
  if (exam_date < todayIST) return 'exam_date must be today or later';

  if (target_score !== null && target_score !== undefined) {
    if (typeof target_score !== 'number' || target_score < 1 || target_score > 100) {
      return 'target_score must be between 1 and 100';
    }
  }

  if (weekly_hours !== undefined) {
    if (typeof weekly_hours !== 'number' || weekly_hours < 1 || weekly_hours > 100) {
      return 'weekly_hours must be between 1 and 100';
    }
  }

  // topic_confidence is optional (new flow submits partial or empty map).
  // When present, validate each value is in 1-5 range without enforcing
  // a specific set of topic keys (topics vary by exam).
  if (topic_confidence !== undefined && topic_confidence !== null) {
    if (typeof topic_confidence !== 'object' || Array.isArray(topic_confidence)) {
      return 'topic_confidence must be an object (topic_id -> 1-5)';
    }
    for (const [topicId, val] of Object.entries(topic_confidence)) {
      if (typeof val !== 'number' || (val as number) < 1 || (val as number) > 5) {
        return `topic_confidence[${topicId}] must be 1-5`;
      }
    }
  }

  return null;
}

// ============================================================================
// Handlers
// ============================================================================

/** GET /api/onboard/meta — Return the student's exam name + topic list for the onboarding UI */
async function handleGetOnboardMeta(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { getCurrentUser } = await import('../auth/middleware');
  const auth = await getCurrentUser(req);

  const { getExamAdapter, listExamAdapters, loadBundledAdapters } = await import('../exam-builder/registry');
  try { loadBundledAdapters(); } catch {}

  let examAdapter: any = null;
  if (auth) {
    const { getProfile } = await import('../session-planner/exam-profile-store');
    const profile = getProfile(auth.user.id);
    const primaryId = profile?.exams?.[0]?.exam_id;
    if (primaryId) examAdapter = getExamAdapter(primaryId);
  }
  if (!examAdapter) {
    const all = listExamAdapters();
    examAdapter = all[0] ?? null;
  }
  if (!examAdapter) return sendError(res, 503, 'No exam adapters registered');

  const topics = examAdapter.getSyllabusTopicIds().map((id: string) => ({
    id,
    name: id.replace(/-/g, ' ').replace(/\w/g, (c: string) => c.toUpperCase()),
  }));

  // Derive a short, friendly label (e.g. "BITSAT", "NEET Physics", "JEE Main")
  // so UI copy like "When is your BITSAT exam?" stays concise.
  const codeUpper = (examAdapter.exam_code ?? examAdapter.exam_id ?? '').toUpperCase();
  const shortNameMap: Record<string, string> = {
    'NEET-BIO': 'NEET Biology', 'NEET-PHYS': 'NEET Physics', 'NEET-CHEM': 'NEET Chemistry',
    'JEEMAIN': 'JEE Main', 'BITSAT': 'BITSAT', 'UGEE': 'UGEE', 'GATE': 'GATE',
  };
  let examShortName = examAdapter.exam_name; // fallback
  for (const [prefix, label] of Object.entries(shortNameMap)) {
    if (codeUpper.includes(prefix)) { examShortName = label; break; }
  }

  // If the authenticated student has a knowledge track registered, surface it
  // so OnboardPage / ExamProfilePage can display "CBSE Class 12" alongside.
  let knowledgeTrack: any = null;
  if (auth) {
    const { getProfile } = await import('../session-planner/exam-profile-store');
    const profile = getProfile(auth.user.id);
    const trackId = profile?.exams?.[0]?.knowledge_track_id;
    if (trackId) {
      const { getTrack } = await import('../knowledge/tracks');
      const t = getTrack(trackId);
      if (t) {
        knowledgeTrack = {
          id: t.id, display_name: t.display_name,
          board_name: t.board_name, grade_name: t.grade_name, subject_name: t.subject_name,
        };
      }
    }
  }

  sendJSON(res, {
    exam_id: examAdapter.exam_id,
    exam_name: examAdapter.exam_name,
    exam_short_name: examShortName,
    topics,
    knowledge_track: knowledgeTrack,
  });
}

/** POST /api/onboard — Save study profile to the flat-file store (no Postgres) */
async function handlePostOnboard(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = req.body as any;
  const { session_id, exam_date, exam_id, weekly_hours, topic_confidence, knowledge_track_id } = body;

  if (!exam_date || isNaN(new Date(exam_date).getTime())) {
    return sendError(res, 400, 'exam_date (ISO date string) is required');
  }

  // Prefer JWT auth so we save to the authenticated student's profile.
  const { getCurrentUser } = await import('../auth/middleware');
  const auth = await getCurrentUser(req);

  if (auth) {
    // Save to the flat-file exam-profile store.
    const { upsertProfile } = await import('../session-planner/exam-profile-store');
    const { getExamAdapter, loadBundledAdapters } = await import('../exam-builder/registry');
    try { loadBundledAdapters(); } catch {}

    // Determine exam_id: use the submitted one, or the student's first existing exam,
    // or the first registered adapter.
    let effectiveExamId = exam_id;
    if (!effectiveExamId) {
      const { getProfile } = await import('../session-planner/exam-profile-store');
      const existing = getProfile(auth.user.id);
      effectiveExamId = existing?.exams?.[0]?.exam_id;
    }
    if (!effectiveExamId) {
      const { listExamAdapters } = await import('../exam-builder/registry');
      effectiveExamId = listExamAdapters()[0]?.exam_id;
    }
    if (!effectiveExamId) return sendError(res, 503, 'No exam configured');

    // Validate knowledge_track_id if provided
    let validatedTrackId: string | undefined;
    if (knowledge_track_id) {
      const { getTrack } = await import('../knowledge/tracks');
      const track = getTrack(knowledge_track_id);
      if (!track) {
        return sendError(res, 400, `Unknown knowledge_track_id: ${knowledge_track_id}`);
      }
      validatedTrackId = knowledge_track_id;
    }

    const profile = upsertProfile(auth.user.id, [{
      exam_id: effectiveExamId,
      exam_date,
      weekly_hours: typeof weekly_hours === 'number' ? weekly_hours : 10,
      topic_confidence: topic_confidence ?? {},
      knowledge_track_id: validatedTrackId,
      added_at: new Date().toISOString(),
    }]);
    return sendJSON(res, { profile }, 201);
  }

  // Anonymous fallback: try Postgres; if unavailable, acknowledge without saving.
  try {
    const pool = getPool();
    if (!session_id) return sendError(res, 400, 'session_id or JWT auth is required');
    const result = await pool.query(
      `INSERT INTO study_profiles (session_id, exam_date, weekly_hours, topic_confidence)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id) DO UPDATE SET
         exam_date = EXCLUDED.exam_date,
         weekly_hours = EXCLUDED.weekly_hours,
         topic_confidence = EXCLUDED.topic_confidence,
         updated_at = NOW()
       RETURNING *`,
      [session_id, exam_date, weekly_hours || 10, JSON.stringify(topic_confidence || {})]
    );
    return sendJSON(res, { profile: result.rows[0] }, 201);
  } catch {
    // DB unavailable — acknowledge without persisting for anonymous users.
    return sendJSON(res, {
      profile: { session_id, exam_date, weekly_hours: weekly_hours || 10, topic_confidence: topic_confidence || {} }
    }, 201);
  }
}

/** GET /api/onboard/:sessionId — Get study profile */
async function handleGetOnboard(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { sessionId } = req.params;
  if (!sessionId) return sendError(res, 400, 'sessionId required');

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, session_id, exam_date, target_score, weekly_hours, topic_confidence,
              diagnostic_scores, diagnostic_taken_at, created_at, updated_at
       FROM study_profiles WHERE session_id = $1`,
      [sessionId]
    );
    if (result.rows.length === 0) return sendJSON(res, { profile: null });
    return sendJSON(res, { profile: result.rows[0] });
  } catch {
    // DB unavailable — return null profile so GateHome shows onboarding.
    return sendJSON(res, { profile: null });
  }
}

/** GET /api/diagnostic/:sessionId
 * Returns exam-aware diagnostic questions from the bundled sample data.
 * No Postgres required. Detects the student's exam from their JWT profile;
 * falls back to the first registered adapter for anonymous users.
 */
async function handleGetDiagnostic(req: ParsedRequest, res: ServerResponse): Promise<void> {
  // Prefer JWT auth (identifies the student's exam from their profile).
  const { getCurrentUser } = await import('../auth/middleware');
  const auth = await getCurrentUser(req);

  // Load exam adapters so we can pull sample questions.
  const { getExamAdapter, listExamAdapters, loadBundledAdapters } = await import('../exam-builder/registry');
  try { loadBundledAdapters(); } catch { /* already loaded */ }

  // Determine which exam to diagnose:
  //   1. JWT user -> read their primary exam from the flat-file profile store
  //   2. Anonymous -> fall back to the first registered adapter
  let examAdapter: any = null;
  if (auth) {
    const { getProfile: getExamProfile } = await import('../session-planner/exam-profile-store');
    const profile = getExamProfile(auth.user.id);
    const primaryExamId = profile?.exams?.[0]?.exam_id;
    if (primaryExamId) examAdapter = getExamAdapter(primaryExamId);
  }
  if (!examAdapter) {
    const all = listExamAdapters();
    examAdapter = all[0] ?? null;
  }
  if (!examAdapter) {
    return sendError(res, 503, 'No exam adapters registered');
  }

  // Pull sample questions from the adapter's bundled mock exam.
  const content = examAdapter.loadBaseContent();
  const allQuestions: any[] = content.mocks?.[0]?.questions ?? [];

  // Select 1 question per topic_id (up to 10 questions).
  const byTopic: Record<string, any> = {};
  for (const q of allQuestions) {
    const topicKey = q.topic_id ?? q.topic ?? 'general';
    if (!byTopic[topicKey]) byTopic[topicKey] = q;
  }
  const selected = Object.values(byTopic).slice(0, 10);

  // Normalise to the shape DiagnosticPage expects.
  // Different sample files use different schemas; we unify them here.
  const questions = selected.map((q: any, idx: number) => {
    const topicId = q.topic_id ?? q.topic ?? 'general';

    // Normalise options to [{text, is_correct}] shape
    let options: { text: string; is_correct: boolean }[] = [];
    if (Array.isArray(q.options) && q.options.length > 0) {
      if (typeof q.options[0] === 'string') {
        // NEET-style: options is string[], correct_index is an integer
        options = q.options.map((o: string, i: number) => ({
          text: o,
          is_correct: i === q.correct_index,
        }));
      } else if (typeof q.options[0] === 'object' && 'text' in q.options[0]) {
        // BITSAT/JEE-style: [{text, is_correct}]
        options = q.options;
      } else if (typeof q.options[0] === 'object' && 'id' in q.options[0]) {
        // GATE/MCQ-style: [{id:'A', text:'...'}] + correct_option_id
        const correctId = q.correct_option_id;
        options = q.options.map((o: any) => ({
          text: o.text ?? String(o),
          is_correct: o.id === correctId,
        }));
      }
    }

    return {
      index: idx,
      id: q.id ?? `q${idx}`,
      topic: topicId,
      topic_name: topicId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      question_text: q.statement ?? q.prompt ?? q.question_text ?? '',
      options,
      difficulty: q.difficulty ?? 'medium',
      exam_name: examAdapter.exam_name,
      explanation: q.explanation,
    };
  }).filter((q: any) => q.options.length >= 2 && q.question_text); // MCQ only, skip NAT

  sendJSON(res, {
    questions,
    total: questions.length,
    exam_id: examAdapter.exam_id,
    exam_name: examAdapter.exam_name,
  });
}

/** POST /api/diagnostic/:sessionId — Record diagnostic completion (flat-file, no Postgres) */
async function handlePostDiagnostic(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { sessionId } = req.params;

  const body = req.body as any;
  if (!body || !body.scores || typeof body.scores !== 'object') {
    return sendError(res, 400, 'scores object required (topic_id -> 0-1 accuracy)');
  }

  const entry = { scores: body.scores, taken_at: new Date().toISOString() };

  // Fire-and-forget: record to analytics adapter (non-blocking, swallows errors).
  const { getCurrentUser } = await import('../auth/middleware');
  const auth = await getCurrentUser(req);
  if (auth) {
    import('../operator/analytics-selector')
      .then(({ getAnalyticsAdapter }) => getAnalyticsAdapter().recordEvent({
        event_type: 'diagnostic_completed',
        at: entry.taken_at,
        actor_id: auth.user.id,
        props: {
          session_id: sessionId,
          scores: body.scores,
          correct: Object.values(body.scores).filter((s: any) => s === 1).length,
          total: Object.keys(body.scores).length,
        },
      }))
      .catch(() => {});
  }

  sendJSON(res, { ok: true, entry });
}

/** GET /api/today/:sessionId — Get/create today's daily plan (idempotent) */
async function handleGetToday(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { sessionId } = req.params;
  if (!sessionId) return sendError(res, 400, 'sessionId required');

  let pool: any;
  try {
    pool = getPool();
  } catch {
    // Postgres unavailable in demo mode — return null plan so GateHome
    // degrades to the onboarding/diagnostic state gracefully.
    return sendJSON(res, { plan: null });
  }
  const todayIST = getISTDate();

  // Check if plan already exists (most common path)
  const existing = await pool.query(
    'SELECT id, tasks, completed, plan_date, created_at FROM daily_plans WHERE session_id = $1 AND plan_date = $2',
    [sessionId, todayIST]
  );

  if (existing.rows.length > 0) {
    return sendJSON(res, { plan: existing.rows[0] });
  }

  // Get study profile
  const profileResult = await pool.query(
    `SELECT exam_date, target_score, weekly_hours, topic_confidence, diagnostic_scores
     FROM study_profiles WHERE session_id = $1`,
    [sessionId]
  );

  if (profileResult.rows.length === 0) {
    return sendError(res, 404, 'Study profile not found — complete onboarding first');
  }

  const profile = profileResult.rows[0];

  // Get SR stats for priority computation (JOIN with pyq_questions to get topic)
  const srResult = await pool2.query(`
    SELECT
      pq.topic,
      AVG(CASE WHEN ss.correct_count > 0 THEN ss.correct_count::float / NULLIF(ss.attempts, 0) ELSE 0 END) as accuracy,
      COUNT(*) as sessions_count,
      MAX(ss.updated_at) as last_practice_date
    FROM sr_sessions ss
    JOIN pyq_questions pq ON ss.pyq_id = pq.id
    WHERE ss.session_id = $1 AND pq.topic IS NOT NULL
    GROUP BY pq.topic
  `, [sessionId]);

  const srStats = srResult.rows.map((row: any) => ({
    topic: row.topic,
    accuracy: parseFloat(row.accuracy) || 0,
    sessions_count: parseInt(row.sessions_count) || 0,
    accuracy_first_5: parseFloat(row.accuracy) || 0, // Simplified: use overall accuracy
    accuracy_last_5: parseFloat(row.accuracy) || 0,
    last_practice_date: row.last_practice_date ? new Date(row.last_practice_date).toISOString() : null,
  }));

  // Get SR-due topics (JOIN with pyq_questions to get topic from pyq_id)
  const dueResult = await pool.query(`
    SELECT DISTINCT pq.topic FROM sr_sessions ss
    JOIN pyq_questions pq ON ss.pyq_id = pq.id
    WHERE ss.session_id = $1 AND ss.next_review <= CURRENT_DATE AND pq.topic IS NOT NULL
  `, [sessionId]);
  const srDueTopics = dueResult.rows.map((r: any) => r.topic);

  // Compute priorities
  const studyProfile = {
    exam_date: profile.exam_date,
    target_score: profile.target_score,
    weekly_hours: profile.weekly_hours || 10,
    topic_confidence: profile.topic_confidence || {},
    diagnostic_scores: profile.diagnostic_scores || [],
  };

  const priorities = computePriority(studyProfile, srStats, getISTNow());
  const tasks = generateDailyTasks(priorities, srDueTopics, studyProfile.weekly_hours);

  // Attach content previews to each task (dedup via content_served table)
  for (const task of tasks) {
    try {
      // Try to find a problem not yet served to this user
      let previewResult = await pool.query(
        `SELECT id, question_text, options, difficulty
         FROM pyq_questions
         WHERE topic = $1
           AND id NOT IN (SELECT content_id FROM content_served WHERE session_id = $2)
         ORDER BY RANDOM() LIMIT 1`,
        [task.topic, sessionId]
      );

      // Fallback: if all content exhausted, pick any random problem
      if (previewResult.rows.length === 0) {
        previewResult = await pool.query(
          `SELECT id, question_text, options, difficulty
           FROM pyq_questions WHERE topic = $1
           ORDER BY RANDOM() LIMIT 1`,
          [task.topic]
        );
      }

      if (previewResult.rows.length > 0) {
        const preview = previewResult.rows[0];
        (task as any).content_preview = {
          pyq_id: preview.id,
          question_text: preview.question_text,
          options: preview.options,
          difficulty: preview.difficulty,
        };
        // Track what we served for dedup + observability (fire-and-forget)
        await pool.query(
          `INSERT INTO content_served (session_id, content_id, source)
           VALUES ($1, $2, 'commander_preview')
           ON CONFLICT (session_id, content_id) DO NOTHING`,
          [sessionId, preview.id]
        ).catch(() => {});
        pool.query(
          `INSERT INTO content_pipeline_log (trace_id, session_id, source, topic, content_id, tier_used, latency_ms)
           VALUES ($1, $2, 'commander_preview', $3, $4, 'pyq_questions', 0)`,
          [randomUUID(), sessionId, task.topic, preview.id]
        ).catch(() => {});
      } else {
        (task as any).content_preview = null;
      }
    } catch (err) {
      console.error('[commander] Content preview error:', (err as Error).message);
      (task as any).content_preview = null;
    }
  }

  // INSERT...ON CONFLICT DO NOTHING for race condition safety
  await pool.query(
    `INSERT INTO daily_plans (session_id, plan_date, tasks)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id, plan_date) DO NOTHING`,
    [sessionId, todayIST, JSON.stringify(tasks)]
  );

  // Always SELECT to get the authoritative row
  const planResult = await pool.query(
    'SELECT id, tasks, completed, plan_date, created_at FROM daily_plans WHERE session_id = $1 AND plan_date = $2',
    [sessionId, todayIST]
  );

  sendJSON(res, { plan: planResult.rows[0] });
}

/** POST /api/today/:sessionId/:taskIdx/rate — Rate a completed task */
async function handleRateTask(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { sessionId, taskIdx } = req.params;
  if (!sessionId) return sendError(res, 400, 'sessionId required');

  const idx = parseInt(taskIdx, 10);
  if (isNaN(idx) || idx < 0) return sendError(res, 400, 'Invalid taskIdx');

  const body = req.body as any;
  const rating = body?.rating;
  if (!rating || !['easy', 'medium', 'hard', 'skip'].includes(rating)) {
    return sendError(res, 400, 'rating must be one of: easy, medium, hard, skip');
  }

  let pool: any;
  try {
    pool = getPool();
  } catch {
    // Demo mode — acknowledge without persisting
    return sendJSON(res, { ok: true });
  }
  const todayIST = getISTDate();

  // Get today's plan
  const planResult = await pool.query(
    'SELECT id, tasks, completed FROM daily_plans WHERE session_id = $1 AND plan_date = $2',
    [sessionId, todayIST]
  );

  if (planResult.rows.length === 0) {
    return sendError(res, 404, 'No plan found for today');
  }

  const plan = planResult.rows[0];
  const tasks = plan.tasks;

  if (idx >= tasks.length) {
    return sendError(res, 400, `taskIdx out of bounds (max: ${tasks.length - 1})`);
  }

  // Append completion entry
  const completionEntry = {
    task_idx: idx,
    rating,
    completed_at: new Date().toISOString(),
  };

  await pool.query(
    `UPDATE daily_plans
     SET completed = COALESCE(completed, '[]'::jsonb) || $3::jsonb
     WHERE session_id = $1 AND plan_date = $2`,
    [sessionId, todayIST, JSON.stringify([completionEntry])]
  );

  // Get updated plan
  const updated = await pool.query(
    'SELECT id, tasks, completed, plan_date, created_at FROM daily_plans WHERE session_id = $1 AND plan_date = $2',
    [sessionId, todayIST]
  );

  sendJSON(res, { plan: updated.rows[0] });
}

/** GET /api/priority/:sessionId — Get full priority ranking */
async function handleGetPriority(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { sessionId } = req.params;
  if (!sessionId) return sendError(res, 400, 'sessionId required');

  let pool2: any;
  try {
    pool2 = getPool();
  } catch {
    return sendJSON(res, { priorities: [], profile: null });
  }

  const profileResult = await pool2.query(
    `SELECT exam_date, target_score, weekly_hours, topic_confidence, diagnostic_scores
     FROM study_profiles WHERE session_id = $1`,
    [sessionId]
  );

  if (profileResult.rows.length === 0) {
    return sendJSON(res, { priorities: [], profile: null });
  }

  const profile = profileResult.rows[0];

  const srResult = await pool.query(`
    SELECT
      topic,
      AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as accuracy,
      COUNT(*) as sessions_count,
      MAX(created_at) as last_practice_date
    FROM sr_sessions
    WHERE session_id = $1 AND topic IS NOT NULL
    GROUP BY topic
  `, [sessionId]);

  const srStats = srResult.rows.map((row: any) => ({
    topic: row.topic,
    accuracy: parseFloat(row.accuracy) || 0,
    sessions_count: parseInt(row.sessions_count) || 0,
    accuracy_first_5: parseFloat(row.accuracy) || 0,
    accuracy_last_5: parseFloat(row.accuracy) || 0,
    last_practice_date: row.last_practice_date ? new Date(row.last_practice_date).toISOString() : null,
  }));

  const studyProfile = {
    exam_date: profile.exam_date,
    target_score: profile.target_score,
    weekly_hours: profile.weekly_hours || 10,
    topic_confidence: profile.topic_confidence || {},
    diagnostic_scores: profile.diagnostic_scores || [],
  };

  const priorities = computePriority(studyProfile, srStats, getISTNow());

  sendJSON(res, { priorities });
}

// ============================================================================
// Route definitions
// ============================================================================

export const commanderRoutes: RouteDefinition[] = [
  { method: 'GET',  path: '/api/onboard/meta',           handler: handleGetOnboardMeta },
  { method: 'POST', path: '/api/onboard',                handler: handlePostOnboard },
  { method: 'GET',  path: '/api/onboard/:sessionId',     handler: handleGetOnboard },
  { method: 'GET', path: '/api/diagnostic/:sessionId', handler: handleGetDiagnostic },
  { method: 'POST', path: '/api/diagnostic/:sessionId', handler: handlePostDiagnostic },
  { method: 'GET', path: '/api/today/:sessionId', handler: handleGetToday },
  { method: 'POST', path: '/api/today/:sessionId/:taskIdx/rate', handler: handleRateTask },
  { method: 'GET', path: '/api/priority/:sessionId', handler: handleGetPriority },
];
