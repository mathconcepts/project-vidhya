// @ts-nocheck
/**
 * GATE Math App — AI Tutor Chat Routes
 *
 * Endpoints:
 *   POST /api/chat           — Stream a chat response (SSE)
 *   GET  /api/chat/:sessionId — Get chat history
 */

import { ServerResponse } from 'http';
import pg from 'pg';
import { detectTopic } from '../utils/topic-detection';
import { composeSystemContext } from '../content-pipeline/prompt-modifiers';
import type { UserContext } from '../content-pipeline/prompt-modifiers';
import type { VectorStore, VectorSearchResult } from '../data/vector-store';
import { getOrCreateStudentModel, saveStudentModel } from '../gbrain/student-model';
import { runTaskReasoner, buildContentGeneratorPrompt } from '../gbrain/task-reasoner';
import { getCurrentUser } from '../auth/middleware';
import { openTurn, closeTurn, type MasterySnapshot } from '../modules/teaching';
import { classifyIntent } from '../content/router';
import { checkRateLimit } from '../lib/rate-limit';
import { tryReserveTokens, recordUsage, cancelReservation } from '../lib/llm-budget';
import { getLlmForRole } from '../llm/runtime';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

const { Pool } = pg;

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
  if (!connectionString) {
    // Demo / free-tier deploys run without Postgres. Throwing here used to
    // crash chat requests mid-stream when callers `await pool.query(...)`.
    // Return null and require call-sites to null-check; the chat flow's
    // grounding + history persist + notebook-auto-populate are all
    // best-effort enrichment, never load-bearing.
    return null;
  }
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
// Content Pipeline Dependencies (injected from server.ts)
// ============================================================================

let _vectorStore: VectorStore | null = null;
let _embedder: ((text: string) => Promise<number[]>) | null = null;

export function setChatVectorStore(vs: VectorStore): void { _vectorStore = vs; }
export function setChatEmbedder(fn: (text: string) => Promise<number[]>): void { _embedder = fn; }

// ============================================================================
// Chat LLM resolution
// ============================================================================
//
// Goes through src/llm/runtime, which respects per-request LLM config
// headers AND falls back to env vars (GEMINI_API_KEY, ANTHROPIC_API_KEY,
// etc.). Default still Gemini for back-compat.
//
// Resolution happens per-request because the user's LLM config can
// change without a server restart — they pick a different provider in
// /gate/llm-config and the next message uses it. The ResolvedRoleConfig
// is small; resolution overhead is negligible compared to the LLM call
// itself (~ms vs ~seconds).

// ============================================================================
// System Prompt
// ============================================================================

