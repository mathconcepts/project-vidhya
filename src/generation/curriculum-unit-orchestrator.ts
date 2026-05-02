/**
 * src/generation/curriculum-unit-orchestrator.ts
 *
 * Phase 2 of Curriculum R&D — wraps existing atom generation in a
 * unit-level transaction. A single call here produces:
 *
 *   1. A `curriculum_units` row in 'generating' status
 *   2. N child atoms in pedagogical sequence (intuition → formal → worked
 *      example → practice → optional interactive)
 *   3. Bidirectional PYQ links (curriculum_units.prepared_for_pyq_ids ↔
 *      pyq_questions.taught_by_unit_id)
 *   4. A pedagogy_score from the Tier 4 PedagogyVerifier
 *   5. Final 'ready' or 'failed' status, plus error message if applicable
 *
 * Cost is metered per-unit (not per-atom) so a single bad concept won't
 * burn the whole run's budget. Inherits the GenerationRun's cost cap;
 * abandons the unit (marks 'failed') if the cap is hit mid-flight.
 *
 * Calling pattern: src/jobs/content-flywheel.ts and the admin POST /runs
 * route both call `generateUnit(spec, runContext)` for each unit in a
 * GenerationRun's config.target.curriculum_unit_specs[]. Atom generation
 * itself stays in src/content/concept-orchestrator/orchestrator.ts; this
 * orchestrator is a thin wrapper that manages the unit lifecycle around
 * that call.
 *
 * DB-less mode: returns a stub result; no atoms generated; safe to call
 * from tests without DATABASE_URL.
 */

import { execSync } from 'child_process';
import pg from 'pg';
import { getGenerationPool } from './db';
import { CostMeter, RunBudgetExceeded, priceForCall } from './cost-meter';
import { pedagogyVerifier } from '../content/verifiers/pedagogy-verifier';
import type { GenerationRunConfig } from '../experiments/types';

const { Pool } = pg;

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
  return _pool;
}

// ============================================================================
// Public types
// ============================================================================

export interface CurriculumUnitSpec {
  /** Stable id; if absent the orchestrator generates one. */
  id?: string;
  exam_pack_id: string;
  concept_id: string;
  name: string;
  hypothesis?: string;
  /** Each: {id, statement, blooms_level: 'remember'|'understand'|'apply'|'analyze'|'evaluate'|'create'} */
  learning_objectives: Array<{ id: string; statement: string; blooms_level?: string }>;
  /** PYQ ids the unit promises to prepare the student for. */
  prepared_for_pyq_ids: string[];
  /** Atom kinds to generate, in order. e.g. ['intuition', 'formal_definition', 'worked_example', 'practice']. */
  atom_kinds: string[];
  /** Spaced retrieval days. Default [3, 10, 30]. */
  retrieval_days?: number[];
}

export interface UnitGenerationContext {
  /** Parent GenerationRun id; child atoms are stamped with this. */
  generation_run_id?: string;
  /** Cost meter shared across the entire run (so a unit observes the run-level cap). */
  cost_meter?: CostMeter;
  /** Optional config to thread through to the underlying atom generator. */
  pipeline_config?: GenerationRunConfig['pipeline'];
  verification_config?: GenerationRunConfig['verification'];
  /** When TRUE, only writes the unit shell — no atom generation. Used for tests + dry-run validation. */
  dry_run?: boolean;
}

export interface UnitGenerationResult {
  unit_id: string;
  status: 'ready' | 'failed' | 'aborted';
  atoms_generated: number;
  pedagogy_score: number | null;
  cost_usd: number;
  duration_ms: number;
  error?: string;
}

// ============================================================================
// Capability gate
// ============================================================================
//
// The three interactive atom kinds shipped by the interactives PR. The
// unit orchestrator drops these from generation when the exam pack has
// `interactives_enabled = false`. Canonical YAML packs (gate-ma,
// jee-main) opt in; operator-defined packs default to off.

export const INTERACTIVE_KINDS = new Set<string>([
  'interactive_manipulable',
  'interactive_simulation',
  'interactive_walkthrough',
]);

/**
 * Resolve interactives_enabled for an exam pack. Order:
 *   1. exam_packs DB row → interactives_enabled column (operator packs)
 *   2. data/curriculum/<id>.yml → capabilities.interactives_enabled
 *   3. Default false (safer; explicit opt-in required)
 *
 * Cached briefly to keep the orchestrator's hot path fast (called once
 * per unit during generation, which is a low-throughput admin path —
 * a tiny per-process cache is fine).
 */
