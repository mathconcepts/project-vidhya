// @ts-nocheck
/**
 * Gemini Proxy Routes — Stateless.
 *
 * Pure LLM/vision/embedding relay. No database. No persistence.
 * Client is responsible for passing context and storing results.
 *
 * Endpoints:
 *   POST /api/gemini/classify-error   — classify a wrong answer
 *   POST /api/gemini/generate-problem — generate + verify a problem
 *   POST /api/gemini/embed            — get an embedding (server-side Gemini)
 *   POST /api/gemini/vision-ocr       — OCR an image (handwritten notes/work)
 *   POST /api/gemini/chat             — SSE chat with reasoner + grounding
 *
 * Replaces: /api/gbrain/attempt (when caller is DB-less)
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { checkRateLimit } from '../lib/rate-limit';
import { tryReserveTokens, recordUsage, cancelReservation } from '../lib/llm-budget';
import { requireAuth } from '../auth/middleware';
import { getLlmForRole, embedText } from '../llm/runtime';
import { validateSystemPrompt, getAllowedPromptPrefixes } from './gemini-prompt-validator';

function sendError(res: ServerResponse, status: number, message: string) {
  sendJSON(res, { error: message }, status);
}

// Note: this file used to import @google/generative-ai directly. It now
// goes through src/llm/runtime, which falls back to env defaults
// (GEMINI_API_KEY, ANTHROPIC_API_KEY, etc.) and respects per-request
// LLM-config headers. Endpoints stay at /api/gemini/* for backward
// compatibility — the URL path doesn't dictate which provider serves
// the request.
//
// Auth: as of this commit all 5 endpoints require an authenticated user.
// Anonymous calls return 401. The previous unauthenticated state was a
// real cost-leak (anyone hitting the deployment URL spent the operator's
// tokens) flagged in PRODUCTION.md. With auth in place, the rate-limit
// actor becomes `user:${user.id}` and per-user budget caps apply.

/**
 * Single-line rate-limit guard. Returns true when the request should
 * proceed; false when the response has already been sent (429).
 *
 * Now that auth is required upstream, the actor is the authenticated
 * user — same key the chat handler uses, so a user's chat + gemini-proxy
 * traffic share buckets where appropriate. Pass the user id explicitly
 * since it's resolved once per handler.
 */
function rlGuard(endpoint: string, actor: string, res: ServerResponse): boolean {
  const rl = checkRateLimit(endpoint, actor);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(Math.ceil((rl.retry_after_ms ?? 1000) / 1000)));
    sendJSON(res, {
      error: 'rate_limit_exceeded',
      endpoint,
      retry_after_ms: rl.retry_after_ms,
    }, 429);
    return false;
  }
  return true;
}

/**
 * Reserve a budget for an LLM call. Returns the reservation amount
 * if allowed, null if budget exceeded (and sends 429). Caller is
 * responsible for one of `recordUsage` (success path) or
 * `cancelReservation` (failure path).
 *
 * Estimates per endpoint, in tokens (input + output, mixed pricing
 * approximation — exact token counts vary per provider but the
 * budget cap is in our normalized "tokens" unit):
 *
 *   classify-error    ~1500 tokens (small JSON in/out)
 *   generate-problem  ~3000 tokens (does 2 calls — gen + verify)
 *   embed             ~200  tokens (cheap, but counted)
 *   vision-ocr        ~2000 tokens (image input weight)
 *   chat              ~4000 tokens (longer responses, multi-turn)
 */
function budgetGuard(
  endpoint: string,
  actor: string,
  estTokens: number,
  res: ServerResponse,
): number | null {
  const result = tryReserveTokens(actor, estTokens);
  if (!result.allowed) {
    sendJSON(res, {
      error: 'budget_exceeded',
      endpoint,
      detail: `daily token budget exceeded — ${result.used_today}/${result.cap} tokens used today`,
      remaining: result.remaining,
    }, 429);
    return null;
  }
  return estTokens;
}

// ============================================================================
// POST /api/gemini/classify-error
// ============================================================================

