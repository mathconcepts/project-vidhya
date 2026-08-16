/**
 * src/api/admin-content-maturity-routes.ts
 *
 *   GET /api/admin/content-maturity
 *
 * Answers one question an operator currently cannot answer at all:
 * **is what students are being served actually personalised, or is it the
 * generic fallback wearing a personalised label?**
 *
 * This exists because the honest answer for a long time was "generic", and
 * nothing said so. Three independent mechanisms could each silently reduce
 * the product to one-size-fits-all, and all three failed quietly:
 *
 *   1. No DATABASE_URL → the personalised selector, the per-student atom
 *      overrides, and the thinking-gap cache are all inert. The demo instance
 *      runs exactly like this.
 *   2. The selector's activation row (`experiments`, id
 *      `personalized_selector_v1_gate_ma`) is created out-of-band, not by a
 *      migration. Without it every session is in the control bucket.
 *   3. The thinking-gap cache held one row per (concept, error_type), written
 *      once, served to everyone — LLM-generated at the origin and static
 *      thereafter.
 *
 * ── Reporting rules, which are the whole point ──────────────────────────
 *
 * A maturity report that flatters is worse than no report. So:
 *
 *   - A blocker outranks any percentage. If personalisation cannot run at
 *     all, the report says so and does NOT print encouraging coverage
 *     numbers computed over a mechanism that is switched off.
 *   - Anything we cannot measure is reported as `null` / `unknown`, never as
 *     zero and never as complete. A missing table is missing information, not
 *     a finding.
 *   - Counts only. No student identifiers, no names, no per-student rows —
 *     the surveillance invariants apply here as everywhere.
 */

import { ServerResponse } from 'http';
import pg from 'pg';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { allFramingSignatures } from '../sessions/learner-framing';

const { Pool } = pg;
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/** Severity ordering used to pick what the UI leads with. */
export type Severity = 'blocked' | 'partial' | 'healthy' | 'unknown';

export interface MaturitySignal {
  id: string;
  /** Short sentence naming the state, in the operator's language. */
  label: string;
  severity: Severity;
  /** What to do about it. Null when there is nothing to do. */
  remedy: string | null;
  /** Measured numbers. Absent keys mean "not measurable", never "zero". */
  detail?: Record<string, number | string | null>;
}

export interface MaturityReport {
  /** Worst severity across all signals — what the card badge shows. */
  overall: Severity;
  /**
   * True only when nothing is blocking. When false the UI must not present
   * coverage percentages as progress: they are measurements of a system that
   * is not running.
   */
  personalization_active: boolean;
  signals: MaturitySignal[];
  generated_at: string;
}

const SEVERITY_RANK: Record<Severity, number> = {
  blocked: 3,
  partial: 2,
  unknown: 1,
  healthy: 0,
};

export function worstSeverity(signals: MaturitySignal[]): Severity {
  let worst: Severity = 'healthy';
  for (const s of signals) {
    if (SEVERITY_RANK[s.severity] > SEVERITY_RANK[worst]) worst = s.severity;
  }
  return worst;
}

/**
 * Pure report assembly, separated from every query so it can be tested
 * without a database. `facts` uses `null` for "could not measure".
 */
export interface MaturityFacts {
  database_configured: boolean;
  /** null = could not check (no DB, or the experiments table is absent). */
  selector_gate_present: boolean | null;
  /** null = could not count. */
  thinking_gap_total: number | null;
  thinking_gap_generic: number | null;
  thinking_gap_distinct_framings: number | null;
  /** Active per-student atom overrides. null = could not count. */
  active_atom_overrides: number | null;
}

