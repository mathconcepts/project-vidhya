/**
 * src/api/admin-journey-routes.ts
 *
 * Surfaces the admin's progress through the 8-milestone setup journey.
 * Pure read; no writes. Each milestone is derived from existing DB
 * state — no new schema, no new persistence.
 *
 *   GET /api/admin/journey/progress
 *
 * Response shape (locked — surveillance invariant 9 enforces no
 * per-student or per-record fields ever appear here):
 *
 *   {
 *     milestones: [
 *       { id, status, count, threshold, label, description, cta, doc_link },
 *       ...
 *     ],
 *     done_count: number,
 *     next_id: string | null,
 *   }
 */

import { ServerResponse } from 'http';
import fs from 'fs';
import pg from 'pg';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';

const { Pool } = pg;

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _pool;
}

// ----------------------------------------------------------------------------
// Locked milestone definitions — order matters (drives `next` resolution).
// ----------------------------------------------------------------------------

export type MilestoneId =
  | 'exam_pack' | 'rulesets' | 'blueprint' | 'approve_blueprint'
  | 'persona_scenario' | 'generation_run' | 'first_student' | 'first_signal';

export type MilestoneStatus = 'done' | 'next' | 'pending';

export interface MilestoneDescriptor {
  id: MilestoneId;
  label: string;
  description: string;
  threshold: number;
  cta_label: string;
  cta_href: string;
  doc_link: string;
}

const MILESTONES: ReadonlyArray<MilestoneDescriptor> = [
  {
    id: 'exam_pack',
    label: 'Pick your exam pack',
    description: 'Vidhya ships canonical packs for GATE-MA and JEE-Main. Custom packs come later.',
    threshold: 1,
    cta_label: 'View exam packs',
    cta_href: '/admin/exam-packs',
    doc_link: '/docs/admin-guide-jee-tn.md#step-1--pick-or-build-the-exam-pack',
  },
  {
    id: 'rulesets',
    label: 'Author cohort rulesets',
    description: 'Plain-text constraints (e.g. "lead with intuition before formal definition") that shape every blueprint.',
    threshold: 3,
    cta_label: 'Open rulesets',
    cta_href: '/admin/rulesets',
    doc_link: '/docs/admin-guide-jee-tn.md#step-3--encode-the-cohorts-character-with-rulesets',
  },
  {
    id: 'blueprint',
    label: 'Build a content blueprint',
    description: 'The spec for a single concept: stages, atom kinds, constraints. Author from template or via arbitrator.',
    threshold: 1,
    cta_label: 'Build a blueprint',
    cta_href: '/admin/blueprints',
    doc_link: '/docs/admin-guide-jee-tn.md#step-4--build-a-content-blueprint',
  },
  {
    id: 'approve_blueprint',
    label: 'Approve a blueprint',
    description: 'Review the proposed stages. Click Approve when satisfied. Generation runs use only approved blueprints.',
    threshold: 1,
    cta_label: 'Review blueprints',
    cta_href: '/admin/blueprints',
    doc_link: '/docs/admin-guide-jee-tn.md#step-4--build-a-content-blueprint',
  },
  {
    id: 'persona_scenario',
    label: 'Validate with a persona scenario',
    description: 'Drive a scripted persona through a concept. Compare side-by-side with neutral generation. Zero LLM cost.',
    threshold: 1,
    cta_label: 'View scenarios',
    cta_href: '/admin/scenarios',
    doc_link: '/docs/admin-guide-jee-tn.md#step-5--validate-the-blueprint-with-a-persona-scenario-the-moat-surface',
  },
  {
    id: 'generation_run',
    label: 'Launch your first generation run',
    description: 'Generate atoms at scale. Batch mode by default for unit-mode runs ≥5 atoms (~50% cheaper, 24h SLA).',
    threshold: 1,
    cta_label: 'Launch a run',
    cta_href: '/admin/content-rd',
    doc_link: '/docs/admin-guide-jee-tn.md#step-6--generate-content-at-scale-batch-mode',
  },
  {
    id: 'first_student',
    label: 'First student enrolled',
    description: 'Once students sign up, lessons start serving. The personalisation layer calibrates per-student.',
    threshold: 1,
    cta_label: 'View students',
    cta_href: '/admin/users',
    doc_link: '/docs/admin-guide-jee-tn.md',
  },
  {
    id: 'first_signal',
    label: 'First mastery signal',
    description: 'Mastery snapshots appear after students attempt atoms. The lift ledger needs ≥30 to compute promotion math.',
    threshold: 1,
    cta_label: 'Watch the ledger',
    cta_href: '/admin/content-rd',
    doc_link: '/docs/admin-guide-jee-tn.md#step-7--watch-the-effectiveness-ledger',
  },
];

