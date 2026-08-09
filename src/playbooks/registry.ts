/**
 * src/playbooks/registry.ts
 *
 * Playbook Seed Catalog (Track E5).
 *
 * One registry, one page (/admin/playbooks), one click.
 * Every playbook registered here is accessible from the admin UI.
 *
 * Seed catalog includes:
 *   floor-fill         — composed: setup-check → generate → verify → bundle → floor-check
 *   registry-extract   — subagent: draft pain-point registry from market-research docs
 *   template-draft-batch — subagent: CAS-First template authoring batch
 *   verify-sweep       — deterministic: re-verify generated_problems
 *   instance-bank-seed — deterministic: seed CAS instance banks
 *   golden-set-refresh — deterministic: refresh golden-set answer keys
 *   modality-rerender  — deterministic: batch manim/mathbox renders
 *   resonance-recompute — deterministic: re-aggregate resonance scores
 *   propose-pedagogy-pattern — subagent: draft candidate ped_* pattern
 *
 * CI convention: any package.json script matching bulk-op patterns MUST be
 * registered here or listed in src/playbooks/non-bulk-allowlist.json.
 */

import type { Playbook, DryRunEstimate } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const KILLED = false;   // kill switch — when true, all playbooks refuse

function requiredString(params: Record<string, unknown>, key: string): string {
  const v = params[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required param '${key}' is missing or empty`);
  }
  return v.trim();
}

// ---------------------------------------------------------------------------
// Seed catalog
// ---------------------------------------------------------------------------

const REGISTRY: Playbook[] = [
  // ── Floor-fill (composed) ─────────────────────────────────────────────
  {
    id: 'floor-fill',
    title: 'Floor Fill',
    description:
      'Fill every concept to the declared syllabus floor. Composed: setup-check → generate → verify → bundle → floor-check. The six-script activation chain as one click.',
    params_schema: {
      type: 'object',
      properties: {
        exam_id: { type: 'string', default: 'gate-ma', description: 'Exam pack id' },
        max_cost_usd: { type: 'number', default: 20, description: 'Hard cost cap for this run (USD)' },
        dry_run: { type: 'boolean', default: false, description: 'Estimate only — no generation' },
      },
      required: ['exam_id'],
    },
    estimator(params): DryRunEstimate {
      const costCap = (params.max_cost_usd as number | undefined) ?? 20;
      return {
        estimated_cost_usd: Math.min(costCap, 15),
        estimated_duration_human: '~overnight (generation) + 1–2 weeks (verification)',
        estimated_artifact_count: 410,  // ~5 items × 82 concepts
        notes: [
          'Verification is the long pole — Wolfram leg runs at 32% yield, 200/run capped.',
          'SymPy tier-0 checks carry the bulk; Wolfram arbitrates what SymPy cannot parse.',
          'Run will checkpoint and resume across nightly caps automatically.',
        ],
      };
    },
    executor: 'run-dispatcher',
    steps: ['setup-check', 'generate', 'verify-sweep', 'instance-bank-seed', 'content:bundle', 'ci:syllabus-floor'],
    guards: { kill_switch: true, quota_ledger: true },
  },

  // ── Registry extract (subagent) ────────────────────────────────────────
  {
    id: 'registry-extract',
    title: 'Registry Extract',
    description:
      'Subagent: draft pain-point registry entries from market-research docs mapped onto gate-ma.yml concept ids. Giri reviews the output before any module goes to "reviewed" status.',
    params_schema: {
      type: 'object',
      properties: {
        module: { type: 'string', description: 'Module to extract (e.g. linear-algebra, calculus)' },
        source_docs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Paths to source market-research docs',
        },
      },
      required: ['module'],
    },
    estimator(params): DryRunEstimate {
      return {
        estimated_cost_usd: 0.50,
        estimated_duration_human: '~10 min (subagent) + 2–3 h (Giri review)',
        estimated_artifact_count: 1,   // one .yml file per module
        notes: [
          `Target module: ${params.module ?? '(specify module)'}`,
          'Output: data/registry/pain-points/<module>.yml with review_status=draft.',
          'Giri must change review_status to reviewed after spot-checking ≥20 entries.',
        ],
      };
    },
    executor: 'subagent',
    guards: { kill_switch: true, quota_ledger: true },
  },

  // ── Template draft batch (subagent) ───────────────────────────────────
  {
    id: 'template-draft-batch',
    title: 'Template Draft Batch',
    description:
      'Subagent: CAS-First template authoring. Drafts SymPy templates for a module following the CAS-First certification discipline.',
    params_schema: {
      type: 'object',
      properties: {
        module: { type: 'string', description: 'Module to author templates for' },
        concept_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Concept ids to template (defaults to all in module)',
        },
      },
      required: ['module'],
    },
    estimator(_params): DryRunEstimate {
      return {
        estimated_cost_usd: 1.0,
        estimated_duration_human: '~30 min (subagent) + 1 h (Giri review)',
        estimated_artifact_count: 10,
        notes: ['CAS template certification requires Giri sign-off before templates are activated.'],
      };
    },
    executor: 'subagent',
    guards: { kill_switch: true, quota_ledger: true, requires_tier: 'T1' },
  },

  // ── Verify sweep (deterministic) ──────────────────────────────────────
  {
    id: 'verify-sweep',
    title: 'Verify Sweep',
    description:
      'Re-verify all generated problems to catch model drift. Demotes failures. Runs the existing verify-sweep skill logic.',
    params_schema: {
      type: 'object',
      properties: {
        exam_id: { type: 'string', default: 'gate-ma' },
        limit: { type: 'number', default: 200, description: 'Max items to verify (Wolfram rate limit)' },
        tier: { type: 'string', enum: ['sympy', 'wolfram', 'all'], default: 'all' },
      },
      required: [],
    },
    estimator(params): DryRunEstimate {
      const limit = (params.limit as number | undefined) ?? 200;
      return {
        estimated_cost_usd: limit * 0.002,
        estimated_duration_human: `~${Math.ceil(limit / 60)} min`,
        estimated_artifact_count: limit,
        notes: ['Wolfram leg: 1200ms/req, 200 req/run cap — queue runs nightly for full coverage.'],
      };
    },
    executor: 'job-runner',
    guards: { kill_switch: true, quota_ledger: true },
  },

  // ── Instance bank seed (deterministic) ────────────────────────────────
  {
    id: 'instance-bank-seed',
    title: 'Instance Bank Seed',
    description:
      'Seed CAS instance banks for offline-capable D0 delivery. Runs the SymPy template engine to pre-generate instance sets.',
    params_schema: {
      type: 'object',
      properties: {
        exam_id: { type: 'string', default: 'gate-ma' },
        instances_per_concept: { type: 'number', default: 10 },
        concept_ids: { type: 'array', items: { type: 'string' } },
      },
      required: [],
    },
    estimator(params): DryRunEstimate {
      const count = (params.instances_per_concept as number | undefined) ?? 10;
      return {
        estimated_cost_usd: 0,   // SymPy is ₹0
        estimated_duration_human: '~5 min',
        estimated_artifact_count: count * 82,
        notes: ['Pure SymPy — zero LLM cost. Output size ~8 MB for 82 concepts × 10 instances.'],
      };
    },
    executor: 'script',
    guards: { kill_switch: true, quota_ledger: true },
  },

  // ── Golden-set refresh (deterministic) ────────────────────────────────
  {
    id: 'golden-set-refresh',
    title: 'Golden-Set Refresh',
    description:
      'Refresh the golden-set answer keys used by the CI content gate. Run after adding new verified worked examples.',
    params_schema: {
      type: 'object',
      properties: {
        concept_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Concepts to refresh (defaults to golden-set concepts)',
        },
      },
      required: [],
    },
    estimator(_params): DryRunEstimate {
      return {
        estimated_cost_usd: 0,
        estimated_duration_human: '~1 min',
        estimated_artifact_count: 3,
        notes: ['Reads from existing atom_versions. No generation.'],
      };
    },
    executor: 'script',
    guards: { kill_switch: true, quota_ledger: true },
  },

  // ── Modality rerender (deterministic) ─────────────────────────────────
  {
    id: 'modality-rerender',
    title: 'Modality Rerender',
    description:
      'Batch render Manim mp4s and MathBox 3d-scene poster PNGs for concepts whose orchestrator decision says MANIM or MATHBOX.',
    params_schema: {
      type: 'object',
      properties: {
        exam_id: { type: 'string', default: 'gate-ma' },
        modality: { type: 'string', enum: ['manim', 'mathbox', 'all'], default: 'all' },
        concept_ids: { type: 'array', items: { type: 'string' } },
        max_renders: { type: 'number', default: 20, description: 'Cap renders per run' },
      },
      required: [],
    },
    estimator(params): DryRunEstimate {
      const max = (params.max_renders as number | undefined) ?? 20;
      return {
        estimated_cost_usd: max * 0.01,    // compute cost only
        estimated_duration_human: `~${max * 2} min`,
        estimated_artifact_count: max,
        notes: [
          'Manim renders via manim-service (Docker). MathBox posters via headless Chromium.',
          'Renders keyed (atom_id, version_n, kind) in media_artifacts — re-render only on version change.',
          'Poster budget: 2 MB gz total for posters segment.',
        ],
      };
    },
    executor: 'job-runner',
    guards: { kill_switch: true, quota_ledger: true },
  },

  // ── Resonance recompute (deterministic) ───────────────────────────────
  {
    id: 'resonance-recompute',
    title: 'Resonance Recompute',
    description:
      'Re-aggregate resonance_v1 scores for all atoms from teaching turns, attempts-bus, and rating events.',
    params_schema: {
      type: 'object',
      properties: {
        window_days: { type: 'number', default: 7, description: 'Rolling window for aggregation' },
        exam_id: { type: 'string', default: 'gate-ma' },
      },
      required: [],
    },
    estimator(_params): DryRunEstimate {
      return {
        estimated_cost_usd: 0,
        estimated_duration_human: '~2 min',
        estimated_artifact_count: 0,
        notes: [
          'Shadow mode only until ≥2 weeks AND ≥500 scored turns.',
          'Cells below n=30 report insufficient_n — never a fabricated score.',
        ],
      };
    },
    executor: 'script',
    guards: { kill_switch: true, quota_ledger: true },
  },

  // ── Propose pedagogy pattern (subagent) ───────────────────────────────
  {
    id: 'propose-pedagogy-pattern',
    title: 'Propose Pedagogy Pattern',
    description:
      'Subagent: draft a candidate ped_* pattern for the improvisation channel. Dry-run shows which blueprints it would touch.',
    params_schema: {
      type: 'object',
      properties: {
        pattern_name: { type: 'string', description: 'Proposed pattern name' },
        source: { type: 'string', enum: ['operator', 'ledger', 'research'], default: 'operator' },
        applicable_modules: {
          type: 'array',
          items: { type: 'string' },
          description: 'Which modules to apply this pattern to',
        },
        evidence: { type: 'string', description: 'Evidence citation (doc or experiment id)' },
      },
      required: ['pattern_name', 'applicable_modules'],
    },
    estimator(params): DryRunEstimate {
      const mods = (params.applicable_modules as string[] | undefined) ?? [];
      return {
        estimated_cost_usd: 0.30,
        estimated_duration_human: '~5 min (subagent)',
        estimated_artifact_count: 1,
        notes: [
          `Pattern would touch modules: ${mods.join(', ') || '(none specified)'}`,
          'Output: candidate entry appended to data/registry/pedagogy-patterns.yml.',
          'Candidates never affect students outside an experiment — nothing auto-activates.',
        ],
      };
    },
    executor: 'subagent',
    guards: { kill_switch: true, quota_ledger: true },
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const _byId = new Map(REGISTRY.map((p) => [p.id, p]));

/** Returns all registered playbooks. */
export function listPlaybooks(): Playbook[] {
  return REGISTRY;
}

/** Returns a single playbook by id, or null. */
export function getPlaybook(id: string): Playbook | null {
  return _byId.get(id) ?? null;
}

/** True if any kill switch is globally tripped (placeholder for real kill switch logic). */
export function isKillSwitchTripped(): boolean {
  return KILLED;
}

/** Validate params against a playbook's schema (returns error messages). */
export function validateParams(
  playbook: Playbook,
  params: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  const schema = playbook.params_schema;
  const required = (schema.required as string[] | undefined) ?? [];

  for (const key of required) {
    if (params[key] === undefined || params[key] === null || params[key] === '') {
      errors.push(`Required param '${key}' is missing`);
    }
  }

  return errors;
}

export { requiredString };