async function handleClassifyError(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const actor = `user:${auth.user.id}`;

  if (!rlGuard('gemini.classify-error', actor, res)) return;

  const body = req.body as any;
  const { problem, studentAnswer, correctAnswer, timeTakenMs } = body || {};
  if (!problem || !studentAnswer || !correctAnswer) return sendError(res, 400, 'problem, studentAnswer, correctAnswer required');

  // Use the 'json' role since we ask the model for structured output
  const llm = await getLlmForRole('json', req.headers);
  if (!llm) {
    return sendJSON(res, {
      error_type: 'conceptual',
      concept_id: 'unknown',
      misconception_id: 'unclassified',
      diagnosis: 'Classification service unavailable.',
      why_tempting: '',
      why_wrong: '',
      corrective_hint: 'Review the topic and try again.',
    });
  }

  const reservation = budgetGuard('gemini.classify-error', actor, 1500, res);
  if (reservation === null) return;

  const prompt = `You are an expert math error diagnostician.
Classify this error. Respond ONLY with JSON (no markdown):
{
  "error_type": "conceptual|procedural|notation|misread|time_pressure|arithmetic|overconfidence_skip",
  "concept_id": "kebab-case-concept",
  "misconception_id": "brief-kebab-misconception-name",
  "diagnosis": "One sentence",
  "why_tempting": "One sentence",
  "why_wrong": "One sentence",
  "corrective_hint": "One sentence"
}

Problem: ${problem}
Student's answer: ${studentAnswer}
Correct answer: ${correctAnswer}
${timeTakenMs ? `Time: ${Math.round(timeTakenMs / 1000)}s` : ''}`;

  const text = await llm.generate(prompt);
  if (!text) {
    cancelReservation(actor, reservation);
    return sendError(res, 500, 'Classification failed: LLM returned no response');
  }
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    // Reconcile actual usage. Rough rule: 1 token ≈ 4 chars (input+output).
    const actualTokens = Math.ceil((prompt.length + text.length) / 4);
    recordUsage(actor, actualTokens, reservation);
    sendJSON(res, parsed);
  } catch (err) {
    cancelReservation(actor, reservation);
    sendError(res, 500, `Classification failed: bad JSON from LLM`);
  }
}

// ============================================================================
// POST /api/gemini/generate-problem
// ============================================================================

async function handleGenerateProblem(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const actor = `user:${auth.user.id}`;

  if (!rlGuard('gemini.generate-problem', actor, res)) return;

  const body = req.body as any;
  const { conceptId, conceptLabel, conceptDescription, difficulty, targetErrorType, format } = body || {};
  if (!conceptId) return sendError(res, 400, 'conceptId required');

  const llm = await getLlmForRole('json', req.headers);
  if (!llm) return sendError(res, 503, 'No LLM provider configured');

  // Two LLM calls (gen + verify), so reservation is double the per-call estimate
  const reservation = budgetGuard('gemini.generate-problem', actor, 3000, res);
  if (reservation === null) return;

  const diffLabel = difficulty < 0.33 ? 'easy' : difficulty < 0.66 ? 'medium' : 'hard';

  const prompt = `Generate a ${diffLabel} difficulty ${format === 'mcq' ? 'multiple choice' : 'numerical answer'} GATE math problem.

Topic: ${conceptLabel || conceptId}
Description: ${conceptDescription || ''}
Difficulty: ${diffLabel} (${Math.round((difficulty || 0.5) * 100)}%)
${targetErrorType ? `Target error type: "${targetErrorType}" — design so a student making this error gets a specific wrong answer.` : ''}

Respond ONLY with JSON (no markdown):
{
  "question_text": "The problem in LaTeX",
  "correct_answer": "The exact answer",
  "solution_steps": ["Step 1", "Step 2"],
  "distractors": ["wrong 1", "wrong 2", "wrong 3"]
}`;

  const text = await llm.generate(prompt);
  if (!text) {
    cancelReservation(actor, reservation);
    return sendError(res, 500, 'Generation failed: LLM returned no response');
  }
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Self-verify
    const verifyPrompt = `Solve independently. End with: ANSWER: <final>

Problem: ${parsed.question_text}`;
    const verifyText = await llm.generate(verifyPrompt) || '';
    const match = verifyText.match(/ANSWER:\s*(.+)/i);
    const verifiedAnswer = match ? match[1].trim() : '';

    const normalize = (s: string) => (s || '').replace(/\s+/g, '').replace(/\$/g, '').toLowerCase();
    const expected = parsed.correct_answer.trim();
    const numE = parseFloat(expected), numA = parseFloat(verifiedAnswer);
    const verified = expected === verifiedAnswer
      || normalize(expected) === normalize(verifiedAnswer)
      || (!isNaN(numE) && !isNaN(numA) && Math.abs(numE - numA) < 0.001);

    // Reconcile both calls together
    const actualTokens = Math.ceil((prompt.length + text.length + verifyPrompt.length + verifyText.length) / 4);
    recordUsage(actor, actualTokens, reservation);

    sendJSON(res, { ...parsed, verified, verification_answer: verifiedAnswer });
  } catch (err) {
    cancelReservation(actor, reservation);
    sendError(res, 500, `Generation failed: bad JSON from LLM`);
  }
}

