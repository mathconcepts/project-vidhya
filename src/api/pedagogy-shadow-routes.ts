/**
 * src/api/pedagogy-shadow-routes.ts — the Tier 4 flip readout. Admin, read-only.
 *
 *   GET /api/admin/pedagogy-shadow →
 *     { source, distribution, verdict, current_threshold, would_block_now }
 *
 * The gate is switched on by setting VIDHYA_PEDAGOGY_GATE=on, and until now
 * there was no way to know what that would do. `verdict.ready` says whether
 * the data supports flipping at all; `verdict.suggested_threshold` is derived
 * from the observed spread rather than validating the hardcoded 0.65.
 *
 * `would_block_now` is the number an operator actually needs: the share of
 * scored content the CURRENT threshold would refuse if the gate went on today.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { summarize, flipVerdict, DEFAULT_SHADOW_THRESHOLD } from '../content/verifiers/pedagogy-shadow';
import { getPedagogyShadowRepo } from '../storage/repositories/pedagogy-shadow-repo';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

async function handlePedagogyShadow(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'admin');
  if (!user) return;

  const repo = getPedagogyShadowRepo();
  const rows = await repo.all();
  const d = summarize(rows);
  const verdict = flipVerdict(rows);
  const currentThreshold =
    parseFloat(process.env.VIDHYA_PEDAGOGY_THRESHOLD ?? '') || DEFAULT_SHADOW_THRESHOLD;

  sendJSON(res, {
    source: repo.describe(),
    gate_enabled: process.env.VIDHYA_PEDAGOGY_GATE === 'on',
    current_threshold: currentThreshold,
    // The operator-facing number: what flipping the gate today would cost.
    would_block_now: d.scored === 0 ? null : d.would_block_at(currentThreshold),
    distribution: {
      observed: d.observed,
      scored: d.scored,
      errored: d.errored,
      error_rate: d.error_rate,
      p10: d.p10,
      p50: d.p50,
      p90: d.p90,
      min: d.min,
      max: d.max,
    },
    verdict,
    // Said out loud rather than implied by zeros, because "no data" and
    // "everything scored zero" look identical in a table of numbers.
    note:
      d.observed === 0
        ? 'No shadow observations recorded yet. Run curriculum unit generation with a reachable LLM provider.'
        : d.scored === 0
          ? 'Every observation errored — the judge is not answering, so no statistic here means anything.'
          : undefined,
  });
}

export const pedagogyShadowRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/pedagogy-shadow', handler: handlePedagogyShadow },
];
