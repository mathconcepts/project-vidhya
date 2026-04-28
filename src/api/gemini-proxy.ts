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
import { getLlmForRole, embedText } from '../llm/runtime';

function sendError(res: ServerResponse, status: number, message: string) {
  sendJSON(res, { error: message }, status);
}

// Note: this file used to import @google/generative-ai directly. It now
// goes through src/llm/runtime, which falls back to env defaults
// (GEMINI_API_KEY, ANTHROPIC_API_KEY, etc.) and respects per-request
// LLM-config headers. Endpoints stay at /api/gemini/* for backward
// compatibility — the URL path doesn't dictate which provider serves
// the request.

/**
 * Resolve an actor id for rate-limit bucketing on these unauthenticated
 * endpoints. Priority order:
 *
 *   1. The body's `sessionId` if the client supplied one
 *   2. The X-Forwarded-For IP (first hop, in case of comma-separated
 *      proxy chain)
 *   3. The remote address from socket
 *   4. Literal 'anon' fallback
 *
 * SessionId-as-actor is the most useful — most public flows pass one
 * for state continuity. IP fallback works for genuinely anonymous
 * single-page hits but is shared across NAT'd networks. The 'anon'
 * fallback means a misconfigured request lands all spam in one
 * bucket — strictly more conservative than no rate limit.
 */
function getProxyActor(req: ParsedRequest): string {
  const body = (req.body as any) || {};
  if (typeof body.sessionId === 'string' && body.sessionId.trim()) {
    return `session:${body.sessionId.trim()}`;
  }
  const xff = req.headers['x-forwarded-for'];
  const ip = typeof xff === 'string' ? xff.split(',')[0].trim() : '';
  if (ip) return `ip:${ip}`;
  // ParsedRequest exposes raw socket via the Node request — best-effort
  const socketIp = (req as any).socket?.remoteAddress
                ?? (req as any).connection?.remoteAddress
                ?? '';
  if (socketIp) return `ip:${socketIp}`;
  return 'anon';
}

/**
 * Single-line rate-limit guard. Returns true when the request should
 * proceed; false when the response has already been sent (429).
 *
 * This wraps checkRateLimit so each handler stays a single readable
 * block. The shape mirrors how chat-routes.ts uses checkRateLimit.
 */
function rlGuard(endpoint: string, req: ParsedRequest, res: ServerResponse): boolean {
  const actor = getProxyActor(req);
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

// ============================================================================
// POST /api/gemini/classify-error
// ============================================================================

async function handleClassifyError(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!rlGuard('gemini.classify-error', req, res)) return;
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
  if (!text) return sendError(res, 500, 'Classification failed: LLM returned no response');
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    sendJSON(res, parsed);
  } catch (err) {
    sendError(res, 500, `Classification failed: bad JSON from LLM`);
  }
}

// ============================================================================
// POST /api/gemini/generate-problem
// ============================================================================

async function handleGenerateProblem(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!rlGuard('gemini.generate-problem', req, res)) return;
  const body = req.body as any;
  const { conceptId, conceptLabel, conceptDescription, difficulty, targetErrorType, format } = body || {};
  if (!conceptId) return sendError(res, 400, 'conceptId required');

  const llm = await getLlmForRole('json', req.headers);
  if (!llm) return sendError(res, 503, 'No LLM provider configured');

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
  if (!text) return sendError(res, 500, 'Generation failed: LLM returned no response');
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

    sendJSON(res, { ...parsed, verified, verification_answer: verifiedAnswer });
  } catch (err) {
    sendError(res, 500, `Generation failed: bad JSON from LLM`);
  }
}

// ============================================================================
// POST /api/gemini/embed
// ============================================================================

async function handleEmbed(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!rlGuard('gemini.embed', req, res)) return;
  const body = req.body as any;
  const { text } = body || {};
  if (!text || typeof text !== 'string') return sendError(res, 400, 'text required');

  // The runtime helper picks the best embedding provider from the
  // resolved config. Today: Gemini if available, OpenAI as fallback.
  const result = await embedText(text, req.headers);
  if (!result) return sendError(res, 503, 'No embedding provider configured');
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
  if (!rlGuard('gemini.vision-ocr', req, res)) return;
  const body = req.body as any;
  const { image, mimeType } = body || {};
  if (!image) return sendError(res, 400, 'image (base64) required');

  // Vision role — caller provides image, runtime helper picks a vision-
  // capable provider/model. Most providers have vision support today
  // (Gemini Flash, Claude Sonnet, GPT-4o, etc.).
  const llm = await getLlmForRole('vision', req.headers);
  if (!llm) return sendError(res, 503, 'No vision-capable provider configured');

  const text = await llm.generate({
    text: `Extract ALL text visible in this image, preserving mathematical notation in LaTeX.
If the image shows handwritten work, transcribe it exactly. If a math problem, include the full problem.
Respond with ONLY the extracted text, no commentary.`,
    image: { mimeType: mimeType || 'image/jpeg', data: image },
  });
  if (!text) return sendError(res, 500, 'OCR failed: LLM returned no response');
  sendJSON(res, { text: text.trim(), character_count: text.trim().length });
}

// ============================================================================
// POST /api/gemini/chat — SSE stream
// ============================================================================

async function handleGeminiChat(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!rlGuard('gemini.chat', req, res)) return;
  const body = req.body as any;
  const { message, history, systemPrompt, groundingChunks, image, imageMimeType } = body || {};
  if (!message) return sendError(res, 400, 'message required');

  // Vision role if image is present, chat role otherwise. Either way,
  // streaming dispatches via the runtime helper.
  const llm = await getLlmForRole(image ? 'vision' : 'chat', req.headers);
  if (!llm) return sendError(res, 503, 'No LLM provider configured');

  // Build system prompt with optional grounding
  const groundingText = (groundingChunks || []).length > 0
    ? `\n\n## Student's Uploaded Materials\n${(groundingChunks as string[]).join('\n---\n')}`
    : '';
  const fullSystem = (systemPrompt || 'You are a GATE Engineering Mathematics tutor.') + groundingText;

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

  try {
    const input: any = {
      text: message,
      system: fullSystem,
      history: normalizedHistory,
    };
    if (image) input.image = { mimeType: imageMimeType || 'image/jpeg', data: image };

    for await (const chunk of llm.generateStream(input)) {
      if (chunk) res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: (err as Error).message })}\n\n`);
    res.end();
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
