// @ts-nocheck
/**
 * Content Engine Routes
 *
 * HTTP surface for the four-tier content cascade. Called by both the client
 * and CI jobs. Stateless — no database.
 *
 * Endpoints:
 *   POST /api/content/resolve   — pipeline entry; returns a problem/explainer
 *   POST /api/content/verify    — Wolfram verification of a specific answer
 *   GET  /api/content/stats     — bundle inventory (public)
 *   GET  /api/content/explainer/:conceptId — direct explainer lookup
 */

import { ServerResponse } from 'http';
import { resolveContent, bundleStats } from '../content/resolver';
import { verifyProblemWithWolfram } from '../services/wolfram-service';
import { recordTelemetry, getTelemetrySummary } from '../content/telemetry';
import { requireRole } from './auth-middleware';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { getCurrentUser } from '../auth/middleware';
import { getOrCreateStudentModel } from '../gbrain/student-model';

async function handleResolve(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  if (!body.intent) return sendError(res, 400, 'intent required (practice|explain|verify)');

  // v2.13.0: GBrain-aware tier bias.
  //
  // Content tiers cascade from cheap+verified (tier-0 bundle) to
  // expensive+generative (tier-2 LLM) with tier-3 Wolfram verification
  // available for high-stakes. By default the cascade only escalates
  // on miss — but GBrain lets us bias the default ceiling based on
  // what the student actually needs.
  //
  // Struggling students (mastery < 0.3 on this concept) benefit most
  // from high-trust tier-0 canon + tier-3 Wolfram verification. LLM
  // generation (tier-2) adds variability that struggling students
  // don't need — they need canonical examples repeated until fluent.
  //
  // Confident students (mastery ≥ 0.7) can absorb tier-2 variations
  // profitably — different phrasings of the same concept keep them
  // engaged without confusion.
  //
  // This is OPT-IN and ADDITIVE: body.max_tier still wins if the
  // caller explicitly set it. We only bias when the caller left it
  // unspecified. Anonymous users fall through to default behavior.
  let gbrainInfluence: any = null;
  if (body.max_tier === undefined && body.concept_id) {
    try {
      const auth = await getCurrentUser(req);
      if (auth?.user?.id) {
        const model = await getOrCreateStudentModel(auth.user.id);
        const conceptEntry = model?.mastery_vector?.[body.concept_id];
        const score = conceptEntry?.score;
        if (typeof score === 'number') {
          if (score < 0.3) {
            // Cap at tier-3 Wolfram — skip tier-2 LLM generation
            // so struggling students see verified content only
            body.max_tier = 3;
            body.skip_tier_2 = true;  // honored by resolver when set
            gbrainInfluence = { reason: 'mastery_low', score, cap: 'verified_only' };
          } else if (score >= 0.7) {
            gbrainInfluence = { reason: 'mastery_high', score, cap: 'full_cascade' };
          } else {
            gbrainInfluence = { reason: 'mastery_mid', score, cap: 'default' };
          }
        }
      }
    } catch {}
  }

  try {
    const result = await resolveContent(body);
    // Auto-record telemetry (server-side, no extra client round-trip)
    recordTelemetry({
      source: result.source,
      latency_ms: result.latency_ms,
      cost_usd: result.cost_estimate_usd,
      topic: body.topic,
      concept_id: body.concept_id,
      tier_requested: body.max_tier,
      wolfram_verified: result.wolfram_verified,
    });
    sendJSON(res, {
      ...result,
      gbrain_influence: gbrainInfluence,  // null when GBrain didn't influence decision
    });
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

async function handleTelemetryIngest(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  const result = recordTelemetry(body);
  sendJSON(res, result);
}

async function handleTelemetrySummary(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'admin', 'teacher');
  if (!user) return;
  try {
    sendJSON(res, getTelemetrySummary());
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

async function handleVerify(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body as any) || {};
  const { problem_text, expected_answer } = body;
  if (!problem_text || !expected_answer) return sendError(res, 400, 'problem_text and expected_answer required');
  try {
    const result = await verifyProblemWithWolfram(problem_text, expected_answer);
    sendJSON(res, result);
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

async function handleStats(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  try {
    sendJSON(res, bundleStats());
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

async function handleExplainer(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const { conceptId } = req.params;
  if (!conceptId) return sendError(res, 400, 'conceptId required');
  try {
    const result = await resolveContent({ intent: 'explain', concept_id: conceptId, max_tier: 0 });
    if (result.source === 'miss') {
      return sendError(res, 404, `No explainer for concept: ${conceptId}`);
    }
    sendJSON(res, result);
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

export const contentRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST', path: '/api/content/resolve', handler: handleResolve },
  { method: 'POST', path: '/api/content/verify', handler: handleVerify },
  { method: 'GET', path: '/api/content/stats', handler: handleStats },
  { method: 'GET', path: '/api/content/explainer/:conceptId', handler: handleExplainer },
  { method: 'POST', path: '/api/content/telemetry', handler: handleTelemetryIngest },
  { method: 'GET', path: '/api/content/telemetry/summary', handler: handleTelemetrySummary },
];
