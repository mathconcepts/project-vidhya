/**
 * src/api/explanation-frame-routes.ts — the static/variable readout.
 * Admin, read-only, changes nothing a student sees.
 *
 *   GET /api/admin/explanation-frame/:concept_id
 *     → the frame's floor, plus what each signal would add on top of it
 *
 * Shipped as a shadow readout for the same reason `pedagogy-shadow` and
 * `fsrs-shadow` were: the framework's whole claim is "zero signals still
 * gives a real explanation, and each extra signal makes it more resonant
 * without ever making it worse." That is a claim about output, and the only
 * honest way to review it is to read the output — per concept, side by
 * side, before any of it is wired into what students receive.
 *
 * `coverage` answers the question an operator actually has: across the whole
 * corpus, how many concepts can be framed at all today, and which role is
 * the blocker on the ones that cannot.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { ALL_CONCEPTS, getPrerequisites } from '../constants/concept-graph';
import {
  buildFrameForConcept,
  composeExplanation,
  checkFrame,
  listResolvers,
  NO_SIGNALS,
  type LearnerSignals,
} from '../content/explanation-frame';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

/**
 * The signal bundles the readout renders, cheapest first.
 *
 * Deliberately fixed rather than caller-supplied: this endpoint exists to
 * answer "what does each signal add", and letting an operator hand-craft a
 * bundle would make two readouts incomparable. Every value here is a shape
 * the real student model produces.
 */
function probeBundles(conceptId: string): Array<{ label: string; signals: LearnerSignals }> {
  return [
    { label: 'floor (anonymous, no signals)', signals: NO_SIGNALS },
    { label: 'stance: shaken', signals: { stance: 'shaken' } },
    { label: 'stance: assured', signals: { stance: 'assured' } },
    {
      label: 'shaken + weak prerequisite + board track',
      signals: {
        stance: 'shaken',
        // A REAL prerequisite of this concept, read from the graph. Passing
        // the concept's own id (the first cut of this probe) made the
        // prerequisite resolver correctly decline every time, so the
        // readout showed the resolver as dead when it was working.
        shaky_prerequisites: getPrerequisites(conceptId).map(c => c.id),
        track_id: 'TN-HSE-12-MATH',
      },
    },
  ];
}

async function handleFrame(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'admin');
  if (!user) return;

  const conceptId = (req.params?.concept_id ?? '').trim();
  if (!conceptId) return sendError(res, 400, 'concept_id required');

  const node = ALL_CONCEPTS.find(c => c.id === conceptId);
  const { frame, missing, resolvers } = await buildFrameForConcept(conceptId);

  if (!frame) {
    // Named, not silently empty: the blocker is the actionable part.
    return sendJSON(res, {
      concept_id: conceptId,
      known_concept: Boolean(node),
      frameable: false,
      missing_roles: missing,
      note: `Cannot be framed yet — no authored content fills ${missing.join(', ')}.`,
    });
  }

  const contract = checkFrame(frame);
  const renderings = probeBundles(conceptId).map(({ label, signals }) => {
    const out = composeExplanation(frame, signals, resolvers);
    return {
      label,
      enrichment_level: out.enrichment_level,
      slots: out.slots.map(s => ({
        slot_id: s.slot_id,
        role: s.role,
        source: s.source,
        resolver_id: s.resolver_id ?? null,
        chars: s.text.length,
        preview: s.text.slice(0, 180),
      })),
    };
  });

  sendJSON(res, {
    concept_id: conceptId,
    known_concept: Boolean(node),
    topic: node?.topic ?? null,
    frameable: true,
    contract_problems: contract,
    resolvers: [
      ...listResolvers().map(r => ({ id: r.id, roles: r.roles, reads: r.reads, scope: 'global' })),
      ...resolvers.map(r => ({ id: r.id, roles: r.roles, reads: r.reads, scope: 'per-concept' })),
    ],
    renderings,
  });
}

async function handleCoverage(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'admin');
  if (!user) return;

  const topic = (req.query.get('topic') ?? '').trim();
  const scope = topic ? ALL_CONCEPTS.filter(c => c.topic === topic) : ALL_CONCEPTS;

  let frameable = 0;
  const blockedBy: Record<string, number> = {};
  const blocked: string[] = [];

  for (const c of scope) {
    const { frame, missing } = await buildFrameForConcept(c.id);
    if (frame) { frameable += 1; continue; }
    blocked.push(c.id);
    for (const role of missing) blockedBy[role] = (blockedBy[role] ?? 0) + 1;
  }

  sendJSON(res, {
    topic: topic || null,
    concepts: scope.length,
    frameable,
    not_frameable: scope.length - frameable,
    blocked_by_role: blockedBy,
    // Capped: the list is a starting point for authoring, not a report to
    // read end to end, and an unbounded array here would dwarf the counts.
    blocked_sample: blocked.slice(0, 25),
  });
}

export const explanationFrameRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/explanation-frame/coverage', handler: handleCoverage },
  { method: 'GET', path: '/api/admin/explanation-frame/:concept_id', handler: handleFrame },
];