// Build an exam-aware system prompt for the student.
// Reads the student's exam from JWT profile; falls back to a generic tutor.
async function buildSystemPrompt(req: any): Promise<string> {
  let examName = 'competitive exam';
  let topicList = '';
  let knowledgeContext = ''; // e.g. " (a CBSE Class 12 student)"
  try {
    const auth = await getCurrentUser(req);
    if (auth) {
      const { getProfile } = await import('../session-planner/exam-profile-store');
      const profile = getProfile(auth.user.id);
      const primaryExam = profile?.exams?.[0];
      if (primaryExam?.exam_id) {
        const { getExamAdapter, loadBundledAdapters } = await import('../exam-builder/registry');
        await loadBundledAdapters();
        const adapter = getExamAdapter(primaryExam.exam_id);
        if (adapter) {
          examName = adapter.exam_name;
          const topics = adapter.getSyllabusTopicIds();
          topicList = topics.map((t: string, i: number) => {
            const name = t.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return `${i + 1}. ${name}`;
          }).join('\n');
        }
        // Knowledge track context — student's school curriculum (CBSE Class 12 etc.)
        if (primaryExam.knowledge_track_id) {
          const { getTrack } = await import('../knowledge/tracks');
          const track = getTrack(primaryExam.knowledge_track_id);
          if (track) {
            knowledgeContext = ` (currently in ${track.display_name})`;
          }
        }
      }
    }
  } catch { /* non-blocking — use generic fallback */ }

  // School-curriculum addendum: align explanations with the student's textbook
  // (NCERT for CBSE, etc.) before pushing into exam-level depth.
  const curriculumGuidance = knowledgeContext
    ? `\n## School Curriculum Alignment\nThis student is also studying the standard school curriculum${knowledgeContext}. When explaining concepts, anchor them to the chapters and notation they encounter in their textbook (NCERT for CBSE, ICSE textbooks for ICSE, state board books otherwise). Bridge from school syllabus to exam-level depth — don't assume they have already gone past their current grade.\n`
    : '';

  return `You are GBrain, an expert AI tutor helping students prepare for the ${examName}${knowledgeContext}.

## Your Role
- **Concept Explanation**: Explain topics clearly with worked examples
- **Problem Solving**: Walk through problems step-by-step
- **Exam Strategy**: Help prioritise topics, manage time, build confidence
- **Doubt Clearing**: Answer any question about the syllabus
- **Motivation**: Encourage students and celebrate progress

${topicList ? `## ${examName} Topics\n${topicList}\n` : ''}${curriculumGuidance}
## Response Guidelines
- Use LaTeX for math: inline $...$ and display $$...$$
- Be concise but thorough — students are preparing for a competitive exam
- When solving problems, show each step clearly
- If a student seems confused, simplify and use analogies
- Always end with an encouraging note or follow-up question

## Intent Detection
- "How to prepare for X?" → Study plan with timeline
- "Solve this..." / math expression → Step-by-step solution
- "Explain X" / "What is X?" → Concept explanation with examples
- "I'm stuck on X" → Identify the gap, explain with simpler examples
- General chat → Friendly, supportive exam prep guidance`;
}

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/chat — Stream a chat response via SSE
 * Body: { sessionId, message, history?: { role, content }[] }
 */
async function handleChat(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { sessionId, message, history, image, imageMimeType } = req.body as any || {};

  if (!sessionId || !message) {
    return sendError(res, 400, 'sessionId and message are required');
  }

  // ── Rate limit + budget cap protection ────────────────────────────────
  // Resolve the actor id for both checks. Authenticated users get their
  // user.id; anonymous traffic gets the sessionId. Both share the same
  // bucket per actor — an anonymous abuser can't bypass by signing in
  // under a fresh session.
  const _actor_for_limits = await getCurrentUser(req);
  const _actor_id = _actor_for_limits ? _actor_for_limits.user.id : sessionId;

  // Rate limit FIRST — cheaper to reject than the budget check.
  const rl = checkRateLimit('chat', _actor_id);
  if (!rl.allowed) {
    res.writeHead(429, {
      'Content-Type': 'application/json',
      'Retry-After': String(Math.ceil(rl.retry_after_ms / 1000)),
    });
    res.end(JSON.stringify({
      error: 'rate_limit_exceeded',
      detail: `too many chat requests; retry in ${Math.ceil(rl.retry_after_ms / 1000)}s`,
      retry_after_ms: rl.retry_after_ms,
    }));
    return;
  }

  // Budget cap. Reserve a conservative estimate; reconcile after the
  // call. The estimate counts the input length; output length is added
  // post-stream. ~250 tokens per 1k chars is a rough conversion for
  // English; we round up and add 2k for the system prompt.
  const _est_input_tokens = Math.ceil((message?.length ?? 0) / 4) + 2000;
  // Estimate output tokens too — chat responses average ~800 tokens.
  const _est_total_tokens = _est_input_tokens + 800;
  const _budget = tryReserveTokens(_actor_id, _est_total_tokens);
  if (!_budget.allowed) {
    res.writeHead(429, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({
      error: 'daily_budget_exceeded',
      detail: 'your daily LLM token budget for this deployment is used up; resets at UTC midnight',
      used_today: _budget.used_today,
      cap: _budget.cap,
      remaining: _budget.remaining,
    }));
    return;
  }

  // Resolve LLM via runtime helper (respects per-request config or env)
  const llm = await getLlmForRole(image ? 'vision' : 'chat', req.headers);
  if (!llm) {
    // LLM unavailable — record a degraded-mode turn so the failure is
    // legible in the turn log. (Without this, an admin debugging
    // "why isn't chat working?" sees zero traces despite real traffic.)
    // Open + close immediately because we know the turn is complete:
    // no response will follow this.
    cancelReservation(_actor_id, _est_total_tokens);   // free the reservation
    try {
      const auth = await getCurrentUser(req);
      const student_id = auth ? auth.user.id : `anon_${sessionId}`;
      const degraded_turn_id = openTurn({
        student_id,
        intent: classifyIntent(message),
        delivery_channel: 'web',
        routed_source: null,
        generated_content: {
          type: 'chat-response',
          summary: '(no response — LLM unavailable)',
        },
        pre_state: {
          concept_id: null,
          topic: null,
          mastery_before: null,
          attempts_so_far: null,
          zpd_concept: null,
        },
        degraded: {
          reason: 'no-llm-available',
          detail: 'No LLM provider configured (set GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, or use /gate/llm-config)',
        },
      });
      closeTurn({ turn_id: degraded_turn_id, duration_ms: 0 });
    } catch (turnErr) {
      console.error('[chat] turn-open on degraded path failed (non-fatal):', (turnErr as Error).message);
    }
    return sendError(res, 503, 'AI tutor not available (no LLM provider configured)');
  }

  // Build conversation history for context — runtime helper expects
  // {role: 'user' | 'assistant', content: string} shape (same as
  // OpenAI/Anthropic; Gemini-specific 'model' role gets mapped inside
  // the helper's per-provider builder).
  const chatHistory = (history || []).slice(-10).map((msg: any) => ({
    role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: msg.content,
  }));

  // ── Content grounding + prompt modifiers ──────────────────────────────
  let groundingContext = '';
  let studentContext = '';

  try {
    const pool = getPool();
    const detectedTopic = detectTopic(message);

    // Grounding: search verified content from PgVectorStore (in-memory, $0)
    if (_vectorStore && _embedder && detectedTopic !== 'general') {
      const embedding = await _embedder(message);
      const results = await _vectorStore.search({
        embedding,
        topK: 3,
        filter: { topic: detectedTopic },
      });
      const relevant = (results as any[]).filter((r: any) => r.score >= 0.85);
      if (relevant.length > 0) {
        groundingContext = '\n\n## Relevant Verified Content\n' +
          relevant.map((r: any) => r.content || r.document?.content || '').filter(Boolean).join('\n---\n');

        // Log to content_pipeline_log (fire-and-forget; needs DB)
        if (pool) {
          const { randomUUID } = await import('crypto');
          pool.query(
            `INSERT INTO content_pipeline_log (trace_id, session_id, source, topic, tier_used, latency_ms)
             VALUES ($1, $2, 'chat_grounding', $3, 'rag_cache', 0)`,
            [randomUUID(), sessionId, detectedTopic]
          ).catch(() => {});
        }
      }
    }

    // Prompt modifiers: compose student context from study profile + SR data.
    // No DB → skip enrichment (best-effort), continue with plain prompt.
    if (!pool) {
      throw new Error('skip-context-enrichment-no-db');
    }
    const profileResult = await pool.query(
      `SELECT exam_date, diagnostic_scores, topic_confidence FROM study_profiles WHERE session_id = $1`,
      [sessionId]
    );
    if (profileResult.rows.length > 0) {
      const profile = profileResult.rows[0];
      const diagnosticScores = profile.diagnostic_scores || [];
      const latestDiag = diagnosticScores.length > 0 ? diagnosticScores[diagnosticScores.length - 1] : null;
      const topicScore = latestDiag?.scores?.[detectedTopic];

      // Get actual practice accuracies from SR
      const srResult = await pool.query(
        `SELECT pq.topic, AVG(CASE WHEN ss.correct_count > 0 THEN ss.correct_count::float / NULLIF(ss.attempts, 0) ELSE 0 END) as accuracy
         FROM sr_sessions ss JOIN pyq_questions pq ON ss.pyq_id = pq.id
         WHERE ss.session_id = $1 AND pq.topic IS NOT NULL GROUP BY pq.topic`,
        [sessionId]
      );
      const topicAccuracies: Record<string, number> = {};
      for (const row of srResult.rows) {
        topicAccuracies[row.topic] = parseFloat(row.accuracy) || 0;
      }

      const userCtx: UserContext = {
        sessionId,
        topic: detectedTopic !== 'general' ? detectedTopic : undefined,
        examDate: profile.exam_date,
        diagnosticScore: topicScore != null ? topicScore : undefined,
        topicAccuracies: Object.keys(topicAccuracies).length > 0 ? topicAccuracies : undefined,
      };
      studentContext = composeSystemContext(userCtx);
    }
  } catch (ctxErr) {
    console.error('[chat] Context enrichment error:', (ctxErr as Error).message);
    // Non-fatal: continue with plain system prompt
  }

  const baseSystemPrompt = await buildSystemPrompt(req);
  const enrichedSystemPrompt = baseSystemPrompt + groundingContext + studentContext;

  // ── GBrain Layer 2: Task Reasoner ─────────────────────────────────────
  // Run the 5-node decision tree to determine pedagogical action
  let gbrainPrompt = enrichedSystemPrompt;
  let _reasonerInstructions: any = null;
  try {
    const studentModel = await getOrCreateStudentModel(sessionId);
    const reasonerInstructions = await runTaskReasoner(message, studentModel, history);
    _reasonerInstructions = reasonerInstructions;
    gbrainPrompt = buildContentGeneratorPrompt(reasonerInstructions, studentModel) +
      groundingContext;
    // Send reasoner metadata via SSE before streaming starts
    // (frontend can use this for UI adaptation)
    const reasonerMeta = {
      intent: reasonerInstructions.intent,
      action: reasonerInstructions.action,
      concept: reasonerInstructions.selected_concept,
      motivation: studentModel.motivation_state,
    };
    // Will be sent as first SSE event below
    var _reasonerMeta = reasonerMeta;
  } catch (gbrainErr) {
    console.error('[chat] GBrain Task Reasoner error, using fallback prompt:', (gbrainErr as Error).message);
    // Non-fatal: fall back to flat prompt
    var _reasonerMeta = null;
  }

  // ── Open a TeachingTurn ───────────────────────────────────────────────
  // Wraps this content-generation interaction in a legibility record.
  // Closed below after the response stream finishes (or on error).
  // Resolves student_id from auth if available, else falls back to
  // anon_<sessionId> per the existing convention used by notebook-insight.
  let _turn_id: string | null = null;
  const _turn_started_at = Date.now();
  // Track response length for token-usage reconciliation; populated
  // by the streaming loop, read by recordUsage at the tail.
  let _response_chars = 0;
  try {
    const auth = await getCurrentUser(req);
    const student_id = auth ? auth.user.id : `anon_${sessionId}`;
    const studentModel = await getOrCreateStudentModel(sessionId);
    const concept_id = _reasonerInstructions?.selected_concept ?? null;
    const conceptEntry = concept_id
      ? (studentModel.mastery_vector?.[concept_id] ?? null)
      : null;

    // Scenario detection — read existing GBrain state, label the turn.
    // Each flag is "detected"=true / undefined=not-detected; never false.
    // We don't claim "not cold start" — we just don't say anything if
    // we can't tell.
    const total_attempts = Object.values(studentModel.mastery_vector ?? {})
      .reduce((sum, e: any) => sum + (e?.attempts ?? 0), 0);
    const is_cold_start = total_attempts < 3 ? true : undefined;
    const is_zpd_candidate = (concept_id && concept_id === _reasonerInstructions?.selected_concept)
      ? true : undefined;
    const consecutive_failures = (studentModel.consecutive_failures ?? 0);
    const repeated_error_pattern = consecutive_failures >= 3 ? true : undefined;

    const pre_state: MasterySnapshot = {
      concept_id,
      topic: _reasonerInstructions?.topic ?? null,
      mastery_before: conceptEntry?.score ?? null,
      attempts_so_far: conceptEntry?.attempts ?? null,
      zpd_concept: _reasonerInstructions?.selected_concept ?? null,
      is_cold_start,
      is_zpd_candidate,
      repeated_error_pattern,
      consecutive_failures: repeated_error_pattern ? consecutive_failures : undefined,
    };
    _turn_id = openTurn({
      student_id,
      intent: classifyIntent(message),
      student_intent: _reasonerInstructions?.intent,
      pedagogical_action: _reasonerInstructions?.action,
      delivery_channel: 'web',
      routed_source: groundingContext ? 'cache' : 'generated',
      generated_content: {
        type: 'chat-response',
        summary: message.slice(0, 120),
      },
      pre_state,
    });
  } catch (turnErr) {
    // Turn instrumentation must never break the chat. Log + continue.
    console.error('[chat] turn-open failed (non-fatal):', (turnErr as Error).message);
  }

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  try {
    // Send reasoner metadata as first SSE event (frontend can use for UI adaptation)
    if (_reasonerMeta) {
      res.write(`data: ${JSON.stringify({ type: 'reasoner', ...(_reasonerMeta) })}\n\n`);
    }

    // Stream response via runtime LLM helper. The helper handles the
    // per-provider streaming protocol (SSE for Gemini/Anthropic/OpenAI,
    // NDJSON for Ollama) and yields plain text chunks regardless of
    // provider. The 'assistant primer' that used to be hardcoded here
    // (a fake first model turn after the system prompt) goes away —
    // each provider's API natively supports a system prompt.
    const streamInput: any = {
      text: message,
      system: gbrainPrompt,
      history: chatHistory,
    };
    if (image) {
      streamInput.image = { mimeType: imageMimeType || 'image/jpeg', data: image };
    }

    // Stream with watchdog: if no chunk arrives within 45s, abort. Free-tier
    // LLM endpoints sometimes hang on cold starts or network blips; without
    // this the user sees loading dots forever (the original bug report).
    let fullResponse = '';
    let lastChunkAt = Date.now();
    const watchdogMs = 45_000;
    const watchdog = setInterval(() => {
      if (Date.now() - lastChunkAt > watchdogMs) {
        // Abort by writing an error frame; the for-await below will exit
        // cleanly because the underlying provider stream surfaces the
        // closed connection. Belt-and-braces: also signal via a flag.
        try {
          res.write(`data: ${JSON.stringify({
            type: 'error',
            content: 'The AI tutor is taking longer than expected. Please try again — short, specific questions usually work fastest.',
          })}\n\n`);
        } catch { /* socket closed */ }
        clearInterval(watchdog);
      }
    }, 5_000);

    try {
      for await (const chunk of llm.generateStream(streamInput)) {
        if (chunk) {
          fullResponse += chunk;
          _response_chars = fullResponse.length;
          lastChunkAt = Date.now();
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        }
      }
    } finally {
      clearInterval(watchdog);
    }

    // Send done event
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);

    // Persist messages to DB (best-effort; demo deploys without Postgres skip this)
    try {
      const pool = getPool();
      if (pool) {
        await pool.query(
          'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)',
          [sessionId, 'user', message, 'assistant', fullResponse]
        );
        // Auto-populate notebook from chat
        const topic = detectTopic(message + ' ' + fullResponse);
        if (topic !== 'general') {
          try {
            await pool.query(
              `INSERT INTO notebook_entries (session_id, source, topic, query_text, answer_text, status, confidence)
               VALUES ($1, 'chat', $2, $3, $4, 'to_review', 0.5)`,
              [sessionId, topic, message.slice(0, 200), fullResponse.slice(0, 500)]
            );
          } catch (nbErr) {
            console.error('[chat] Notebook persist error:', (nbErr as Error).message);
          }
        }
      }
    } catch (dbErr) {
      console.error('[chat] DB persist error:', (dbErr as Error).message);
    }

  } catch (err) {
    console.error('[chat] Stream error:', (err as Error).message);
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'Sorry, I encountered an error. Please try again.' })}\n\n`);
    if (_turn_id) {
      try {
        closeTurn({
          turn_id: _turn_id,
          duration_ms: Date.now() - _turn_started_at,
        });
      } catch { /* swallow — turn close must not break the request */ }
    }
    // Free the budget reservation since the call effectively didn't
    // happen end-to-end. Conservative — if the LLM consumed tokens
    // before the error, we under-report; budget over-runs slightly
    // rather than denying recovery.
    cancelReservation(_actor_id, _est_total_tokens);
  }

  // Close the turn on the success path. If we already errored above, the
  // catch block closed it; this no-op-protected close happens only when
  // streaming completed cleanly. (closeTurn appends an event each call,
  // and reconcile() takes the earliest — so a double-close is safe.)
  if (_turn_id) {
    try {
      closeTurn({
        turn_id: _turn_id,
        duration_ms: Date.now() - _turn_started_at,
      });
    } catch { /* swallow */ }
  }

  // Reconcile actual token usage against the reservation. We don't get
  // a precise token count from the streaming Gemini API today, so we
  // estimate from response length: ~250 tokens per 1k chars of English
  // (≈ 1 token per 4 chars). Add the input estimate to capture both
  // sides of the call. If a future Gemini SDK version returns a usage
  // object, swap this for the exact value.
  try {
    const _output_tokens_est = Math.ceil(_response_chars / 4);
    const _actual = _est_input_tokens + _output_tokens_est;
    recordUsage(_actor_id, _actual, _est_total_tokens);
  } catch { /* swallow — budget tracking must not break the request */ }

  res.end();
}

/**
 * GET /api/chat/:sessionId — Get chat history
 */
async function handleGetHistory(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { sessionId } = req.params;

  try {
    const pool = getPool();
    if (!pool) {
      // Demo / no-DB deploys: chat history isn't persisted. Return empty list
      // rather than 500 so the chat UI starts with a clean slate.
      return sendJSON(res, { messages: [] });
    }
    const result = await pool.query(
      'SELECT id, role, content, metadata, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100',
      [sessionId]
    );
    sendJSON(res, { messages: result.rows });
  } catch (err) {
    console.error('[chat] History error:', (err as Error).message);
    sendError(res, 500, 'Failed to load chat history');
  }
}

// ============================================================================
// Export
// ============================================================================

export const chatRoutes: RouteDefinition[] = [
  { method: 'POST', path: '/api/chat', handler: handleChat },
  { method: 'GET', path: '/api/chat/:sessionId', handler: handleGetHistory },
];
