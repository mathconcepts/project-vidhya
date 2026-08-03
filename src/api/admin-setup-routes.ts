/**
 * Setup Wizard routes — Mission Control Phase 1, "Setup wizard" panel
 * (SOTA-Facelift-CEO-Review.md §7). Read-only operational readiness view
 * over the same checks `npm run content:setup` (src/jobs/setup-cli.ts)
 * already performs, surfaced in the admin UI instead of a terminal.
 *
 * Scope, deliberately narrow:
 *   - GET  /api/admin/setup/status  — cheap, no live network calls. Env
 *     var presence (never the key itself), registry-configured providers,
 *     DB reachability (preflightDatabase() is already a fast/short-timeout
 *     check — same one platform-health's GET uses unconditionally), and
 *     per-syllabus concept-graph resolution counts.
 *   - POST /api/admin/setup/test-providers — operator-triggered, LIVE LLM
 *     calls (one per configured provider, same preflightProviders() used
 *     by setup-cli.ts / content-generation-job's own preflight). Costs a
 *     trivial amount of real provider spend per click, so this is a
 *     button the operator presses, never something polled or run on page
 *     load. Wrapped in an overall timeout so a hung provider call can't
 *     hang the request indefinitely.
 *
 * What this deliberately does NOT do (out of scope for this panel):
 *   - Writing/rotating API keys. Keys are env vars on the deployment
 *     platform (Render) — this is a read-only diagnostic, not a secrets
 *     manager. Writing secrets through an admin HTTP endpoint is a
 *     different, much higher-stakes feature this batch doesn't attempt.
 *   - Editing the syllabus/curriculum. Read-only counts only; authoring
 *     lives in data/curriculum/*.yml + the separate content repo.
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAnyRole } from '../auth/middleware';
import type { Role } from '../auth/types';
import { preflightDatabase } from '../jobs/db-preflight';
import { preflightProviders, type ProviderPreflightResult } from '../llm/env-config';
import { loadProvidersRegistry } from '../llm/registry';
import { listSyllabusIds, getSyllabus, DEFAULT_SYLLABUS_ID } from '../curriculum/exam-loader';

const ADMIN_ROLES: Role[] = ['admin', 'owner', 'institution'];

/** Live provider calls can hang on a slow/unreachable endpoint; the CLI has
 *  no such bound (a stuck terminal is merely annoying), but a stuck HTTP
 *  request behind an admin button is worse — cap it so the operator always
 *  gets a clear answer within a bounded time. */
const LIVE_TEST_TIMEOUT_MS = 20_000;

interface ProviderStatus {
  provider: string;
  enabled: boolean;
  api_key_env: string | null;
  key_present: boolean;
  model_count: number;
  /** Only 'gemini' is a hard requirement — content-generation refuses to
   *  start without it (same rule as setup-cli.ts). */
  required: boolean;
}

function readProviderStatuses(): { providers: ProviderStatus[]; registry_error: string | null } {
  try {
    const registry = loadProvidersRegistry();
    const providers: ProviderStatus[] = Object.entries(registry.providers).map(([id, p]) => ({
      provider: id,
      enabled: p.enabled,
      api_key_env: p.api_key_env ?? null,
      key_present: p.api_key_env ? Boolean(process.env[p.api_key_env]) : true, // keyless providers (ollama) are always "present"
      model_count: Object.keys(p.models ?? {}).length,
      required: id === 'gemini',
    }));
    return { providers, registry_error: null };
  } catch (err) {
    // config/providers.yaml missing or unparsable — surface as an honest
    // empty list + error string rather than 500ing the whole panel.
    return { providers: [], registry_error: (err as Error).message };
  }
}

interface SyllabusStatus {
  id: string;
  name: string;
  concept_count: number;
  unresolved_count: number;
  is_default: boolean;
}

function readSyllabusStatuses(): { syllabi: SyllabusStatus[]; error: string | null } {
  const syllabi: SyllabusStatus[] = [];
  for (const id of listSyllabusIds()) {
    try {
      const s = getSyllabus(id);
      syllabi.push({
        id: s.id,
        name: s.name,
        concept_count: s.concepts.length,
        unresolved_count: s.unresolvedConceptIds.length,
        is_default: id === DEFAULT_SYLLABUS_ID,
      });
    } catch {
      // One bad syllabus file shouldn't take down the whole wizard view.
      syllabi.push({ id, name: id, concept_count: 0, unresolved_count: 0, is_default: id === DEFAULT_SYLLABUS_ID });
    }
  }
  return { syllabi, error: null };
}

async function handleStatus(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAnyRole(req, res, ADMIN_ROLES);
  if (!auth) return;

  const { providers, registry_error } = readProviderStatuses();
  const { syllabi } = readSyllabusStatuses();
  const db = await preflightDatabase();

  const gemini = providers.find((p) => p.provider === 'gemini');
  const hard_requirement_met = Boolean(gemini?.key_present);

  sendJSON(res, {
    generated_at: new Date().toISOString(),
    providers,
    registry_error,
    database: {
      configured: Boolean(process.env.DATABASE_URL),
      reachable: db.ok,
      error: db.ok ? null : db.error,
      note: process.env.DATABASE_URL
        ? undefined
        : 'FILE mode only: atoms persist as files; no DB versioning / cost ledger / PYQ grounding.',
    },
    syllabi,
    hard_requirement_met,
    ready: hard_requirement_met,
  });
}

async function handleTestProviders(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAnyRole(req, res, ADMIN_ROLES);
  if (!auth) return;

  let timedOut = false;
  const timeout = new Promise<'timeout'>((resolve) => {
    setTimeout(() => {
      timedOut = true;
      resolve('timeout');
    }, LIVE_TEST_TIMEOUT_MS).unref?.();
  });

  try {
    const outcome = await Promise.race([preflightProviders(), timeout]);
    if (outcome === 'timeout' || timedOut) {
      return sendError(
        res,
        504,
        `Live provider check did not complete within ${LIVE_TEST_TIMEOUT_MS / 1000}s — a configured provider ` +
          'may be slow or unreachable. Try again, or check the provider\'s status page.',
      );
    }
    const results = outcome as ProviderPreflightResult[];
    sendJSON(res, { tested_at: new Date().toISOString(), results });
  } catch (err) {
    sendError(res, 500, `Live provider check failed: ${(err as Error).message}`);
  }
}

export const setupRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET', path: '/api/admin/setup/status', handler: handleStatus },
  { method: 'POST', path: '/api/admin/setup/test-providers', handler: handleTestProviders },
];

export const __testing = { readProviderStatuses, readSyllabusStatuses };
