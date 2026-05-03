/**
 * src/experiments/
 *
 * The experiment spine for Vidhya's Content R&D Loop.
 *
 *   registry    — CRUD over experiments + assignments
 *   snapshotter — append-only mastery time-series (lift baseline)
 *   lift        — compute lift_v1 (mastery delta vs matched control)
 *   types       — schema mirror
 *
 * Entry-point ergonomics: import from this barrel rather than reaching into
 * sub-files.
 */

export * from './types';
export {
  generateExperimentId,
  createExperiment,
  getExperiment,
  listExperiments,
  updateExperimentStatus,
  updateExperimentLift,
  assignTarget,
  getAssignments,
  getAssignmentForTarget,
} from './registry';
export {
  snapshotConceptMastery,
  snapshotAllActiveSessions,
} from './snapshotter';
export type {
  SnapshotOneInput,
  SnapshotSessionResult,
} from './snapshotter';
export { computeLift, computePyqAccuracyDelta } from './lift';
export type { ComputeLiftOptions, ComputePyqDeltaOptions } from './lift';

export { suggestForExperiment } from './ledger-suggestions';
export type { LedgerSuggestion, SuggestionKind, ExperimentSummary } from './ledger-suggestions';