// ============================================================================
// POST /api/gemini/embed
// ============================================================================

async function handleEmbed(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const actor = `user:${auth.user.id}`;

  if (!rlGuard('gemini.embed', actor, res)) return;

  const body = req.body as any;
  const { text } = body || {};
  if (!text || typeof text !== 'string') return sendError(res, 400, 'text required');

  const reservation = budgetGuard('gemini.embed', actor, 200, res);
  if (reservation === null) return;

  // The runtime helper picks the best embedding provider from the
  // resolved config. Today: Gemini if available, OpenAI as fallback.
  const result = await embedText(text, req.headers);
  if (!result) {
    cancelReservation(actor, reservation);
    return sendError(res, 503, 'No embedding provider configured');
  }

  // Embeddings consume input tokens only; rough estimate from char count
  const actualTokens = Math.ceil(text.length / 4);
  recordUsage(actor, actualTokens, reservation);

  sendJSON(res, {
    embedding:   result.embedding,
    dim:         result.dim,
    provider_id: result.provider_id,
    model_id:    result.model_id,
  });
}

// ============================================================================
// POST /api/gemini/vision-ocr
// ============================================================================

async function handleVisionOCR(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const actor = `user:${auth.user.id}`;

  if (!rlGuard('gemini.vision-ocr', actor, res)) return;

  const body = req.body as any;
  const { image, mimeType } = body || {};
  if (!image) return sendError(res, 400, 'image (base64) required');

  // Vision role — caller provides image, runtime helper picks a vision-
  // capable provider/model. Most providers have vision support today
  // (Gemini Flash, Claude Sonnet, GPT-4o, etc.).
  const llm = await getLlmForRole('vision', req.headers);
  if (!llm) return sendError(res, 503, 'No vision-capable provider configured');

  const reservation = budgetGuard('gemini.vision-ocr', actor, 2000, res);
  if (reservation === null) return;

  const text = await llm.generate({
    text: `Extract ALL text visible in this image, preserving mathematical notation in LaTeX.
If the image shows handwritten work, transcribe it exactly. If a math problem, include the full problem.
Respond with ONLY the extracted text, no commentary.`,
    image: { mimeType: mimeType || 'image/jpeg', data: image },
  });
  if (!text) {
    cancelReservation(actor, reservation);
    return sendError(res, 500, 'OCR failed: LLM returned no response');
  }

  // Vision input is hard to estimate accurately; rough tokens for image + output text
  const actualTokens = Math.ceil(text.length / 4) + 1500; // ~1500 token-equivalent for the image
  recordUsage(actor, actualTokens, reservation);

  sendJSON(res, { text: text.trim(), character_count: text.trim().length });
}

// ============================================================================
// POST /api/gemini/chat — SSE stream
// ============================================================================