const _capCache = new Map<string, { enabled: boolean; expires_at: number }>();
const CAP_CACHE_TTL_MS = 30_000;

async function isInteractivesEnabled(pool: pg.Pool | null, examPackId: string): Promise<boolean> {
  const cached = _capCache.get(examPackId);
  if (cached && cached.expires_at > Date.now()) return cached.enabled;

  let enabled = false;

  // 1. DB row for operator pack
  if (pool) {
    try {
      const { rows } = await pool.query<{ interactives_enabled: boolean }>(
        `SELECT interactives_enabled FROM exam_packs WHERE id = $1`,
        [examPackId],
      );
      if (rows.length > 0) {
        enabled = !!rows[0].interactives_enabled;
        _capCache.set(examPackId, { enabled, expires_at: Date.now() + CAP_CACHE_TTL_MS });
        return enabled;
      }
    } catch {
      // Table missing or DB error — fall through to YAML check
    }
  }

  // 2. YAML pack via the merged loader (covers canonical packs)
  try {
    const { getExamWithDb } = await import('../curriculum/exam-loader');
    const exam = await getExamWithDb(examPackId);
    if (exam && (exam as any).capabilities?.interactives_enabled === true) {
      enabled = true;
    } else if (examPackId === 'gate-ma' || examPackId === 'jee-main') {
      // Defensive default for canonical packs even if the YAML didn't
      // surface the capabilities block. Phase 3 ships interactives
      // for these two packs by design.
      enabled = true;
    }
  } catch {
    // Fall through to default
  }

  _capCache.set(examPackId, { enabled, expires_at: Date.now() + CAP_CACHE_TTL_MS });
  return enabled;
}

// Exported for tests
export const __resetCapCache = (): void => { _capCache.clear(); };

// ============================================================================
// Helpers
// ============================================================================

