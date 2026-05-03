/**
 * src/generation/batch/types.ts
 *
 * Type-level state machine for batch-generation runs. Mirrors the
 * `batch_state` column in migration 026.
 *
 * Lifecycle:
 *
 *   queued → prepared → submitted → downloading → processing → complete
 *                                                     │
 *                            from any state ──────────┴── failed | aborted
 *
 * Each transition is durable (DB write) BEFORE the next side-effect.
 * That's what makes mid-flight resume safe.
 */

export type BatchState =
  | 'queued'        // run created, atom_specs persisted, JSONL not yet built
  | 'prepared'      // JSONL built on disk; ready to submit
  | 'submitted'     // submitted to provider; we hold a batch_id; polling
  | 'downloading'   // provider says complete; pulling output JSONL
  | 'processing'    // results downloaded; ingesting per-atom (idempotent)
  | 'complete'      // all batch_jobs rows have processed_at
  | 'failed'        // unrecoverable (provider error, validation, budget)
  | 'aborted';      // operator-cancelled

export const TERMINAL_STATES: ReadonlySet<BatchState> = new Set([
  'complete',
  'failed',
  'aborted',
]);

export const IN_FLIGHT_STATES: ReadonlySet<BatchState> = new Set([
  'queued',
  'prepared',
  'submitted',
  'downloading',
  'processing',
]);

export type BatchProvider = 'gemini' | 'openai' | 'anthropic';

// ----------------------------------------------------------------------------
// What we send to the provider
// ----------------------------------------------------------------------------

/**
 * One sub-job inside a batch. The custom_id is deterministic — the same
 * (run_id, atom_spec) always produces the same id, so we can safely
 * rebuild a batch's JSONL after a crash and the provider de-dupes by id.
 */
export interface BatchJob {
  custom_id: string;
  atom_spec: AtomSpec;
}

/**
 * The structured input we want the LLM to satisfy. NOT student-specific
 * (no user_id, no session_id) — surveillance-cliff invariant.
 */
export interface AtomSpec {
  concept_id: string;
  atom_type: string;            // 'mcq' | 'free_text' | 'visual_analogy' | …
  difficulty: 'easy' | 'medium' | 'hard';
  prompt_template_id: string;   // resolves to a deterministic template body
  prompt_vars: Record<string, string | number | boolean>;
  /** Free-form notes; included verbatim in the prompt. */
  hints?: string[];
}

// ----------------------------------------------------------------------------
// What the provider returns
// ----------------------------------------------------------------------------

export interface BatchSubmitResult {
  batch_id: string;
  submitted_at: string;
  /** Provider-reported expected completion (best-effort; may be null). */
  estimated_complete_at?: string;
}

export type BatchPollStatus =
  | { kind: 'pending' }
  | { kind: 'running'; progress?: number }   // 0..1 if provider reports it
  | { kind: 'complete'; output_url: string }
  | { kind: 'failed'; reason: string }
  | { kind: 'expired' };                      // 24h SLA blown

/**
 * One row from the provider's output JSONL. custom_id is what we sent;
 * use it to look up the corresponding batch_jobs row.
 */
export interface BatchResultRow {
  custom_id: string;
  status: 'succeeded' | 'failed';
  /** Parsed atom content when status='succeeded'. */
  result?: unknown;
  /** Provider error message when status='failed'. */
  error?: string;
}

// ----------------------------------------------------------------------------
// Adapter interface — every provider's adapter implements this
// ----------------------------------------------------------------------------

export interface BatchAdapter {
  readonly provider: BatchProvider;

  /**
   * Send the JSONL to the provider. Idempotent: passing the same
   * `display_name` twice returns the same batch_id. (Provider-specific
   * adapters enforce this — most accept a deterministic display_name we
   * derive from run_id.)
   */
  submitBatch(input: {
    display_name: string;
    jsonl: string;
  }): Promise<BatchSubmitResult>;

  pollBatch(batch_id: string): Promise<BatchPollStatus>;

  /** Returns the raw output JSONL text. */
  downloadResults(output_url: string): Promise<string>;

  /** Best-effort cancel; never throws on unknown batch_id. */
  cancelBatch(batch_id: string): Promise<void>;

  /** Parse a JSONL output into typed rows. */
  parseResults(jsonl: string): BatchResultRow[];
}
