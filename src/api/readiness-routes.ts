/**
 * src/api/readiness-routes.ts — Wave 4 reachable surface.
 *
 * Two endpoints:
 *
 *   POST /api/readiness/warmup/next
 *     body: { skill_id, state? }
 *     Returns: { probe, state, converged, ability_estimate? }
 *     Server has no warmup persistence yet — caller round-trips the
 *     state JSON. This keeps the API stateless and lets the warmup work
 *     anonymously (the v4.16 anonymous-first contract).
 *
 *   POST /api/readiness/warmup/apply
 *     body: { state, object_id, difficulty, correct }
 *     Returns: { state, converged, ability_estimate?, summary }
 *     Pure-function reducer; client manages persistence.
 *
 * Wired into src/server.ts. No DB dependency — pure logic + catalog
 * (the catalog backing comes from a future PR that wraps the
 * generated_problems table).
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import {
  newWarmup,
  applyWarmupOutcome,
  isConverged,
  finalAbility,
  pickNextProbe,
  summarize,
  type WarmupState,
} from '../readiness/diagnostic-warmup';
import { InMemoryCatalog, type LearningObjectCatalog } from '../scoring/learning-object-catalog';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ────────────────────────────────────────────────────────────────────
// Catalog provider — pluggable, defaults to empty until a DB-backed
// impl lands. Apps can override at boot via setReadinessCatalog().
// ────────────────────────────────────────────────────────────────────

let _catalog: LearningObjectCatalog = new InMemoryCatalog([]);

/**
 * Inject a catalog at boot. The default is empty — without an override,
 * the warmup endpoint will report "no probe available" rather than
 * hanging or throwing. Production wiring assigns a Postgres-backed
 * catalog that queries the generated_problems table.
 */
export function setReadinessCatalog(catalog: LearningObjectCatalog): void {
  _catalog = catalog;
}

// ────────────────────────────────────────────────────────────────────
// POST /api/readiness/warmup/next — get the next probe item
// ────────────────────────────────────────────────────────────────────

async function handleWarmupNext(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body ?? {}) as Record<string, any>;
  const skillId: string | undefined = body.skill_id;
  if (!skillId || typeof skillId !== 'string') {
    return sendJSON(res, { error: 'skill_id is required' }, 400);
  }

  const state: WarmupState = isWarmupState(body.state)
    ? body.state
    : newWarmup(skillId);

  // Defensive: caller's state must match the skill_id they're working on.
  if (state.skillId !== skillId) {
    return sendJSON(res, { error: 'state.skillId does not match body.skill_id' }, 400);
  }

  if (isConverged(state)) {
    return sendJSON(res, {
      converged: true,
      ability_estimate: finalAbility(state),
      summary: summarize(state),
      probe: null,
    });
  }

  try {
    const probe = await pickNextProbe(state, { catalog: _catalog });
    if (!probe) {
      // Catalog exhausted — emit what we have, with `exhausted: true` so
      // the client UI can show "we ran out of warm-up items; let's start
      // your practice with the rough estimate we have."
      return sendJSON(res, {
        converged: false,
        exhausted: true,
        ability_estimate: finalAbility(state),
        summary: summarize(state),
        probe: null,
      });
    }
    return sendJSON(res, {
      converged: false,
      exhausted: false,
      probe,
      state,
    });
  } catch (err) {
    return sendJSON(res, { error: (err as Error).message }, 500);
  }
}

// ────────────────────────────────────────────────────────────────────
// POST /api/readiness/warmup/apply — apply an attempt outcome
// ────────────────────────────────────────────────────────────────────

async function handleWarmupApply(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body = (req.body ?? {}) as Record<string, any>;
  if (!isWarmupState(body.state)) {
    return sendJSON(res, { error: 'state is required' }, 400);
  }
  const objectId = String(body.object_id ?? '');
  const difficulty = Number(body.difficulty);
  const correct = Boolean(body.correct);

  if (!objectId) return sendJSON(res, { error: 'object_id is required' }, 400);
  if (!Number.isFinite(difficulty)) return sendJSON(res, { error: 'difficulty must be a number' }, 400);

  const newState = applyWarmupOutcome(body.state, { objectId, difficulty, correct });
  const converged = isConverged(newState);
  return sendJSON(res, {
    state: newState,
    converged,
    ability_estimate: converged ? finalAbility(newState) : null,
    summary: summarize(newState),
  });
}

// ────────────────────────────────────────────────────────────────────
// Type guard — refuses bogus state from untrusted clients
// ────────────────────────────────────────────────────────────────────

function isWarmupState(v: unknown): v is WarmupState {
  if (!v || typeof v !== 'object') return false;
  const o = v as any;
  return (
    typeof o.skillId === 'string' &&
    typeof o.abilityLow === 'number' &&
    typeof o.abilityHigh === 'number' &&
    Array.isArray(o.answeredIds) &&
    Array.isArray(o.history)
  );
}

export const readinessRoutes: RouteDefinition[] = [
  { method: 'POST', path: '/api/readiness/warmup/next', handler: handleWarmupNext },
  { method: 'POST', path: '/api/readiness/warmup/apply', handler: handleWarmupApply },
];
