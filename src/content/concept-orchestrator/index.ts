/**
 * Concept Generation Framework v1 — module barrel.
 *
 * Public surface for callers (admin routes, regen-scanner, tests).
 * Internal modules (atom-versions DB layer, llm-judge, multi-llm-consensus)
 * are exported for unit-test access; production callers should use
 * generateConcept() as the single entry point.
 */

export { generateConcept } from './orchestrator';
export type {
  ConceptDraft,
  GeneratedAtom,
  GenerationMeta,
  GenerationSource,
  OrchestratorOptions,
} from './types';

export { loadTemplates, getTemplate, _resetTemplateCacheForTests } from './template-loader';
export type { AtomTemplate, TopicFamilyTemplate } from './template-loader';

export { groundForLO, formatPyqContext } from './pyq-grounding';
export type { PyqGrounding } from './pyq-grounding';

export { canSpend, recordSpend, readState, DEFAULT_MONTHLY_CAP_USD } from './concept-cost';
export type { CostState } from './concept-cost';

export { scoreAtom, passesGate } from './llm-judge';
export type { JudgeScore } from './llm-judge';

export { compareMathAtoms, requiresConsensus } from './multi-llm-consensus';
export type { ConsensusResult } from './multi-llm-consensus';

export { appendVersion, activate, listVersions, getActiveVersion } from './atom-versions';
export type { AtomVersion } from './atom-versions';

export {
  createJob,
  getJob,
  recordProgress,
  recordResult,
  recordFailure,
  _resetJobsForTests,
  _jobCountForTests,
} from './jobs';
export type { JobState, JobStatus } from './jobs';

export type { ProgressEvent } from './types';

export { buildQueue } from './queue';
export type { QueueRow, ConceptState, QueueOptions } from './queue';

export {
  maybeQueueRegenForStudent,
  readStudentOverrides,
  PERSONAL_FAILURE_THRESHOLD,
  PERSONAL_FAILURE_WINDOW_DAYS,
  PERSONAL_OVERRIDE_TTL_DAYS,
} from './personalized-regen';
export type { MaybeRegenResult } from './personalized-regen';

export {
  createExperiment,
  getRunningExperiment,
  assignBucket,
  evaluateRipeExperiments,
  AB_WINDOW_DAYS,
  AB_MIN_BUCKET_SIZE,
  AB_MIN_DELTA,
} from './ab-tester';
export type { AbExperiment, AbStatus, AssignmentResult, ExperimentEvaluation } from './ab-tester';

export {
  buildPatternKey,
  signatureFromMeta,
  recordOutcome,
  topPatterns,
} from './prompt-patterns';
export type { PatternSignature, PatternOutcome, PatternStats } from './prompt-patterns';

export {
  writeArtifact,
  markFailed as markMediaFailed,
  getActiveArtifact,
  listForAtom as listMediaForAtom,
  pruneSuperseded as pruneSupersededMedia,
  pathForArtifact,
  MEDIA_STORAGE_DIR,
} from './media-artifacts';
export type { MediaArtifact, MediaKind, MediaStatus } from './media-artifacts';

export { renderScene as renderGifScene } from './gif-generator';
export type { SceneDescription, ParametricScene, FunctionTraceScene, RenderResult } from './gif-generator';

export {
  shouldNarrate,
  extractNarrationScript,
  generateNarration,
} from './tts-generator';
export type { TtsResult } from './tts-generator';