export function buildReport(facts: MaturityFacts, now: string): MaturityReport {
  const signals: MaturitySignal[] = [];

  if (!facts.database_configured) {
    signals.push({
      id: 'database',
      label: 'No database configured — every personalisation path is inert.',
      severity: 'blocked',
      remedy:
        'Set DATABASE_URL on this service. Until then the selector, per-student ' +
        'atom overrides, and the thinking-gap cache all no-op, and every student ' +
        'sees identical content.',
    });
  } else {
    signals.push({
      id: 'database',
      label: 'Database reachable.',
      severity: 'healthy',
      remedy: null,
    });
  }

  if (facts.selector_gate_present === null) {
    signals.push({
      id: 'selector_gate',
      label: 'Cannot tell whether the personalised selector is switched on.',
      severity: 'unknown',
      remedy: 'Check that the experiments table exists and this service can read it.',
    });
  } else if (facts.selector_gate_present) {
    signals.push({
      id: 'selector_gate',
      label: 'Personalised selector is switched on.',
      severity: 'healthy',
      remedy: null,
    });
  } else {
    signals.push({
      id: 'selector_gate',
      label: 'Personalised selector is off — every session is in the control bucket.',
      severity: 'blocked',
      remedy:
        'The activation row is created out-of-band, not by a migration. Insert an ' +
        'experiments row with id personalized_selector_v1_gate_ma to enable it.',
    });
  }

  // Thinking-gap coverage.
  const total = facts.thinking_gap_total;
  const generic = facts.thinking_gap_generic;
  const distinct = facts.thinking_gap_distinct_framings;
  const cohorts = allFramingSignatures().length;

  if (total === null || generic === null || distinct === null) {
    signals.push({
      id: 'thinking_gap',
      label: 'Session insight coverage is not measurable on this deploy.',
      severity: 'unknown',
      remedy: 'The thinking_gap_cache table is unreadable or absent — apply migrations.',
      detail: { cohorts_possible: cohorts },
    });
  } else if (total === 0) {
    signals.push({
      id: 'thinking_gap',
      label: 'No session insights generated yet.',
      severity: 'unknown',
      remedy:
        'Nothing to judge until students answer some questions wrong. Coverage ' +
        'becomes meaningful after the first sessions.',
      detail: { rows: 0, cohorts_possible: cohorts },
    });
  } else if (generic === total) {
    signals.push({
      id: 'thinking_gap',
      label: `All ${total} session insights are the generic variant — written with no knowledge of the student.`,
      severity: 'blocked',
      remedy:
        'These pre-date learner framing. They keep serving until a framed variant ' +
        'is generated for each cohort, which happens on the next wrong answer from ' +
        'a student the model knows something about.',
      detail: { rows: total, generic, cohorts_covered: distinct, cohorts_possible: cohorts },
    });
  } else {
    // Partial until a decent share of the reachable cohorts have their own
    // text. Deliberately not a percentage of 27: most cohorts are rare, and
    // demanding all of them would keep this amber forever.
    const genericShare = generic / total;
    signals.push({
      id: 'thinking_gap',
      label:
        genericShare > 0.5
          ? `${generic} of ${total} session insights are still the generic variant.`
          : `Session insights are written per learner cohort (${distinct} cohorts covered).`,
      severity: genericShare > 0.5 ? 'partial' : 'healthy',
      remedy:
        genericShare > 0.5
          ? 'Generic rows are replaced as students in each cohort hit the same error. ' +
            'No action needed unless this share stays high after real traffic.'
          : null,
      detail: { rows: total, generic, cohorts_covered: distinct, cohorts_possible: cohorts },
    });
  }

  if (facts.active_atom_overrides === null) {
    signals.push({
      id: 'atom_overrides',
      label: 'Per-student rewritten lessons are not measurable on this deploy.',
      severity: 'unknown',
      remedy: 'The student_atom_overrides table is unreadable or absent.',
    });
  } else if (facts.active_atom_overrides === 0) {
    signals.push({
      id: 'atom_overrides',
      label: 'No lesson has been rewritten for an individual student yet.',
      severity: 'partial',
      remedy:
        'Rewrites only trigger after a student fails the same atom three times in ' +
        'seven days. Zero is expected early, and expected forever on low traffic — ' +
        'it is not a fault, but it does mean lesson bodies are identical for everyone.',
      detail: { active: 0 },
    });
  } else {
    signals.push({
      id: 'atom_overrides',
      label: `${facts.active_atom_overrides} lesson${facts.active_atom_overrides === 1 ? ' has' : 's have'} been rewritten for individual students.`,
      severity: 'healthy',
      remedy: null,
      detail: { active: facts.active_atom_overrides },
    });
  }

  const overall = worstSeverity(signals);
  return {
    overall,
    personalization_active: !signals.some((s) => s.severity === 'blocked'),
    signals,
    generated_at: now,
  };
}

/** Runs a count query, returning null when the table is absent or unreadable. */
async function safeCount(pool: pg.Pool, sql: string, params: unknown[] = []): Promise<number | null> {
  try {
    const { rows } = await pool.query(sql, params);
    const n = Number(rows[0]?.n);
    return Number.isFinite(n) ? n : null;
  } catch {
    // A missing table is missing information. Reporting it as 0 would read as
    // a measured finding, which is exactly the dishonesty this route exists
    // to remove.
    return null;
  }
}

async function gatherFacts(): Promise<MaturityFacts> {
  const pool = getPool();
  if (!pool) {
    return {
      database_configured: false,
      selector_gate_present: null,
      thinking_gap_total: null,
      thinking_gap_generic: null,
      thinking_gap_distinct_framings: null,
      active_atom_overrides: null,
    };
  }

  const [gate, total, generic, distinct, overrides] = await Promise.all([
    safeCount(
      pool,
      `SELECT COUNT(*)::int AS n FROM experiments WHERE id = 'personalized_selector_v1_gate_ma'`,
    ),
    safeCount(pool, `SELECT COUNT(*)::int AS n FROM thinking_gap_cache`),
    safeCount(pool, `SELECT COUNT(*)::int AS n FROM thinking_gap_cache WHERE framing = 'generic'`),
    safeCount(pool, `SELECT COUNT(DISTINCT framing)::int AS n FROM thinking_gap_cache WHERE framing <> 'generic'`),
    safeCount(pool, `SELECT COUNT(*)::int AS n FROM student_atom_overrides WHERE expires_at > NOW()`),
  ]);

  return {
    database_configured: true,
    selector_gate_present: gate === null ? null : gate > 0,
    thinking_gap_total: total,
    thinking_gap_generic: generic,
    thinking_gap_distinct_framings: distinct,
    active_atom_overrides: overrides,
  };
}

async function handleContentMaturity(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const user = await requireRole(req, res, 'admin');
  if (!user) return;

  try {
    const facts = await gatherFacts();
    sendJSON(res, buildReport(facts, new Date().toISOString()));
  } catch (err) {
    console.error('[admin-content-maturity] failed:', err);
    sendJSON(res, { error: 'Failed to build content maturity report' }, 500);
  }
}

export const adminContentMaturityRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/content-maturity', handler: handleContentMaturity },
];
