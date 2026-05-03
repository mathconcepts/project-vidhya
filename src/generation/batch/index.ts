/**
 * src/generation/batch/index.ts
 *
 * Barrel for the batch-generation module. Pure HTTP + types in PR-A1;
 * orchestrator + poller land in PR-A2 / PR-A3.
 */

export type {
  BatchState,
  BatchProvider,
  BatchAdapter,
  BatchJob,
  AtomSpec,
  BatchSubmitResult,
  BatchPollStatus,
  BatchResultRow,
} from './types';
export { TERMINAL_STATES, IN_FLIGHT_STATES } from './types';

export { customIdFor, buildJobs, buildJsonl, renderPrompt, stableStringify } from './jsonl-builder';

export { createGeminiBatchAdapter } from './gemini-adapter';