// ----------------------------------------------------------------------------
// In-memory cache — 30s TTL. Single global slot since the data is
// admin-wide, not per-request.
// ----------------------------------------------------------------------------

const CACHE_TTL_MS = 30_000;
let _cache: { at: number; payload: ProgressPayload } | null = null;

interface ProgressPayload {
  milestones: Array<{
    id: MilestoneId;
    status: MilestoneStatus;
    count: number;
    threshold: number;
    label: string;
    description: string;
    cta_label: string;
    cta_href: string;
    doc_link: string;
  }>;
  done_count: number;
  next_id: MilestoneId | null;
  generated_at: string;
  cached: boolean;
}

async function handleProgress(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireRole(req, res, 'admin');
  if (!auth) return;

  const refresh = req.query.get('refresh') === '1';
  if (!refresh && _cache && Date.now() - _cache.at < CACHE_TTL_MS) {
    sendJSON(res, { ..._cache.payload, cached: true });
    return;
  }

  const counts = await readAllCounts();
  const payload = buildPayload(counts);
  _cache = { at: Date.now(), payload };
  sendJSON(res, { ...payload, cached: false });
}

// ----------------------------------------------------------------------------
// Pure builders — exported for tests.
// ----------------------------------------------------------------------------

export function buildPayload(counts: Record<MilestoneId, number>): ProgressPayload {
  const milestones = MILESTONES.map((m) => ({
    id: m.id,
    status: 'pending' as MilestoneStatus,
    count: counts[m.id] ?? 0,
    threshold: m.threshold,
    label: m.label,
    description: m.description,
    cta_label: m.cta_label,
    cta_href: m.cta_href,
    doc_link: m.doc_link,
  }));

  // First pass: mark done
  for (const m of milestones) {
    if (m.count >= m.threshold) m.status = 'done';
  }
  // Second pass: the first non-done is `next`
  let nextId: MilestoneId | null = null;
  for (const m of milestones) {
    if (m.status !== 'done') {
      m.status = 'next';
      nextId = m.id;
      break;
    }
  }
  // Third pass: any later non-done stays `pending`

  const done_count = milestones.filter((m) => m.status === 'done').length;

  return {
    milestones,
    done_count,
    next_id: nextId,
    generated_at: new Date().toISOString(),
    cached: false,
  };
}

async function readAllCounts(): Promise<Record<MilestoneId, number>> {
  // exam_pack is constant; persona_scenario reads filesystem; rest are DB.
  const out: Record<MilestoneId, number> = {
    exam_pack: 1,                // jee-main + gate-ma always ship
    rulesets: 0,
    blueprint: 0,
    approve_blueprint: 0,
    persona_scenario: countPersonaScenarios(),
    generation_run: 0,
    first_student: 0,
    first_signal: 0,
  };

  const pool = getPool();
  if (!pool) return out;

  // Single Promise.all round-trip; each query is indexed.
  const results = await Promise.allSettled([
    pool.query<{ c: string }>(`SELECT count(*)::TEXT AS c FROM blueprint_rulesets WHERE enabled = TRUE`),
    pool.query<{ c: string }>(`SELECT count(*)::TEXT AS c FROM content_blueprints WHERE superseded_by IS NULL`),
    pool.query<{ c: string }>(`SELECT count(*)::TEXT AS c FROM content_blueprints WHERE approved_at IS NOT NULL AND superseded_by IS NULL`),
    pool.query<{ c: string }>(`SELECT count(*)::TEXT AS c FROM generation_runs`),
    pool.query<{ c: string }>(`SELECT count(*)::TEXT AS c FROM user_profiles WHERE role = 'student'`),
    pool.query<{ c: string }>(`SELECT count(*)::TEXT AS c FROM mastery_snapshots`),
  ]);

  const keys: MilestoneId[] = [
    'rulesets', 'blueprint', 'approve_blueprint',
    'generation_run', 'first_student', 'first_signal',
  ];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const c = Number(r.value.rows[0]?.c ?? '0');
      out[keys[i]] = Number.isFinite(c) ? c : 0;
    }
    // Failed queries (table missing on partial migration) silently leave count=0
  });
  return out;
}

function countPersonaScenarios(): number {
  try {
    const root = process.env.VIDHYA_SCENARIO_ROOT
      ?? `${process.cwd()}/.data/scenarios`;
    if (!fs.existsSync(root)) return 0;
    return fs.readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(`${root}/${d.name}/trial.json`))
      .length;
  } catch {
    return 0;
  }
}

// ----------------------------------------------------------------------------

export const adminJourneyRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/journey/progress', handler: handleProgress },
];

export const __testing = {
  MILESTONES,
  buildPayload,
  resetCache: () => { _cache = null; },
};
