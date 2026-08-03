/**
 * src/generation/run-dispatcher.ts
 *
 * Actually executes an admin-launched GenerationRun. Before v4.26.0,
 * POST /api/admin/runs only ever inserted a `generation_runs` row with
 * status='queued' — nothing in the codebase consumed it, so a run sat
 * "queued" forever no matter what the operator picked in RunLauncher
 * (see CLAUDE.md's Multi-Provider LLM Support section). dispatchRun() is
 * that missing consumer: it loads the run's config and drives real
 * generation through the existing generators, keeping status/cost_usd/
 * artifacts_count current as it goes.
 *
 * Two dispatch modes, mirroring GenerationRunConfig.target:
 *   - unit mode: target.curriculum_unit_specs[] present → generateUnitsForRun()
 *     (src/generation/curriculum-unit-orchestrator.ts)
 *   - atom mode (default): target.concept_ids[] / target.topic_id →
 *     generateConcept() per concept, one concept at a time, until
 *     quota.count atoms or quota.max_cost_usd is spent.
 *
 * In both modes, config.pipeline.llm_models[0] (the RunLauncher "LLM"
 * dropdown) is threaded through as the primary generation model id —
 * this is the piece that makes the dropdown actually drive which
 * provider generates content.
 *
 * NOT the same lane as src/generation/batch/poller.ts, which drives a
 * separate Gemini-batch-API pipeline keyed off generation_runs.batch_state.
 * This dispatcher only touches rows where batch_state is null (i.e. runs
 * created without opting into the batch lane — today, all admin/RunLauncher
 * runs).
 *
 * Runs in-process — single-instance deploy constraint, same as
 * jobs/scheduler.ts and batch/poller.ts. Triggered fire-and-forget from
 * admin-runs-routes.ts right after createRun(), and swept up by
 * resumeQueuedRuns() on server boot / periodically, mirroring
 * batch/poller.ts's resumeAllInFlightBatches for the other consumer.
 */

import {
  getRun,
  listRuns,
  markRunStarted,
  markRunComplete,
  markRunFailed,
  updateRunCost,
  incrementRunArtifacts,
} from './run-orchestrator';
import { generateConcept } from '../content/concept-orchestrator';
import { generateUnitsForRun } from './curriculum-unit-orchestrator';
import { CostMeter } from './cost-meter';
import { CONCEPT_MAP, getConceptsForTopic } from '../constants/concept-graph';
import type { GenerationRunConfig, GenerationRunRow } from '../experiments/types';

// Runs currently being dispatched in THIS process — guards against
// double-dispatch when the fire-and-forget call from handleCreate races
// a resumeQueuedRuns() sweep (both would otherwise see status='queued').
const _inFlight = new Set<string>();

/**
 * Drive one GenerationRun from 'queued' to 'complete'/'failed'. Safe to
 * call more than once for the same run id — a no-op once the row has
 * left 'queued' (already running elsewhere, or already finished).
 */
export async function dispatchRun(runId: string): Promise<void> {
  if (_inFlight.has(runId)) return;
  _inFlight.add(runId);
  try {
    const run = await getRun(runId);
    if (!run) return;
    if (run.status !== 'queued') return;
    await markRunStarted(runId);

    try {
      const { cost_usd } = run.config.target.curriculum_unit_specs?.length
        ? await dispatchUnitMode(run)
        : await dispatchAtomMode(run);
      await markRunComplete(runId, cost_usd);
    } catch (err) {
      const message = (err as Error)?.message ?? 'unknown dispatch error';
      console.error(`[run-dispatcher] run ${runId} failed: ${message}`);
      await markRunFailed(runId, message);
    }
  } finally {
    _inFlight.delete(runId);
  }
}

// ============================================================================
// Unit mode — target.curriculum_unit_specs[]
// ============================================================================

async function dispatchUnitMode(run: GenerationRunRow): Promise<{ cost_usd: number }> {
  const specs = run.config.target.curriculum_unit_specs ?? [];
  const meter = new CostMeter({ max_cost_usd: run.config.quota.max_cost_usd });

  const results = await generateUnitsForRun(specs, {
    generation_run_id: run.id,
    cost_meter: meter,
    pipeline_config: run.config.pipeline,
    verification_config: run.config.verification,
  });

  let costUsd = 0;
  for (const r of results) {
    costUsd += r.cost_usd;
    if (r.atoms_generated > 0) {
      await incrementRunArtifacts(run.id, r.atoms_generated);
    }
    await updateRunCost(run.id, costUsd);
  }
  return { cost_usd: costUsd };
}

// ============================================================================
// Atom mode — target.concept_ids[] / target.topic_id (the common path)
// ============================================================================

async function dispatchAtomMode(run: GenerationRunRow): Promise<{ cost_usd: number }> {
  const conceptIds = resolveTargetConcepts(run.config);
  if (conceptIds.length === 0) {
    throw new Error(
      'no concepts resolved from config.target — set target.concept_ids, or a target.topic_id with concepts registered in the concept graph',
    );
  }

  const modelId = run.config.pipeline.llm_models?.[0];
  const targetCount = Math.max(1, run.config.quota.count);
  const maxCostUsd = run.config.quota.max_cost_usd;

  let artifactsCount = 0;
  let costUsd = 0;

  // One generateConcept() call per concept can itself produce several
  // atoms (up to all 11 atom_types) — count/budget are checked BETWEEN
  // concepts, not atom-by-atom, so a run can slightly overshoot
  // quota.count on its last concept rather than stopping mid-concept.
  for (const conceptId of conceptIds) {
    if (artifactsCount >= targetCount || costUsd >= maxCostUsd) break;

    const topicFamily = CONCEPT_MAP.get(conceptId)?.topic ?? conceptId;
    const draft = await generateConcept({
      concept_id: conceptId,
      topic_family: topicFamily,
      dry_run: false,
      model_id: modelId,
      generation_run_id: run.id,
      // Deliberately NOT passing quota.max_cost_usd as cost_cap_usd here:
      // that param is concept-cost.ts's PER-CONCEPT MONTHLY cap (shared
      // across every run that ever touches this concept), not a
      // per-run budget. Run-level spend is bounded by this loop instead.
    });

    costUsd += draft.total_cost_usd;
    if (draft.atoms.length > 0) {
      artifactsCount += draft.atoms.length;
      await incrementRunArtifacts(run.id, draft.atoms.length);
    }
    await updateRunCost(run.id, costUsd);
  }

  return { cost_usd: costUsd };
}

function resolveTargetConcepts(config: GenerationRunConfig): string[] {
  if (config.target.concept_ids && config.target.concept_ids.length > 0) {
    return config.target.concept_ids;
  }
  if (config.target.topic_id) {
    return getConceptsForTopic(config.target.topic_id).map((c) => c.id);
  }
  return [];
}

// ============================================================================
// Crash resilience
// ============================================================================

/**
 * Boot-time / periodic sweep: pick up any run still 'queued' — e.g. the
 * server restarted between createRun() and the fire-and-forget
 * dispatchRun() call, or a prior dispatch crashed the process before
 * markRunStarted() landed. Only the atom/unit dispatch lane; the
 * Gemini-batch lane has its own resumeAllInFlightBatches (batch/poller.ts).
 */
export async function resumeQueuedRuns(): Promise<{ resumed: number }> {
  const queued = await listRuns({ status: 'queued', limit: 50 });
  for (const run of queued) {
    void dispatchRun(run.id).catch((err) => {
      console.error(`[run-dispatcher] resume failed for ${run.id}: ${(err as Error).message}`);
    });
  }
  return { resumed: queued.length };
}