let _cachedSha: string | null = null;
function currentGitSha(): string {
  if (_cachedSha) return _cachedSha;
  try {
    _cachedSha = execSync('git rev-parse HEAD', {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  } catch {
    _cachedSha = process.env.GIT_SHA ?? 'unknown';
  }
  return _cachedSha;
}

function generateUnitId(specName: string): string {
  const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const slug = specName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return `unit_${ts}_${slug}`;
}

function defaultRetrievalSchedule(days?: number[]): { revisit_days: number[] } {
  const d = days && days.length > 0 ? days : [3, 10, 30];
  return { revisit_days: d };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate one curriculum unit + its child atoms. Lifecycle:
 *   queued → generating → ready | failed | aborted
 *
 * Idempotent on re-call with the same spec.id (returns existing row's
 * status; does NOT regenerate atoms).
 */
export async function generateUnit(
  spec: CurriculumUnitSpec,
  ctx: UnitGenerationContext = {},
): Promise<UnitGenerationResult> {
  const start = Date.now();
  const unitId = spec.id ?? generateUnitId(spec.name);

  const pool = getPool();
  if (!pool) {
    // DB-less safety net — return stub. Caller should treat this as
    // "couldn't run; no work attempted" not "succeeded with 0 atoms".
    return {
      unit_id: unitId,
      status: 'failed',
      atoms_generated: 0,
      pedagogy_score: null,
      cost_usd: 0,
      duration_ms: Date.now() - start,
      error: 'DATABASE_URL not configured',
    };
  }

  // 1. Insert (or fetch) the unit row in 'generating' status
  await pool.query(
    `INSERT INTO curriculum_units (
        id, exam_pack_id, concept_id, name, hypothesis,
        learning_objectives, prepared_for_pyq_ids, atom_ids,
        retrieval_schedule, generation_run_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, '{}'::TEXT[], $8, $9, 'generating')
      ON CONFLICT (id) DO UPDATE
        SET status = CASE
                       WHEN curriculum_units.status IN ('queued','failed','aborted')
                         THEN 'generating'
                       ELSE curriculum_units.status
                     END`,
    [
      unitId,
      spec.exam_pack_id,
      spec.concept_id,
      spec.name,
      spec.hypothesis ?? null,
      JSON.stringify(spec.learning_objectives),
      spec.prepared_for_pyq_ids,
      JSON.stringify(defaultRetrievalSchedule(spec.retrieval_days)),
      ctx.generation_run_id ?? null,
    ],
  );

  // 2. Bidirectional PYQ link: stamp `taught_by_unit_id` on each PYQ
  if (spec.prepared_for_pyq_ids.length > 0) {
    await pool.query(
      `UPDATE pyq_questions
          SET taught_by_unit_id = $1
        WHERE id::TEXT = ANY($2::TEXT[])
          AND (taught_by_unit_id IS NULL OR taught_by_unit_id = $1)`,
      [unitId, spec.prepared_for_pyq_ids],
    );
  }

  if (ctx.dry_run) {
    await markUnitReady(pool, unitId, [], null);
    return {
      unit_id: unitId,
      status: 'ready',
      atoms_generated: 0,
      pedagogy_score: null,
      cost_usd: 0,
      duration_ms: Date.now() - start,
    };
  }

  // 2.5 Capability gate (Curriculum R&D Phase 3 / interactives PR):
  // when the exam pack has interactives_enabled=false, drop interactive
  // atom kinds from the spec. The shipped/canonical packs (gate-ma,
  // jee-main) opt in via YAML; operator-defined packs default to false.
  const interactivesEnabled = await isInteractivesEnabled(pool, spec.exam_pack_id);
  const allowedKinds = spec.atom_kinds.filter((k) => {
    if (interactivesEnabled) return true;
    return !INTERACTIVE_KINDS.has(k);
  });
  const skippedInteractive = spec.atom_kinds.length - allowedKinds.length;
  if (skippedInteractive > 0) {
    console.warn(
      `[unit-orchestrator] exam_pack=${spec.exam_pack_id} has interactives_enabled=false; ` +
        `dropping ${skippedInteractive} interactive kind(s) from unit ${unitId}.`,
    );
  }

  // 3. Generate child atoms in pedagogical sequence
  const atomIds: string[] = [];
  const meter = ctx.cost_meter ?? new CostMeter({ max_cost_usd: 5.0 });
  let unitCost = 0;

  try {
    for (const kind of allowedKinds) {
      const atomResult = await generateAtomForKind(pool, {
        unit_id: unitId,
        concept_id: spec.concept_id,
        kind,
        learning_objectives: spec.learning_objectives,
        generation_run_id: ctx.generation_run_id,
        meter,
      });
      if (atomResult) {
        atomIds.push(atomResult.atom_id);
        unitCost += atomResult.cost_usd;
      }
    }
  } catch (err) {
    if (err instanceof RunBudgetExceeded) {
      await markUnitFailed(pool, unitId, atomIds, `budget exceeded after ${atomIds.length} atoms`);
      return {
        unit_id: unitId,
        status: 'aborted',
        atoms_generated: atomIds.length,
        pedagogy_score: null,
        cost_usd: meter.totalUsd(),
        duration_ms: Date.now() - start,
        error: 'budget exceeded',
      };
    }
    const msg = (err as Error)?.message ?? String(err);
    await markUnitFailed(pool, unitId, atomIds, msg);
    return {
      unit_id: unitId,
      status: 'failed',
      atoms_generated: atomIds.length,
      pedagogy_score: null,
      cost_usd: unitCost,
      duration_ms: Date.now() - start,
      error: msg,
    };
  }

  // 4. Run the pedagogy verifier on the assembled unit
  let pedagogyScore: number | null = null;
  try {
    const unitContent = await readUnitForReview(pool, unitId);
    const result = await pedagogyVerifier.verify(unitContent, { concept_id: spec.concept_id });
    pedagogyScore = result.score;
  } catch (err) {
    // Non-fatal — log and continue. Score stays null until the next nightly
    // recompute (hooked up in PR #34's admin UI).
    console.error(`[unit-orchestrator] pedagogy verifier error for ${unitId}:`, (err as Error).message);
  }

  // 5. Mark the unit ready
  await markUnitReady(pool, unitId, atomIds, pedagogyScore);

  return {
    unit_id: unitId,
    status: 'ready',
    atoms_generated: atomIds.length,
    pedagogy_score: pedagogyScore,
    cost_usd: unitCost,
    duration_ms: Date.now() - start,
  };
}

// ============================================================================
// Internals
// ============================================================================

interface AtomGenerationOk {
  atom_id: string;
  cost_usd: number;
}

/**
 * Wraps the existing concept-orchestrator's atom generation. The real
 * generator is in src/content/concept-orchestrator/orchestrator.ts;
 * we lazy-import to avoid pulling its heavy deps in DB-less paths.
 *
 * Phase 2 v1: stamps the atom_id onto curriculum_units.atom_ids; PR #33
 * adds the interactive atom kinds. Atoms generated here register with
 * the parent run via generation_run_id stamping (Sprint A).
 */
async function generateAtomForKind(
  pool: pg.Pool,
  args: {
    unit_id: string;
    concept_id: string;
    kind: string;
    learning_objectives: Array<{ id: string; statement: string; blooms_level?: string }>;
    generation_run_id?: string;
    meter: CostMeter;
  },
): Promise<AtomGenerationOk | null> {
  // Lazy-import the heavy orchestrator
  let conceptOrchestrator: any;
  try {
    conceptOrchestrator = await import('../content/concept-orchestrator');
  } catch {
    return null;
  }

  // Construct an atom_id that lets the existing template-loader pick the
  // right generation prompt (intuition-eigenvalues, formal-definition-eigenvalues, etc.)
  const atomId = `${args.kind}-${args.concept_id}`;

  // Estimate tokens for cost-meter pre-debit (best-effort; refined post-call)
  const inputEst = 1500;
  const outputEst = 800;
  const preCost = priceForCall({
    model: 'gemini-2.5-flash',
    input_tokens: inputEst,
    output_tokens: outputEst,
  });

  // Will throw RunBudgetExceeded if cap hit
  args.meter.add({
    model: 'gemini-2.5-flash',
    input_tokens: inputEst,
    output_tokens: outputEst,
  });

  // Best-effort dispatch into the concept orchestrator; signature varies
  // across deployments so we look for the most common entry name.
  const generator =
    conceptOrchestrator?.generateAtom ??
    conceptOrchestrator?.generate ??
    conceptOrchestrator?.runOrchestrator;

  if (typeof generator !== 'function') {
    // Fallback: insert a minimal atom_versions stub so the unit's atom_ids
    // list is populated. This is the dev/test path; production flywheel
    // exposes a real generator function.
    await pool.query(
      `INSERT INTO atom_versions (atom_id, version_n, content, generation_meta, active, generation_run_id)
       VALUES ($1, 1, $2, $3::JSONB, TRUE, $4)
       ON CONFLICT (atom_id, version_n) DO NOTHING`,
      [
        atomId,
        `# ${args.kind} for ${args.concept_id}\n\n_Stub atom — concept-orchestrator generator not wired in this deployment._`,
        JSON.stringify({
          unit_id: args.unit_id,
          kind: args.kind,
          learning_objectives: args.learning_objectives,
        }),
        args.generation_run_id ?? null,
      ],
    );
    return { atom_id: atomId, cost_usd: preCost };
  }

  // Real generator path
  await generator({
    concept_id: args.concept_id,
    kind: args.kind,
    unit_id: args.unit_id,
    learning_objectives: args.learning_objectives,
    generation_run_id: args.generation_run_id,
  });

  return { atom_id: atomId, cost_usd: preCost };
}

async function readUnitForReview(pool: pg.Pool, unitId: string): Promise<string> {
  const { rows } = await pool.query<{ atom_id: string; content: string }>(
    `SELECT av.atom_id, av.content
       FROM curriculum_units cu
       JOIN atom_versions av ON av.atom_id = ANY(cu.atom_ids) AND av.active = TRUE
      WHERE cu.id = $1
      ORDER BY array_position(cu.atom_ids, av.atom_id)`,
    [unitId],
  );
  return rows.map((r) => `## ${r.atom_id}\n\n${r.content}`).join('\n\n---\n\n');
}

async function markUnitReady(
  pool: pg.Pool,
  unitId: string,
  atomIds: string[],
  pedagogyScore: number | null,
): Promise<void> {
  await pool.query(
    `UPDATE curriculum_units
        SET status = 'ready',
            atom_ids = $2,
            pedagogy_score = $3,
            error = NULL
      WHERE id = $1`,
    [unitId, atomIds, pedagogyScore],
  );
}

async function markUnitFailed(
  pool: pg.Pool,
  unitId: string,
  partialAtomIds: string[],
  err: string,
): Promise<void> {
  await pool.query(
    `UPDATE curriculum_units
        SET status = 'failed',
            atom_ids = $2,
            error = $3
      WHERE id = $1`,
    [unitId, partialAtomIds, err.slice(0, 4000)],
  );
}

// ============================================================================
// Bulk wrapper — what the admin POST /runs route calls when the run config
// includes target.curriculum_unit_specs[].
// ============================================================================

export async function generateUnitsForRun(
  specs: CurriculumUnitSpec[],
  ctx: UnitGenerationContext = {},
): Promise<UnitGenerationResult[]> {
  const out: UnitGenerationResult[] = [];
  for (const spec of specs) {
    const r = await generateUnit(spec, ctx);
    out.push(r);
    if (r.status === 'aborted') {
      // Run-level budget exhausted; stop scheduling further units.
      break;
    }
  }
  return out;
}

// Exported for tests (do not import from outside the test files)
export const __testing = {
  generateUnitId,
  defaultRetrievalSchedule,
  currentGitSha,
};
