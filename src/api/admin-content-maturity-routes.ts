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

import fs from 'fs';
import path from 'path';
import { ServerResponse } from 'http';
import type { Pool } from 'pg';
import { parse as parseYaml } from 'yaml';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { allFramingSignatures } from '../sessions/learner-framing';
import { NARRATIVE_ATOM_TYPES, VARIANT_STANCES } from '../content/stance-variants';
// The shared storage-boundary pool, not a hand-rolled one — new call sites go
// through src/storage/ so the pg-import ratchet keeps shrinking. Returns null
// without DATABASE_URL, which is a first-class state for this route: "no
// database" is the single most important thing it has to report.
import { getSharedPool } from '../storage/pool';

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
  /**
   * Authored confident/unconfident bodies on disk (src/content/stance-variants.ts).
   * Unlike everything above this needs no database, so it is the one form of
   * content personalisation that still works on a DB-less deploy — which makes
   * it the most useful number on this report when the rest is blocked.
   *
   * THREE figures, not one — see `computeStanceFigures()`'s docblock for why
   * a single "N of M" number lies during a topic-by-topic rollout.
   */
  /** Concepts whose topic has opted in (a `stances:` block in its template). */
  stance_rollout_total: number;
  /** Of those, concepts with a complete confident + unconfident body. */
  stance_rollout_covered: number;
  /** All concepts with any authored atoms — the course-wide denominator. */
  stance_course_total: number;
  /** Of those, concepts with a complete confident + unconfident body. */
  stance_course_covered: number;
  /** Files under .data/variant-drafts/ — bodies the equivalence judge refused. */
  stance_rejected_drafts: number;
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

  // Authored stance variants. Reported last but deliberately NOT dimmed when
  // other signals are blocked: this is disk-backed, so it is the one thing on
  // this report that is still true with no database.
  //
  // THREE figures instead of one — the old single "N of M atoms in
  // variant-carrying concepts" number only ever counted concepts that
  // ALREADY had variants, which was the correct call for 3 hand-authored
  // concepts (never read as "3 of 777" and a failing grade) and the wrong
  // call for a topic-by-topic rollout: the denominator only counted what was
  // already done, so it read near-100% on week one and week six alike, and a
  // topic the equivalence judge rejected everything for simply vanished from
  // the count instead of showing up as a problem.

  // 1. In rollout — denominator is concepts whose topic has opted in. A
  // 0-of-0 rollout (true today: no template has a `stances:` block yet) is
  // reported as "not started", not as 100% and not as a divide-by-zero.
  if (facts.stance_rollout_total === 0) {
    signals.push({
      id: 'stance_rollout',
      label: 'Stance rollout has not started — no topic template has opted in yet.',
      severity: 'unknown',
      remedy:
        'Add a `stances:` block to a topic template under ' +
        'modules/project-vidhya-content/templates/<topic>.yaml to opt that topic in.',
      detail: { concepts_in_rollout: 0, concepts_covered: 0 },
    });
  } else {
    const rolloutDone = facts.stance_rollout_covered === facts.stance_rollout_total;
    signals.push({
      id: 'stance_rollout',
      label: `${facts.stance_rollout_covered} of ${facts.stance_rollout_total} concepts in the active rollout are fully personalised.`,
      severity: rolloutDone ? 'healthy' : 'partial',
      remedy: rolloutDone
        ? null
        : 'Some opted-in concepts are missing a confident or unconfident body. Check the ' +
          'rejected-drafts count below — the equivalence judge may have refused one.',
      detail: {
        concepts_in_rollout: facts.stance_rollout_total,
        concepts_covered: facts.stance_rollout_covered,
      },
    });
  }

  // 2. Course-wide — denominator is every concept with authored atoms, not
  // just the ones that already have variants. This is the number that stays
  // honest at any point in the rollout, at the cost of looking small for a
  // long time. That smallness IS the truth for a rollout still in progress.
  if (facts.stance_course_total === 0) {
    signals.push({
      id: 'stance_course_wide',
      label: 'No authored concepts found on this deploy.',
      severity: 'unknown',
      remedy: 'Check that the content corpus is present.',
      detail: { concepts_covered: 0, concepts_total: 0 },
    });
  } else {
    const courseDone = facts.stance_course_covered === facts.stance_course_total;
    signals.push({
      id: 'stance_course_wide',
      label: `${facts.stance_course_covered} of ${facts.stance_course_total} concepts course-wide have a complete confident and unconfident body.`,
      severity: courseDone ? 'healthy' : 'partial',
      remedy: courseDone
        ? null
        : 'Most concepts still read identical text regardless of student stance — expected ' +
          'before the rollout reaches them. See "in rollout" above for the honest denominator.',
      detail: {
        concepts_covered: facts.stance_course_covered,
        concepts_total: facts.stance_course_total,
        works_without_database: 'yes',
      },
    });
  }

  // 3. Rejected — the equivalence judge writes a refused draft here rather
  // than into the content tree, so it never reaches a student. It also never
  // showed up anywhere an operator could see it, before this.
  if (facts.stance_rejected_drafts > 0) {
    signals.push({
      id: 'stance_rejected',
      label: `${facts.stance_rejected_drafts} authored draft${facts.stance_rejected_drafts === 1 ? '' : 's'} rejected by the equivalence judge.`,
      severity: 'partial',
      remedy:
        'Inspect .data/variant-drafts/ — these were judged not equivalent to the base body ' +
        'and held back rather than served.',
      detail: { rejected_drafts: facts.stance_rejected_drafts },
    });
  } else {
    signals.push({
      id: 'stance_rejected',
      label: 'No authored drafts have been rejected by the equivalence judge.',
      severity: 'healthy',
      remedy: null,
      detail: { rejected_drafts: 0 },
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

/** Minimal atom shape the pure figure computation needs. */
export interface StanceFigureAtom {
  atom_type: string;
  stance_variants?: Partial<Record<'shaken' | 'assured', string>>;
}

export interface StanceFigureConcept {
  id: string;
  /** ConceptNode.topic (src/constants/concept-graph). Undefined if unmapped. */
  topic: string | undefined;
  atoms: StanceFigureAtom[];
}

export interface StanceFigures {
  stance_rollout_total: number;
  stance_rollout_covered: number;
  stance_course_total: number;
  stance_course_covered: number;
}

/**
 * Pure figure computation. THREE figures instead of one — see buildReport()'s
 * comment for the failure mode this replaces.
 *
 * A concept counts toward the COURSE-WIDE denominator the moment it has any
 * authored atom at all, whether or not its topic has opted into stances. It
 * ALSO counts toward the ROLLOUT denominator when its topic has opted in
 * (`stances:` block present) — rollout is a subset of course-wide by
 * construction, never a different population.
 *
 * "Covered" mirrors applyStanceVariants()'s own all-or-nothing rule: a
 * concept counts only once EVERY narrative atom (hook / intuition /
 * worked_example — the only atom_types stance variants are authored for) has
 * BOTH a shaken and an assured body. That is deliberate: it is exactly the
 * condition under which a real student would actually receive a swapped
 * body, so "covered" means "would change what a student reads today", not
 * "has at least one variant file lying around".
 */
export function computeStanceFigures(input: {
  concepts: StanceFigureConcept[];
  topicsWithStances: Set<string>;
}): StanceFigures {
  let rolloutTotal = 0;
  let rolloutCovered = 0;
  let courseTotal = 0;
  let courseCovered = 0;

  for (const concept of input.concepts) {
    if (concept.atoms.length === 0) continue; // nothing authored — not part of either count

    const narrative = concept.atoms.filter((a) => NARRATIVE_ATOM_TYPES.includes(a.atom_type));
    const fullyCovered =
      narrative.length > 0 &&
      narrative.every((a) => VARIANT_STANCES.every((s) => Boolean(a.stance_variants?.[s])));

    courseTotal++;
    if (fullyCovered) courseCovered++;

    if (concept.topic && input.topicsWithStances.has(concept.topic)) {
      rolloutTotal++;
      if (fullyCovered) rolloutCovered++;
    }
  }

  return {
    stance_rollout_total: rolloutTotal,
    stance_rollout_covered: rolloutCovered,
    stance_course_total: courseTotal,
    stance_course_covered: courseCovered,
  };
}

/**
 * Topic slugs whose template has opted into authored stances (a top-level
 * `stances:` block in modules/project-vidhya-content/templates/<topic>.yaml).
 * No template has one yet, so this legitimately returns an empty set today —
 * that is correct, not a bug, and is exactly what makes the rollout figure
 * 0-of-0 rather than a divide-by-zero.
 */
function loadTopicsWithStancesBlock(): Set<string> {
  const templatesDir = path.join(process.cwd(), 'modules', 'project-vidhya-content', 'templates');
  const opted = new Set<string>();
  let files: string[];
  try {
    files = fs.readdirSync(templatesDir).filter((f) => /\.ya?ml$/.test(f));
  } catch {
    // Content module not checked out on this deploy, or no templates authored
    // yet. Zero opted-in topics is the honest answer, not an error.
    return opted;
  }
  for (const file of files) {
    const topic = file.replace(/\.ya?ml$/, '');
    try {
      const raw = parseYaml(fs.readFileSync(path.join(templatesDir, file), 'utf8'));
      if (raw && typeof raw === 'object' && (raw as Record<string, unknown>).stances != null) {
        opted.add(topic);
      }
    } catch (err) {
      console.warn(
        `[admin-content-maturity] failed to parse template ${file}: ${(err as Error).message}`,
      );
    }
  }
  return opted;
}

/**
 * IO wrapper around computeStanceFigures(). Dynamic imports mirror the rest
 * of this file's defensive style: a missing or broken concept graph must not
 * take the whole maturity report down with it.
 */
async function gatherStanceFigures(): Promise<StanceFigures> {
  try {
    const { listConceptIds, loadConceptAtoms } = await import('../content/atom-loader');
    const { CONCEPT_MAP } = await import('../constants/concept-graph');
    const topicsWithStances = loadTopicsWithStancesBlock();

    const concepts: StanceFigureConcept[] = [];
    for (const id of listConceptIds()) {
      const atoms = await loadConceptAtoms(id);
      concepts.push({
        id,
        topic: CONCEPT_MAP.get(id)?.topic,
        atoms: atoms.map((a) => ({ atom_type: a.atom_type, stance_variants: a.stance_variants })),
      });
    }
    return computeStanceFigures({ concepts, topicsWithStances });
  } catch (err) {
    console.warn(`[admin-content-maturity] stance figure scan failed: ${(err as Error).message}`);
    return {
      stance_rollout_total: 0,
      stance_rollout_covered: 0,
      stance_course_total: 0,
      stance_course_covered: 0,
    };
  }
}

/**
 * Files under `dir`, recursively. An absent directory means 0, not an error —
 * the equivalence judge simply hasn't rejected anything yet on this deploy.
 */
export function countFilesRecursive(dir: string): number {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  let count = 0;
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFilesRecursive(full);
    else if (entry.isFile()) count++;
  }
  return count;
}

const VARIANT_DRAFTS_DIR = path.join(process.cwd(), '.data', 'variant-drafts');

/** Runs a count query, returning null when the table is absent or unreadable. */
async function safeCount(pool: Pool, sql: string, params: unknown[] = []): Promise<number | null> {
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
  const pool = getSharedPool();
  const stanceFigures = await gatherStanceFigures();
  const stance_rejected_drafts = countFilesRecursive(VARIANT_DRAFTS_DIR);
  if (!pool) {
    return {
      database_configured: false,
      selector_gate_present: null,
      thinking_gap_total: null,
      thinking_gap_generic: null,
      thinking_gap_distinct_framings: null,
      active_atom_overrides: null,
      ...stanceFigures,
      stance_rejected_drafts,
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
    ...stanceFigures,
    stance_rejected_drafts,
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