async function handleGeminiChat(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const actor = `user:${auth.user.id}`;

  if (!rlGuard('gemini.chat', actor, res)) return;

  const body = req.body as any;
  const {
    message,
    history,
    systemPrompt,
    student_context,    // new — opaque dynamic context (reasoner decision,
                        // student profile, etc). Appended to the validated
                        // tutor identity. Not validated; used only after
                        // the tutor identity has been pinned.
    groundingChunks,
    image,
    imageMimeType,
  } = body || {};
  if (!message) return sendError(res, 400, 'message required');

  // Validate user-supplied systemPrompt against the per-exam whitelist.
  // Done BEFORE LLM resolution and budget reservation — no point spending
  // either on a request we're going to reject. Empty/undefined systemPrompt
  // is OK; the handler falls back to a server-supplied default below.
  const userExamId = (auth.user as any).exam_id as string | undefined;
  const validation = validateSystemPrompt(systemPrompt, userExamId);
  if (!validation.ok) {
    return sendJSON(res, {
      error: 'system_prompt_rejected',
      detail: validation.reason,
    }, 400);
  }

  // Vision role if image is present, chat role otherwise. Either way,
  // streaming dispatches via the runtime helper.
  const llm = await getLlmForRole(image ? 'vision' : 'chat', req.headers);
  if (!llm) return sendError(res, 503, 'No LLM provider configured');

  const reservation = budgetGuard('gemini.chat', actor, 4000, res);
  if (reservation === null) return;

  // Build the system prompt in three layers:
  //   1. Tutor identity (validated systemPrompt OR exam-specific default)
  //   2. Optional student_context (reasoner decision, profile, etc.)
  //   3. Optional grounding chunks (uploaded materials snippets)
  let baseSystem: string;
  if (systemPrompt && systemPrompt.trim()) {
    baseSystem = systemPrompt;
  } else {
    // Default: pick the first allowed prefix for the user's exam.
    // Was hardcoded "GATE Engineering Mathematics" before — wrong for
    // BITSAT/NEET/etc. users.
    const allowed = getAllowedPromptPrefixes(userExamId);
    baseSystem = allowed[0] ?? 'You are an expert tutor.';
  }
  const contextText = student_context && typeof student_context === 'string' && student_context.trim()
    ? `\n\n${student_context.trim()}`
    : '';
  const groundingText = (groundingChunks || []).length > 0
    ? `\n\n## Student's Uploaded Materials\n${(groundingChunks as string[]).join('\n---\n')}`
    : '';
  const fullSystem = baseSystem + contextText + groundingText;

  // History — last 10 turns, normalized to the runtime's role/content shape.
  const normalizedHistory = (history || [])
    .slice(-10)
    .map((m: any) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    }));

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  let fullResponse = '';
  let streamErrored = false;
  try {
    const input: any = {
      text: message,
      system: fullSystem,
      history: normalizedHistory,
    };
    if (image) input.image = { mimeType: imageMimeType || 'image/jpeg', data: image };

    for await (const chunk of llm.generateStream(input)) {
      if (chunk) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    streamErrored = true;
    res.write(`data: ${JSON.stringify({ type: 'error', error: (err as Error).message })}\n\n`);
    res.end();
  }

  // Reconcile budget. If the stream errored before any chunks, it's a
  // wash — cancel. If chunks streamed, count what was actually delivered.
  if (streamErrored && fullResponse.length === 0) {
    cancelReservation(actor, reservation);
  } else {
    const actualTokens = Math.ceil((message.length + fullSystem.length + fullResponse.length) / 4);
    recordUsage(actor, actualTokens, reservation);
  }
}

// ============================================================================
// Export routes
// ============================================================================

export const geminiProxyRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST', path: '/api/gemini/classify-error', handler: handleClassifyError },
  { method: 'POST', path: '/api/gemini/generate-problem', handler: handleGenerateProblem },
  { method: 'POST', path: '/api/gemini/embed', handler: handleEmbed },
  { method: 'POST', path: '/api/gemini/vision-ocr', handler: handleVisionOCR },
  { method: 'POST', path: '/api/gemini/chat', handler: handleGeminiChat },
];
