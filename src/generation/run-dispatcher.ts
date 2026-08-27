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
 * Three dispatch modes, mirroring GenerationRunConfig.target:
 *   - unit mode: target.curriculum_unit_specs[] present → generateUnitsForRun()
 *     (src/generation/curriculum-unit-orchestrator.ts)
 *   - practice-item mode: target.practice_item_specs[] present → seeds the
 *     spec array into the batch orchestrator's queued -> prepared
 *     transition (src/generation/batch/poller.ts's prepareBatchRun) and
 *     returns; generation itself happens asynchronously on the batch
 *     poller's existing lane (see the "Practice-item mode" section below).
 *     This is the ONE mode that deliberately opts a row into
 *     generation_runs.batch_state — see that section for why.
 *   - atom mode (default): target.concept_ids[] / target.topic_id →
 *     generateConcept() per concept, one concept at a time, until
 *     quota.count atoms or quota.max_cost_usd is spent.
 *
 * In unit/atom mode, config.pipeline.llm_models[0] (the RunLauncher "LLM"
 * dropdown) is threaded through as the primary generation model id —
 * this is the piece that makes the dropdown actually drive which
 * provider generates content. Practice-item mode's primary model is fixed
 * (the batch pipeline submits only through Gemini — see below); llm_models[0]
 * is used there only for the run's own cost estimate.
 *
 * config.preview (atom mode only): threads dry_run into generateConcept()
 * so admin-launched runs can preview content (real LLM call, nothing
 * persisted to atom_versions) — see GenerationRunConfig.preview's doc
 * comment for why this isn't named dry_run at the config level.
 *
 * Unit/atom mode dispatch is synchronous and NOT the same lane as
 * src/generation/batch/poller.ts, which drives a separate Gemini-batch-API
 * pipeline keyed off generation_runs.batch_state — those two modes only
 * ever touch rows where batch_state is null. Practice-item mode is the
 * deliberate exception: it hands the run OFF to that same batch lane (see
 * the "Practice-item mode" section below for the full lifecycle).
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
import { sanitiseTierModels } from '../content/concept-orchestrator/model-tiers';
import { prepareBatchRun } from './batch/poller';
import { practiceItemSpecsToAtomSpecs } from './practice-item-factory/spec-to-atom';
import { estimatePracticeItemBatchCostUsd } from './practice-item-factory/cost';
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
      if (run.config.target.curriculum_unit_specs?.length) {
        const { cost_usd } = await dispatchUnitMode(run);
        await markRunComplete(runId, cost_usd);
      } else if (run.config.target.practice_item_specs?.length) {
        // Batch/async mode: seeds the batch (queued -> prepared) and
        // returns WITHOUT calling markRunComplete — status deliberately
        // stays 'running'. The rest of the lifecycle (submit -> poll ->
        // download -> process -> complete) happens on the SAME periodic
        // batch poller sweep that drives every other in-flight batch run
        // (src/generation/batch/poller.ts), which reconciles status to
        // 'complete'/'failed' once batch_state reaches a terminal state —
        // potentially long after this call returns (up to the provider's
        // 24h batch SLA). See dispatchPracticeItemMode's doc comment.
        await dispatchPracticeItemMode(run);
      } else {
        const { cost_usd } = await dispatchAtomMode(run);
        await markRunComplete(runId, cost_usd);
      }
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
  // NOTE: config.preview is NOT threaded through here yet — unit mode's
  // own dry_run context field (curriculum-unit-orchestrator.ts) exists
  // but generateUnitsForRun() never receives it from this call site. Out
  // of scope for the concept-orchestrator migration (concept-orchestrator
  // only ever dispatches atom mode); flagged as follow-up if unit-mode
  // preview is wanted later.
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
// Practice-item mode — target.practice_item_specs[]
//
// Closes the wiring gap recorded in docs/ops/content-verification-runbook.md
// §3.2: turns the run's practice_item_specs[] into AtomSpec[] (via
// spec-to-atom.ts's deterministic builder) and seeds them into the batch
// orchestrator's queued -> prepared transition (via
// src/generation/batch/poller.ts's prepareBatchRun, which reuses the
// module's ONE shared orchestrator instance — same adapter, same T4a
// launch guard, same per-format cost estimator poller.ts already wires for
// the poll-side path). Unlike atom/unit mode, this does NOT run generation
// synchronously: prepare() only persists atom_specs + writes the JSONL +
// checks the budget/launch-guard preconditions. Submission and everything
// after (poll -> download -> process -> gate-ledger writes -> bank writes)
// is the batch poller's existing async lane (boot resume + the 5-min cron
// tick, jobs/scheduler.ts) — already fully wired since P3a.
// ============================================================================

async function dispatchPracticeItemMode(run: GenerationRunRow): Promise<void> {
  const specs = run.config.target.practice_item_specs ?? [];
  if (specs.length === 0) {
    throw new Error(
      'no practice_item_specs supplied for a practice-item run — set target.practice_item_specs[]',
    );
  }

  // Throws PracticeItemSpecValidationError naming the exact spec index +
  // field on a malformed entry (D8) — see spec-to-atom.ts. Re-validates
  // even though admin-runs-routes.ts already validates the same shape at
  // POST time: defense-in-depth for any caller that reaches createRun()
  // without going through that route (tests, scripts, a future caller).
  // Checked BEFORE the provider precondition below: a malformed request is
  // a client-input problem, independent of whether the environment is
  // otherwise ready to launch.
  const atomSpecs = practiceItemSpecsToAtomSpecs(specs);
  const modelId = run.config.pipeline.llm_models?.[0];

  // The practice-item batch pipeline submits ONLY through Gemini's Batch
  // API — src/generation/batch/gemini-adapter.ts's DEFAULT_MODEL is fixed
  // to gemini-2.5-flash, and poller.ts's getOrchestrator() only ever
  // constructs a Gemini adapter. Refuse loudly here, naming the missing
  // env var, rather than letting a bare-key submitBatch() call fail with
  // an opaque HTTP error deep inside the async batch lifecycle (D8 —
  // "names the missing... provider"). The launch guard
  // (assertPracticeItemLaunchReady, wired into prepare() below) separately
  // covers the mcq/msq second-provider and nat/Wolfram preconditions —
  // this check is the one precondition it does not: the primary itself.
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "practice-item run refused at launch: no provider configured for the batch pipeline's primary " +
        'model (gemini-2.5-flash) — set GEMINI_API_KEY. The practice-item batch pipeline submits only ' +
        "through Gemini's Batch API (src/generation/batch/gemini-adapter.ts); a distinct second provider " +
        'for mcq/msq consensus and WOLFRAM_APP_ID for nat are checked separately at launch.',
    );
  }

  const result = await prepareBatchRun(run.id, atomSpecs);
  if (result.kind === 'transitioned' && result.to === 'failed') {
    // The orchestrator already wrote the precise reason (launch guard or
    // budget_exceeded) onto generation_runs.error — surface THAT message
    // rather than a generic one, so the operator sees exactly what to fix.
    const fresh = await getRun(run.id);
    throw new Error(fresh?.error ?? 'practice-item batch run failed at prepare (no error recorded)');
  }

  // Success: batch_state is now 'prepared' and durable (batch_jobs rows +
  // JSONL on disk). Record the estimate as the run's committed cost — the
  // real per-item cost is only known once the batch actually bills, which
  // this codebase does not (yet) reconcile back into cost_usd; the locked
  // estimate is the best number available at this point, same "rough but
  // present" bar dry-run.ts's estimate uses.
  const costUsd = estimatePracticeItemBatchCostUsd(specs, modelId);
  await updateRunCost(run.id, costUsd);
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
  // Per-tier models chosen by the operator in the RunLauncher. Unknown tiers
  // are dropped with a warning rather than passed through: a run that believes
  // it selected a model but did not is worse than one told its input was
  // ignored. Ignored entirely when llm_models pins a single model, which is
  // the legacy whole-batch override.
  const { models: tierModels, warnings: tierWarnings } = sanitiseTierModels(
    (run.config.pipeline as { tier_models?: unknown }).tier_models,
  );
  for (const w of tierWarnings) console.warn(`[run-dispatcher] run ${run.id}: ${w}`);
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
      dry_run: run.config.preview ?? false,
      model_id: modelId,
      tier_models: tierModels,
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
