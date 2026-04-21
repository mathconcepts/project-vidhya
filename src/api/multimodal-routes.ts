// @ts-nocheck
/**
 * Multimodal Routes
 *
 * Single endpoint that accepts an image (+ optional text + hinted intent)
 * and returns a structured response appropriate to the detected intent.
 *
 * POST /api/multimodal/analyze   — main entry
 *
 * Request shape (JSON body):
 *   {
 *     image: base64 string,
 *     image_mime_type: "image/jpeg" | "image/png",
 *     text?: string,
 *     user_hinted_intent?: "concept_question" | "solve_problem" | ...,
 *     scope?: "mcq-fast" | "subjective-long" | ...,
 *     session_id?: string,
 *     student?: { mastery_by_concept, recent_errors, ... }
 *   }
 *
 * Every successful call produces a GBrainEvent logged to the content
 * telemetry store (visible in /admin/content) so the cognitive model
 * learns from every image.
 */

import { ServerResponse } from 'http';
import crypto from 'crypto';
import { analyzeIntent } from '../multimodal/intent-analyzer';
import { dispatchByIntent } from '../multimodal/intent-handlers';
import { logMultimodalEvent } from '../multimodal/gbrain-logger';
import { suggestNextStep } from '../multimodal/next-step-suggester';
import { runDiagnosticStream } from '../multimodal/diagnostic-analyzer';
import { openSSE, errorSSE } from '../multimodal/sse-stream';
import { getConfigFromRequest } from '../llm/config-resolver';
import type { MultimodalRequest, MultimodalResponse } from '../multimodal/types';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

// ============================================================================
// Constants
// ============================================================================

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB base64 (≈7.5 MB raw)
const MAX_TEXT_LEN = 2000;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

// Cost estimate: one Flash-Lite vision call at typical image size
const INTENT_ANALYSIS_COST = 0.0005;

// ============================================================================
// Handler
// ============================================================================

async function handleAnalyze(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const start = Date.now();
  const body = (req.body as any) || {};

  // Validate input
  if (!body.image || typeof body.image !== 'string') {
    return sendError(res, 400, 'image (base64-encoded) required');
  }
  if (body.image.length > MAX_IMAGE_BYTES) {
    return sendError(res, 413, `image too large (max ${MAX_IMAGE_BYTES} bytes base64)`);
  }
  if (!body.image_mime_type || !ALLOWED_MIME.has(body.image_mime_type)) {
    return sendError(res, 400, `image_mime_type must be one of: ${[...ALLOWED_MIME].join(', ')}`);
  }
  if (body.text && (typeof body.text !== 'string' || body.text.length > MAX_TEXT_LEN)) {
    return sendError(res, 400, `text must be a string ≤ ${MAX_TEXT_LEN} chars`);
  }

  const multimodalReq: MultimodalRequest = {
    image: body.image,
    image_mime_type: body.image_mime_type,
    text: body.text,
    user_hinted_intent: body.user_hinted_intent,
    scope: body.scope,
    session_id: body.session_id,
    student: body.student,
  };

  try {
    // Pull LLM config from the user's browser via the header (or env fallback)
    const llm_config = getConfigFromRequest(req.headers);

    // Step 1: Vision analysis (single LLM call)
    const analysis = await analyzeIntent(multimodalReq, llm_config);

    // Step 2: Dispatch to the right handler based on detected intent
    const dispatchResult = await dispatchByIntent(analysis, multimodalReq);

    // Step 3: Assemble response
    const requestId = crypto.randomBytes(8).toString('hex');
    const latencyMs = Date.now() - start;

    const response: MultimodalResponse = {
      request_id: requestId,
      processed_at: new Date().toISOString(),
      analysis,
      ...dispatchResult,
      latency_ms: latencyMs,
      cost_estimate_usd: INTENT_ANALYSIS_COST,
    };

    // Compute the single (optional) next step to offer — may be null
    const nextStep = suggestNextStep(analysis, dispatchResult);
    if (nextStep) response.next_step = nextStep;

    // Step 4: Determine if the handling was successful
    const handled = !!(
      response.explanation?.summary ||
      response.practice_problems?.length ||
      response.solution?.final_answer ||
      response.ocr?.text
    );

    // Step 5: Log into GBrain — this is the privacy-safe, categorical event
    logMultimodalEvent({
      request: multimodalReq,
      analysis,
      response: dispatchResult,
      latency_ms: latencyMs,
      cost_estimate_usd: INTENT_ANALYSIS_COST,
      handled_successfully: handled,
    });

    sendJSON(res, response);
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

// ============================================================================
// Diagnostic handler — SSE stream for test-paper analysis
// ============================================================================

async function handleDiagnostic(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};

  // Validate
  if (!body.image || typeof body.image !== 'string') {
    return sendError(res, 400, 'image (base64-encoded) required');
  }
  if (body.image.length > MAX_IMAGE_BYTES) {
    return sendError(res, 413, `image too large (max ${MAX_IMAGE_BYTES} bytes base64)`);
  }
  if (!body.image_mime_type || !ALLOWED_MIME.has(body.image_mime_type)) {
    return sendError(res, 400, `image_mime_type must be one of: ${[...ALLOWED_MIME].join(', ')}`);
  }

  openSSE(res);
  try {
    await runDiagnosticStream({
      image: body.image,
      image_mime_type: body.image_mime_type,
      exam_id: body.exam_id,
      scope: body.scope,
      session_id: body.session_id,
      student: body.student,
    }, res);
  } catch (err) {
    errorSSE(res, (err as Error).message);
  }
}

export const multimodalRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST', path: '/api/multimodal/analyze', handler: handleAnalyze },
  { method: 'POST', path: '/api/multimodal/diagnostic', handler: handleDiagnostic },
];
