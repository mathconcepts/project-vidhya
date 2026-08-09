/**
 * src/playbooks/types.ts
 *
 * Playbook Layer (Track E5) — the unified single-click interface for every
 * bulk operation.
 *
 * Every deterministic bulk compute op maps to a Playbook row. Authoring-class
 * work (judgment required) maps to a SubagentPlaybook that prepares a brief
 * but requires an explicit human launch.
 *
 * "Hereafter enforced": the CI convention check (scripts/check-playbook-convention.ts)
 * fails if a package.json script matching bulk-op naming patterns (content:*,
 * demo:seed*, batch/generate/verify verbs) is not registered here or in
 * src/playbooks/non-bulk-allowlist.json.
 */

type JSONSchema4 = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Executor types
// ---------------------------------------------------------------------------

export type PlaybookExecutor =
  | 'job-runner'       // existing checkpointed job-runner (crash-resumable)
  | 'run-dispatcher'   // existing run-dispatcher.ts (generation runs)
  | 'batch'            // provider Batch API (async, ~50% cheaper)
  | 'script'           // tsx script (deterministic, one-shot)
  | 'subagent';        // judgment work — prepares brief, human fires Claude

export type GenerationTier = 'T0' | 'T1' | 'T2' | 'T3';

export interface PlaybookGuards {
  kill_switch: true;           // every playbook MUST have a kill switch
  quota_ledger: true;          // every playbook MUST respect the quota ledger
  requires_tier?: GenerationTier;
}

// ---------------------------------------------------------------------------
// Dry-run estimate — shown before any spend
// ---------------------------------------------------------------------------

export interface DryRunEstimate {
  estimated_cost_usd: number;
  estimated_duration_human: string;  // e.g. "~overnight", "~10 min"
  estimated_artifact_count: number;
  notes?: string[];
}

// ---------------------------------------------------------------------------
// Playbook run state
// ---------------------------------------------------------------------------

export type PlaybookRunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'aborted';

export interface PlaybookRunStep {
  playbook_id: string;
  status: PlaybookRunStatus;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface PlaybookRun {
  run_id: string;
  playbook_id: string;
  params: Record<string, unknown>;
  status: PlaybookRunStatus;
  started_at: string;
  completed_at?: string;
  /** For composed playbooks: per-step status. */
  steps?: PlaybookRunStep[];
  /** For subagent playbooks: path to materialized brief. */
  brief_path?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Playbook interface
// ---------------------------------------------------------------------------

export interface Playbook {
  id: string;
  title: string;
  description: string;
  /** JSON Schema for operator-supplied params (used to render the form). */
  params_schema: JSONSchema4;
  /** Produce a cost/duration estimate before any spend. */
  estimator(params: Record<string, unknown>): DryRunEstimate;
  /** Where this playbook runs. */
  executor: PlaybookExecutor;
  /**
   * For composed playbooks: ordered list of child playbook ids.
   * The runner executes them in sequence; failure halts and marks the chain
   * resumable from the failed step (ComposedPlaybookStepFailed).
   */
  steps?: string[];
  guards: PlaybookGuards;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class PlaybookGuardTripped extends Error {
  constructor(public readonly playbookId: string, public readonly guard: string) {
    super(`PlaybookGuardTripped [${playbookId}]: guard '${guard}' refused execution`);
    this.name = 'PlaybookGuardTripped';
  }
}

export class ComposedPlaybookStepFailed extends Error {
  constructor(
    public readonly playbookId: string,
    public readonly failedStep: string,
    public readonly stepError: string,
  ) {
    super(
      `ComposedPlaybookStepFailed [${playbookId}]: step '${failedStep}' failed — '${stepError}'. Chain halted; resumable from this step.`,
    );
    this.name = 'ComposedPlaybookStepFailed';
  }
}

export class SubagentBriefIncompleteError extends Error {
  constructor(public readonly playbookId: string, public readonly missingInputs: string[]) {
    super(
      `SubagentBriefIncompleteError [${playbookId}]: missing inputs — ${missingInputs.join(', ')}`,
    );
    this.name = 'SubagentBriefIncompleteError';
  }
}
