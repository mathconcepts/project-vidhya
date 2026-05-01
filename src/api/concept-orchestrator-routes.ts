// @ts-nocheck
/**
 * Concept Orchestrator HTTP routes (admin-only).
 *
 *   POST /api/admin/concept-orchestrator/generate
 *     Body: { concept_id, topic_family, lo_id?, atom_types?, dry_run?, force? }
 *     Returns: ConceptDraft (the 11-atom set + rejected list + total cost)
 *
 *   GET  /api/admin/concept-orchestrator/cost/:concept_id
 *     Returns: CostState for the concept this month
 *
 *   GET  /api/admin/atoms/:atom_id/versions
 *     Returns: { versions: AtomVersion[] }
 *
 *   POST /api/admin/atoms/:atom_id/activate
 *     Body: { version_n }
 *     Returns: { activated: boolean }
 *
 * All endpoints gated to admin/owner/institution roles via existing
 * auth-middleware pattern. Feature-flagged behind VIDHYA_CONCEPT_ORCHESTRATOR
 * env var (default off) so the route is invisible until staged rollout
 * starts (see CEO plan §9 deploy phases).
 */

import { ServerResponse } from 'http';
import {
  generateConcept,
  readState,
  listVersions,
  activate,
} from '../content/concept-orchestrator';
import type { OrchestratorOptions } from '../content/concept-orchestrator';
import { requireRole } from '../auth/middleware';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

const FEATURE_FLAG_ON = process.env.VIDHYA_CONCEPT_ORCHESTRATOR === 'on';

function checkFeatureFlag(res: ServerResponse): boolean {
  if (!FEATURE_FLAG_ON) {
    sendError(res, 404, 'concept orchestrator not enabled (VIDHYA_CONCEPT_ORCHESTRATOR=on)');
    return false;
  }
  return true;
}

async function handleGenerate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;

  const body = (req.body || {}) as Partial<OrchestratorOptions>;
  if (!body.concept_id || !body.topic_family) {
    return sendError(res, 400, 'concept_id and topic_family are required');
  }

  try {
    const draft = await generateConcept({
      concept_id: body.concept_id,
      lo_id: body.lo_id,
      topic_family: body.topic_family,
      atom_types: body.atom_types,
      cost_cap_usd: body.cost_cap_usd,
      dry_run: body.dry_run ?? false,
      force: body.force ?? false,
    });
    sendJSON(res, draft);
  } catch (err) {
    console.error(`[concept-orchestrator] generate failed: ${(err as Error).message}`);
    sendError(res, 500, `generation failed: ${(err as Error).message}`);
  }
}

async function handleCost(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;
  const concept_id = (req.params as any)?.concept_id;
  if (!concept_id) return sendError(res, 400, 'concept_id required');
  const state = await readState(concept_id);
  sendJSON(res, state);
}

async function handleListVersions(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;
  const atom_id = (req.params as any)?.atom_id;
  if (!atom_id) return sendError(res, 400, 'atom_id required');
  const versions = await listVersions(atom_id);
  sendJSON(res, { versions });
}

async function handleActivate(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!checkFeatureFlag(res)) return;
  const role = await requireRole(req, res, ['admin', 'owner', 'institution']);
  if (!role) return;
  const atom_id = (req.params as any)?.atom_id;
  const body = (req.body || {}) as { version_n?: number };
  if (!atom_id || typeof body.version_n !== 'number') {
    return sendError(res, 400, 'atom_id and version_n required');
  }
  const ok = await activate(atom_id, body.version_n);
  sendJSON(res, { activated: ok });
}

export const conceptOrchestratorRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST', path: '/api/admin/concept-orchestrator/generate', handler: handleGenerate },
  { method: 'GET',  path: '/api/admin/concept-orchestrator/cost/:concept_id', handler: handleCost },
  { method: 'GET',  path: '/api/admin/atoms/:atom_id/versions', handler: handleListVersions },
  { method: 'POST', path: '/api/admin/atoms/:atom_id/activate', handler: handleActivate },
];
